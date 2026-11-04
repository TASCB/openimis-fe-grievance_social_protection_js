export const TICKET_STATUSES = {
  RECEIVED: "RECEIVED",
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};
export const TICKET_STATUS = [
  TICKET_STATUSES.RECEIVED,
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CLOSED,
];

export const TICKET_PRIORITY = ["Critical", "High", "Normal", "Low"];

export const RIGHT_TICKET = 127000;
export const RIGHT_TICKET_SEARCH = 127000;
export const RIGHT_TICKET_ADD = 127001;
export const RIGHT_TICKET_EDIT = 127002;
export const RIGHT_TICKET_DELETE = 127003;
export const RIGHT_TICKET_COMMENT_VIEW = 127004;
export const RIGHT_TICKET_COMMENT_CREATE = 127005;
export const RIGHT_TICKET_RESOLVE = 127006;

export const MODULE_NAME = "grievanceSocialProtection";
export const FETCH_INDIVIDUAL_REF = "individual.actions.fetchIndividuals";

export const EMPTY_STRING = "";
export const EXTERNAL_REPORTER_TYPE = "external";
export const GRIEVANT_TYPE_LIST = ["individual", "beneficiary", "user", EXTERNAL_REPORTER_TYPE];
export const GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY = "grievance.MainMenu";

export const GRIEVANCE_REPORT_TYPES = {
  PAA_SUMMARY: "PAA_SUMMARY",
  STATUS_BY_PAA: "STATUS_BY_PAA",
  STATUS_BY_CATEGORY: "STATUS_BY_CATEGORY",
  STATUS_BY_CHANNEL: "STATUS_BY_CHANNEL",
  CUSTOM: "CUSTOM",
  CATEGORY: "CATEGORY",
  PAA_WITHOUT_GRIEVANCES: "PAA_WITHOUT_GRIEVANCES",
  CHANNEL: "CHANNEL",
  RESOLUTION_STATUS: "RESOLUTION_STATUS",
  CLOSURE_TIMELINE: "CLOSURE_TIMELINE",
  CLOSURE_TIMELINE_BY_PAA: "CLOSURE_TIMELINE_BY_PAA",
  OVERDUE_BY_PAA: "OVERDUE_BY_PAA",
  SUMMARY: "SUMMARY",
  TREND: "TREND",
};

export const GRIEVANCE_DASHBOARD_PERIODS = ["MONTH", "WEEK", "DAY"];

// One dashboard widget per backend report. `report` is the report whose rows the
// widget draws; `linkReport` is the full report page the card links to (omitted
// when the report has no table page). CLOSURE_TIMELINE and
// CLOSURE_TIMELINE_BY_PAA return the same per-ticket rows, so both widgets draw
// from CLOSURE_TIMELINE_BY_PAA and it is only fetched once.
export const GRIEVANCE_DASHBOARD_WIDGETS = [
  { id: "kpis", report: GRIEVANCE_REPORT_TYPES.SUMMARY },
  { id: "trend", report: GRIEVANCE_REPORT_TYPES.TREND },
  {
    id: "resolutionStatus",
    report: GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS,
    linkReport: GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS,
  },
  {
    id: "category",
    report: GRIEVANCE_REPORT_TYPES.CATEGORY,
    linkReport: GRIEVANCE_REPORT_TYPES.CATEGORY,
  },
  {
    id: "statusByCategory",
    report: GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY,
    linkReport: GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY,
  },
  {
    id: "channel",
    report: GRIEVANCE_REPORT_TYPES.CHANNEL,
    linkReport: GRIEVANCE_REPORT_TYPES.CHANNEL,
  },
  {
    id: "statusByChannel",
    report: GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL,
    linkReport: GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL,
  },
  {
    id: "closureTimeliness",
    report: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE_BY_PAA,
    linkReport: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE,
  },
  {
    id: "closureByPaa",
    report: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE_BY_PAA,
    linkReport: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE_BY_PAA,
  },
  {
    id: "paaSummary",
    report: GRIEVANCE_REPORT_TYPES.PAA_SUMMARY,
    linkReport: GRIEVANCE_REPORT_TYPES.PAA_SUMMARY,
  },
  {
    id: "statusByPaa",
    report: GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA,
    linkReport: GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA,
  },
  {
    id: "overdueByPaa",
    report: GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA,
    linkReport: GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA,
  },
  {
    id: "paaWithoutGrievances",
    report: GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES,
    linkReport: GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES,
  },
  {
    id: "topIssues",
    report: GRIEVANCE_REPORT_TYPES.CUSTOM,
    linkReport: GRIEVANCE_REPORT_TYPES.CUSTOM,
  },
];

export const GRIEVANCE_DASHBOARD_REPORTS = [
  ...new Set(GRIEVANCE_DASHBOARD_WIDGETS.map((widget) => widget.report)),
];

export const GRIEVANCE_REPORT_STATUS_ORDER = ["RECEIVED", "UNRESOLVED", "CLOSED"];

export const PAA_GRIEVANCE_FILTER_TYPES = {
  WITHOUT_GRIEVANCE: "WITHOUT_GRIEVANCE",
  WITH_GRIEVANCE: "WITH_GRIEVANCE",
  LESS_THAN: "LESS_THAN",
  MORE_THAN: "MORE_THAN",
};

export const PAA_GRIEVANCE_FILTER_OPTIONS = [
  {
    value: PAA_GRIEVANCE_FILTER_TYPES.WITHOUT_GRIEVANCE,
    label: "grievanceReport.paaFilter.without",
  },
  {
    value: PAA_GRIEVANCE_FILTER_TYPES.WITH_GRIEVANCE,
    label: "grievanceReport.paaFilter.with",
  },
  {
    value: PAA_GRIEVANCE_FILTER_TYPES.LESS_THAN,
    label: "grievanceReport.paaFilter.lessThan",
  },
  {
    value: PAA_GRIEVANCE_FILTER_TYPES.MORE_THAN,
    label: "grievanceReport.paaFilter.moreThan",
  },
];

export const GRIEVANCE_REPORT_OPTIONS = [
  {
    value: GRIEVANCE_REPORT_TYPES.PAA_SUMMARY,
    label: "grievanceReport.type.paaSummary",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA,
    label: "grievanceReport.type.statusByPaa",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY,
    label: "grievanceReport.type.statusByCategory",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL,
    label: "grievanceReport.type.statusByChannel",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA,
    label: "grievanceReport.type.overdue",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE,
    label: "grievanceReport.type.closureTimeline",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES,
    label: "grievanceReport.type.paaWithoutGrievances",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.CUSTOM,
    label: "grievanceReport.type.custom",
  },
];
