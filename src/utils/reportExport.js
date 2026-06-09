import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const EXPORT_FORMATS = {
  CSV: "csv",
  EXCEL: "excel",
  PDF: "pdf",
};

function stringifyExportValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function escapeCsv(value) {
  const stringValue = stringifyExportValue(value);
  if (!/[",\r\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return stringifyExportValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilePart(value) {
  const safeValue = stringifyExportValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safeValue || "grievance-report";
}

function reportFileName(title, selectedReport, extension) {
  const datePart = new Date().toISOString().slice(0, 10);
  return `${sanitizeFilePart(`${title}-${selectedReport}`)}-${datePart}.${extension}`;
}

function downloadFile(fileName, content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

function reportExportRows(columns, reports) {
  return reports.map((row) => columns.map((column) => stringifyExportValue(column.render(row))));
}

function buildCsv(columns, rows) {
  const header = columns.map((column) => column.label);
  return [header, ...rows].map((cells) => cells.map(escapeCsv).join(",")).join("\r\n");
}

function buildExcelHtml(title, columns, rows) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #888; padding: 6px; mso-number-format: "\\@"; }
    th { background: #f0f0f0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
}

function createProtectedPdf(options = {}) {
  const baseOptions = {
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    ...options,
  };

  try {
    return new jsPDF({
      ...baseOptions,
      encryption: {
        userPassword: "",
        ownerPassword: `tasafmis-${Date.now()}`,
        userPermissions: ["print"],
      },
    });
  } catch (e) {
    return new jsPDF(baseOptions);
  }
}

function getImageFormat(mimeType) {
  const normalized = (mimeType || "").toLowerCase();
  if (normalized.includes("png")) return "PNG";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "JPEG";
  if (normalized.includes("webp")) return "WEBP";
  return null;
}

async function blobToDataUrl(blob, mimeType) {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const bufferConstructor = globalThis.Buffer;
  if (bufferConstructor && typeof blob.arrayBuffer === "function") {
    const arrayBuffer = await blob.arrayBuffer();
    return `data:${mimeType};base64,${bufferConstructor.from(arrayBuffer).toString("base64")}`;
  }

  return null;
}

async function loadImageAsset(paths) {
  for (const path of paths) {
    try {
      const response = await fetch(path);

      if (response.ok) {
        const mimeType = response.headers.get("content-type") || "";
        const format = getImageFormat(mimeType);

        if (!format) continue;

        const blob = await response.blob();
        const data = await blobToDataUrl(blob, mimeType);

        if (data) return { data, format };
      }
    } catch (e) {
      // Missing branding assets should not block report export.
    }
  }

  return null;
}

async function loadLogo() {
  return loadImageAsset(["/front/tasafMIS.png", "/tasafMIS.png"]);
}

async function loadGovernmentLogo() {
  return loadImageAsset(["/front/bibiNabwana.png", "/bibiNabwana.png"]);
}

function fitTextToWidth(doc, value, width) {
  const lines = doc.splitTextToSize(String(value || "-"), width);
  if (!lines.length) return "-";
  if (lines.length === 1) return lines[0];
  const firstLine = lines[0];
  return firstLine.length > 3 ? `${firstLine.slice(0, firstLine.length - 3)}...` : firstLine;
}

function drawHeader({ doc, pageWidth, margin, rightLogo, leftLogo, title }) {
  const headerHeight = 40;
  const centerX = pageWidth / 2;

  doc.setFillColor(0, 102, 102);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  if (leftLogo) {
    try {
      doc.addImage(leftLogo.data, leftLogo.format, margin, 8, 24, 24);
    } catch (error) {
      console.warn("Failed to add government logo to PDF header:", error);
    }
  }

  if (rightLogo) {
    try {
      doc.addImage(rightLogo.data, rightLogo.format, pageWidth - margin - 33, 6, 33, 28);
    } catch (error) {
      console.warn("Failed to add TASAF logo to PDF header:", error);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text("MFUKO WA MAENDELEO YA JAMII (TASAF III)", centerX, 12, { align: "center" });

  doc.setFontSize(11);
  doc.text("MPANGO WA KUNUSURU KAYA MASIKINI", centerX, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const titleLines = doc
    .splitTextToSize(String(title || "").toUpperCase(), pageWidth - 100)
    .slice(0, 2);
  doc.text(titleLines, centerX, 24, { align: "center" });

  doc.setTextColor(0, 0, 0);
}

function addWatermark(doc, logo, pageWidth, pageHeight) {
  if (!logo) return;

  const logoWidth = 150;
  const logoHeight = 130;
  const x = (pageWidth - logoWidth) / 2;
  const y = (pageHeight - logoHeight) / 2;

  try {
    doc.setGState(new doc.GState({ opacity: 0.07 }));
    doc.addImage(logo.data, logo.format, x, y, logoWidth, logoHeight);
    doc.setGState(new doc.GState({ opacity: 1 }));
  } catch (error) {
    console.warn("Failed to add TASAF watermark to PDF:", error);
  }
}

function addFooter(doc, pageWidth, pageHeight) {
  const pageNumber = doc.getCurrentPageInfo().pageNumber;
  const totalPages = doc.getNumberOfPages();

  doc.setDrawColor(0, 102, 102);
  doc.line(12, pageHeight - 10, pageWidth - 12, pageHeight - 10);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 12, pageHeight - 5, {
    align: "right",
  });
}

function drawMetadataBoxes({
  doc,
  margin,
  pageWidth,
  startY,
  generatedDate,
  reportName,
  totalRecords,
}) {
  const contentWidth = pageWidth - margin * 2;
  const gap = 3;
  const boxHeight = 14;
  const boxWidth = (contentWidth - gap * 2) / 3;
  const metadataItems = [
    {
      label: "Date:",
      value: generatedDate?.toLocaleString() || "-",
    },
    {
      label: "Report:",
      value: reportName || "-",
    },
    {
      label: "Records:",
      value: totalRecords,
    },
  ];

  let x = margin;

  metadataItems.forEach((item) => {
    doc.setFillColor(240, 248, 248);
    doc.rect(x, startY, boxWidth, boxHeight, "F");

    doc.setDrawColor(0, 102, 102);
    doc.rect(x, startY, boxWidth, boxHeight);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text(item.label, x + 2, startY + 5);

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(fitTextToWidth(doc, item.value, boxWidth - 4), x + 2, startY + 11);

    x += boxWidth + gap;
  });

  return startY + boxHeight;
}

function drawSummaryBox({ doc, margin, pageWidth, startY, totalRecords }) {
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(230, 245, 245);
  doc.rect(margin, startY, contentWidth, 16, "F");

  doc.setDrawColor(0, 102, 102);
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 16);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Summary", margin + 3, startY + 5);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Total Records: ${totalRecords}`, margin + 3, startY + 12);

  return startY + 16;
}

function getReportDisplayName(title, selectedReport) {
  const titleValue = stringifyExportValue(title);
  const reportName = titleValue.replace(/^Grievance Reports\s*-\s*/i, "");
  return reportName || selectedReport || titleValue;
}

function tableColumnStyles(columnCount) {
  const styles = {
    0: { cellWidth: 10 },
  };

  if (columnCount > 7) {
    styles[1] = { cellWidth: 18 };
    styles[2] = { cellWidth: 30 };
  }

  return styles;
}

export async function exportGrievanceReportPdf({
  title,
  selectedReport,
  columns,
  reports,
  generatedDate = new Date(),
  save = true,
}) {
  const rows = reportExportRows(columns, reports);
  const pageOrientation = columns.length > 6 ? "landscape" : "portrait";
  const logo = await loadLogo();
  const governmentLogo = await loadGovernmentLogo();
  const doc = createProtectedPdf({ orientation: pageOrientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const reportName = getReportDisplayName(title, selectedReport);
  const fileName = reportFileName(title, selectedReport, "pdf");

  drawHeader({
    doc,
    pageWidth,
    margin,
    rightLogo: logo,
    leftLogo: governmentLogo,
    title,
  });

  let contentY = 48;

  contentY = drawMetadataBoxes({
    doc,
    margin,
    pageWidth,
    startY: contentY,
    generatedDate,
    reportName,
    totalRecords: rows.length,
  });

  contentY += 6;
  contentY = drawSummaryBox({
    doc,
    margin,
    pageWidth,
    startY: contentY,
    totalRecords: rows.length,
  });
  contentY += 8;

  addWatermark(doc, logo, pageWidth, pageHeight);

  autoTable(doc, {
    startY: contentY,
    head: [["Na.", ...columns.map((column) => stringifyExportValue(column.label).toUpperCase())]],
    body: rows.map((row, index) => [index + 1, ...row]),
    theme: "grid",
    styles: {
      fontSize: columns.length > 6 ? 7 : 9,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [0, 102, 102],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: tableColumnStyles(columns.length + 1),
    margin: {
      left: 12,
      right: 12,
      top: 52,
    },
    didDrawPage: () => {
      const currentPageNumber = doc.getCurrentPageInfo().pageNumber;

      if (currentPageNumber > 1) {
        drawHeader({
          doc,
          pageWidth,
          margin,
          rightLogo: logo,
          leftLogo: governmentLogo,
          title,
        });
        addWatermark(doc, logo, pageWidth, pageHeight);
      }

      addFooter(doc, pageWidth, pageHeight);
    },
  });

  if (save) {
    doc.save(fileName);
  }

  return doc;
}

export async function exportReport(format, title, selectedReport, columns, reports) {
  const rows = reportExportRows(columns, reports);

  if (format === EXPORT_FORMATS.CSV) {
    downloadFile(
      reportFileName(title, selectedReport, "csv"),
      `\uFEFF${buildCsv(columns, rows)}`,
      "text/csv;charset=utf-8;",
    );
    return null;
  }

  if (format === EXPORT_FORMATS.EXCEL) {
    downloadFile(
      reportFileName(title, selectedReport, "xls"),
      buildExcelHtml(title, columns, rows),
      "application/vnd.ms-excel;charset=utf-8;",
    );
    return null;
  }

  if (format === EXPORT_FORMATS.PDF) {
    return exportGrievanceReportPdf({
      title,
      selectedReport,
      columns,
      reports,
    });
  }

  return null;
}
