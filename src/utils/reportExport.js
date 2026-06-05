const PDF_PAGE_WIDTH = 842;
const PDF_PAGE_HEIGHT = 595;
const PDF_MARGIN = 32;
const PDF_CELL_PADDING = 4;
const PDF_FONT_SIZE = 7;
const PDF_HEADER_FONT_SIZE = 7;
const PDF_LINE_HEIGHT = 10;

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

function pdfNumber(value) {
  const rounded = Number(value)
    .toFixed(2)
    .replace(/\.?0+$/, "");
  return rounded === "-0" || rounded === "" ? "0" : rounded;
}

function padLeft(value, length) {
  let padded = String(value);
  while (padded.length < length) {
    padded = `0${padded}`;
  }
  return padded;
}

function pdfHexString(value) {
  let hex = "FEFF";
  stringifyExportValue(value)
    .split("")
    .forEach((character) => {
      hex = `${hex}${padLeft(character.charCodeAt(0).toString(16).toUpperCase(), 4)}`;
    });
  return `<${hex}>`;
}

function drawText(x, y, text, fontSize = PDF_FONT_SIZE, font = "F1") {
  return `BT /${font} ${pdfNumber(fontSize)} Tf ${pdfNumber(x)} ${pdfNumber(
    PDF_PAGE_HEIGHT - y - fontSize,
  )} Td ${pdfHexString(text)} Tj ET`;
}

function drawRect(x, y, width, height) {
  return `${pdfNumber(x)} ${pdfNumber(PDF_PAGE_HEIGHT - y - height)} ${pdfNumber(
    width,
  )} ${pdfNumber(height)} re S`;
}

function fillRect(x, y, width, height, shade = 0.93) {
  return `${pdfNumber(shade)} ${pdfNumber(shade)} ${pdfNumber(shade)} rg ${pdfNumber(
    x,
  )} ${pdfNumber(PDF_PAGE_HEIGHT - y - height)} ${pdfNumber(width)} ${pdfNumber(
    height,
  )} re f 0 0 0 rg`;
}

function splitLongWord(word, limit) {
  const chunks = [];
  let remaining = word;
  while (remaining.length > limit) {
    chunks.push(remaining.slice(0, limit));
    remaining = remaining.slice(limit);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function wrapPdfText(value, width, fontSize, maxLines = 8) {
  const text = stringifyExportValue(value);
  if (!text) return [""];

  const charsPerLine = Math.max(Math.floor(width / (fontSize * 0.52)), 6);
  const lines = [];
  let currentLine = "";

  text.split(" ").forEach((word) => {
    const chunks = word.length > charsPerLine ? splitLongWord(word, charsPerLine) : [word];
    chunks.forEach((chunk) => {
      const candidate = currentLine ? `${currentLine} ${chunk}` : chunk;
      if (candidate.length <= charsPerLine) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = chunk;
      }
    });
  });

  if (currentLine) lines.push(currentLine);
  if (lines.length <= maxLines) return lines;

  const truncatedLines = lines.slice(0, maxLines);
  truncatedLines[maxLines - 1] = `${truncatedLines[maxLines - 1].slice(
    0,
    Math.max(charsPerLine - 3, 0),
  )}...`;
  return truncatedLines;
}

function columnWidthsForPdf(columns, rows) {
  const availableWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
  const weights = columns.map((column, columnIndex) => {
    const sampleLength = rows.slice(0, 25).reduce((maxLength, row) => {
      return Math.max(maxLength, stringifyExportValue(row[columnIndex]).length);
    }, stringifyExportValue(column.label).length);
    return Math.min(Math.max(sampleLength, 6), 28);
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0) || columns.length || 1;
  return weights.map((weight) => (availableWidth * weight) / totalWeight);
}

function drawPdfRow(commands, y, columnWidths, wrappedCells, rowHeight, options = {}) {
  const fontSize = options.fontSize || PDF_FONT_SIZE;
  const font = options.font || "F1";
  let x = PDF_MARGIN;

  if (options.fill) {
    commands.push(fillRect(PDF_MARGIN, y, PDF_PAGE_WIDTH - PDF_MARGIN * 2, rowHeight));
  }

  wrappedCells.forEach((lines, columnIndex) => {
    commands.push(drawRect(x, y, columnWidths[columnIndex], rowHeight));
    lines.forEach((line, lineIndex) => {
      commands.push(
        drawText(
          x + PDF_CELL_PADDING,
          y + PDF_CELL_PADDING + lineIndex * PDF_LINE_HEIGHT,
          line,
          fontSize,
          font,
        ),
      );
    });
    x += columnWidths[columnIndex];
  });
}

function buildPdfPages(title, columns, rows) {
  const columnWidths = columnWidthsForPdf(columns, rows);
  const pages = [];
  let commands = [];
  let y = PDF_MARGIN;

  const buildHeader = () => {
    y = PDF_MARGIN;
    commands.push(drawText(PDF_MARGIN, y, title, 14, "F2"));
    y += 22;
    commands.push(drawText(PDF_MARGIN, y, new Date().toLocaleString(), 8));
    y += 20;

    const wrappedHeaders = columns.map((column, columnIndex) =>
      wrapPdfText(
        column.label,
        columnWidths[columnIndex] - PDF_CELL_PADDING * 2,
        PDF_HEADER_FONT_SIZE,
        3,
      ),
    );
    const headerHeight =
      Math.max(...wrappedHeaders.map((lines) => lines.length)) * PDF_LINE_HEIGHT +
      PDF_CELL_PADDING * 2;
    drawPdfRow(commands, y, columnWidths, wrappedHeaders, headerHeight, {
      fill: true,
      font: "F2",
      fontSize: PDF_HEADER_FONT_SIZE,
    });
    y += headerHeight;
  };

  const startPage = () => {
    if (commands.length) pages.push(commands.join("\n"));
    commands = [];
    buildHeader();
  };

  startPage();

  rows.forEach((row) => {
    const wrappedCells = row.map((cell, columnIndex) =>
      wrapPdfText(cell, columnWidths[columnIndex] - PDF_CELL_PADDING * 2, PDF_FONT_SIZE),
    );
    const rowHeight =
      Math.max(...wrappedCells.map((lines) => lines.length)) * PDF_LINE_HEIGHT +
      PDF_CELL_PADDING * 2;

    if (y + rowHeight > PDF_PAGE_HEIGHT - PDF_MARGIN) {
      startPage();
    }

    drawPdfRow(commands, y, columnWidths, wrappedCells, rowHeight);
    y += rowHeight;
  });

  if (commands.length) pages.push(commands.join("\n"));
  return pages;
}

function buildPdfDocument(pages) {
  const fontObjectNumber = 3 + pages.length * 2;
  const boldFontObjectNumber = fontObjectNumber + 1;
  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  const objects = [
    { number: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    {
      number: 2,
      body: `<< /Type /Pages /Kids [${pageObjectNumbers
        .map((number) => `${number} 0 R`)
        .join(" ")}] /Count ${pages.length} >>`,
    },
  ];

  pages.forEach((content, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push({
      number: pageObjectNumber,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R /F2 ${boldFontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    });
    objects.push({
      number: contentObjectNumber,
      body: `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    });
  });

  objects.push({
    number: fontObjectNumber,
    body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  });
  objects.push({
    number: boldFontObjectNumber,
    body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  });

  let pdf = "%PDF-1.4\n";
  const offsets = {};
  objects.forEach((object) => {
    offsets[object.number] = pdf.length;
    pdf = `${pdf}${object.number} 0 obj\n${object.body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf = `${pdf}xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  objects.forEach((object) => {
    pdf = `${pdf}${padLeft(offsets[object.number], 10)} 00000 n \n`;
  });
  pdf = `${pdf}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function exportReport(format, title, selectedReport, columns, reports) {
  const rows = reportExportRows(columns, reports);

  if (format === EXPORT_FORMATS.CSV) {
    downloadFile(
      reportFileName(title, selectedReport, "csv"),
      `\uFEFF${buildCsv(columns, rows)}`,
      "text/csv;charset=utf-8;",
    );
    return;
  }

  if (format === EXPORT_FORMATS.EXCEL) {
    downloadFile(
      reportFileName(title, selectedReport, "xls"),
      buildExcelHtml(title, columns, rows),
      "application/vnd.ms-excel;charset=utf-8;",
    );
    return;
  }

  if (format === EXPORT_FORMATS.PDF) {
    downloadFile(
      reportFileName(title, selectedReport, "pdf"),
      buildPdfDocument(buildPdfPages(title, columns, rows)),
      "application/pdf",
    );
  }
}
