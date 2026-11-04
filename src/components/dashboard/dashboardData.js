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

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const statusTotals = (row) =>
  STATUS_SERIES.reduce((totals, { key }) => ({ ...totals, [key]: num(row[key]) }), {});

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

// PAA league table: STATUS_BY_PAA rows are per PAA and category, so they are
// summed per PAA, then joined with OVERDUE_BY_PAA on the PAA id.
export function paaLeagueData(statusRows, overdueRows) {
  const groups = new Map();
  statusRows.forEach((row) => {
    const key = row.paaId || row.paaName || "unassigned";
    const group = groups.get(key) || {
      key,
      region: row.regionName,
      district: row.districtName || row.paaName || key,
      filed: 0,
      closed: 0,
      overdue: 0,
      maxOverdueDays: 0,
    };
    group.filed += num(row.grievancesFiled);
    group.closed += num(row.closedCount);
    groups.set(key, group);
  });
  overdueRows.forEach((row) => {
    const group = groups.get(row.paaId || row.paaName);
    if (!group) return;
    group.overdue = num(row.count);
    group.maxOverdueDays = num(row.overdueDays);
  });
  return [...groups.values()]
    .map((group) => ({ ...group, open: group.filed - group.closed }))
    .sort((a, b) => b.filed - a.filed || b.overdue - a.overdue);
}

export function paaWithoutGrievancesData(rows) {
  return rows
    .map((row) => row.paaName || row.label)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
