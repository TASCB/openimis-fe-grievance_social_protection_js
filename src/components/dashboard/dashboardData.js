// Pure transforms from grievanceDashboard sections to widget data.
// Each function takes the rows of one report (see GRIEVANCE_DASHBOARD_WIDGETS).

export const STATUS_SERIES = [
  { key: "openCount", label: "grievanceDashboard.status.open" },
  { key: "assignedCount", label: "grievanceDashboard.status.assigned" },
  { key: "reassignedCount", label: "grievanceDashboard.status.reassigned" },
  { key: "inProgressCount", label: "grievanceDashboard.status.inProgress" },
  { key: "escalatedCount", label: "grievanceDashboard.status.escalated" },
  { key: "closedCount", label: "grievanceDashboard.status.closed" },
];

export const TIMELINE_SERIES = [
  { key: "ON_TIME", label: "grievanceDashboard.timeline.onTime" },
  { key: "RESOLVED_LATE", label: "grievanceDashboard.timeline.late" },
  { key: "N_A", label: "grievanceDashboard.timeline.noTimeline" },
];

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const statusTotals = (row) =>
  STATUS_SERIES.reduce((totals, { key }) => ({ ...totals, [key]: num(row[key]) }), {});

const sumStatus = (target, row) => {
  STATUS_SERIES.forEach(({ key }) => {
    target[key] = num(target[key]) + num(row[key]);
  });
  return target;
};

export function sectionRows(sections, report) {
  const section = (sections || []).find((item) => item.report === report);
  return section?.rows || [];
}

export function summaryKpis(rows) {
  return rows[0] || null;
}

export function trendData(rows) {
  return rows.map((row) => ({
    period: row.period || row.label,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    received: num(row.count),
    resolved: num(row.resolvedCount),
  }));
}

export function dimensionData(rows, field, { dropEmpty = false } = {}) {
  const data = rows.map((row) => ({
    name: row[field] || row.label,
    value: num(row.count),
  }));
  return dropEmpty ? data.filter((item) => item.value > 0) : data;
}

export function statusByDimensionData(rows, field) {
  return rows
    .map((row) => {
      const totals = statusTotals(row);
      return {
        name: row[field] || row.label,
        ...totals,
        total: num(row.grievancesFiled) || Object.values(totals).reduce((a, b) => a + b, 0),
      };
    })
    .filter((item) => item.total > 0);
}

export function closureTimelinessData(rows) {
  const counts = rows.reduce((acc, row) => {
    const key = row.timelineStatus || "N_A";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return TIMELINE_SERIES.map(({ key, label }) => ({
    key,
    label,
    value: counts[key] || 0,
  })).filter((item) => item.value > 0);
}

export function closureByPaaData(rows, limit = 10) {
  const groups = new Map();
  rows.forEach((row) => {
    if (typeof row.closureDays !== "number") return;
    const key = row.paaId || row.paaName || "unassigned";
    const group = groups.get(key) || { name: row.paaName || key, total: 0, closed: 0 };
    group.total += row.closureDays;
    group.closed += 1;
    groups.set(key, group);
  });
  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      averageDays: round(group.total / group.closed),
      closed: group.closed,
    }))
    .sort((a, b) => b.averageDays - a.averageDays)
    .slice(0, limit);
}

export function paaSummaryData(rows, limit = 10) {
  return rows
    .map((row) => ({
      name: row.districtName || row.paaName || row.label,
      region: row.regionName,
      value: num(row.grievancesFiled) || num(row.count),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// STATUS_BY_PAA rows are per PAA and category; the widget shows one row per PAA.
export function statusByPaaData(rows, limit = 10) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.paaId || row.paaName || "unassigned";
    const group = groups.get(key) || {
      name: row.paaName || row.districtName || key,
      region: row.regionName,
      total: 0,
    };
    sumStatus(group, row);
    group.total += num(row.grievancesFiled);
    groups.set(key, group);
  });
  return [...groups.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export function overdueByPaaData(rows, limit = 10) {
  return rows
    .map((row) => ({
      name: row.paaName || row.label,
      value: num(row.count),
      maxOverdueDays: num(row.overdueDays),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || b.maxOverdueDays - a.maxOverdueDays)
    .slice(0, limit);
}

export function paaWithoutGrievancesData(rows) {
  return rows
    .map((row) => row.paaName || row.label)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

// CUSTOM rows are per PAA, category and title; top issues merge PAAs.
export function topIssuesData(rows, limit = 10) {
  const groups = new Map();
  rows.forEach((row) => {
    const title = row.ticketTitle || row.label;
    const key = `${row.category || ""}\u0000${title}`;
    const group = groups.get(key) || {
      title,
      category: row.category,
      filed: 0,
      closed: 0,
      paas: new Set(),
    };
    group.filed += num(row.grievancesFiled);
    group.closed += num(row.closedCount);
    if (row.paaName) group.paas.add(row.paaName);
    groups.set(key, group);
  });
  return [...groups.values()]
    .map(({ paas, ...group }) => ({ ...group, paaCount: paas.size }))
    .sort((a, b) => b.filed - a.filed)
    .slice(0, limit);
}
