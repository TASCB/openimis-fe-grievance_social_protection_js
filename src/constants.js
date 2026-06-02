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

export const MODULE_NAME = "grievanceSocialProtection";
export const FETCH_INDIVIDUAL_REF = "individual.actions.fetchIndividuals";

export const EMPTY_STRING = "";
export const GRIEVANT_TYPE_LIST = ["individual", "beneficiary", "user"];
export const GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY = "grievance.MainMenu";

export const GRIEVANCE_REPORT_TYPES = {
  CATEGORY: "CATEGORY",
  PAA_WITHOUT_GRIEVANCES: "PAA_WITHOUT_GRIEVANCES",
  CHANNEL: "CHANNEL",
  RESOLUTION_STATUS: "RESOLUTION_STATUS",
  CLOSURE_TIMELINE: "CLOSURE_TIMELINE",
  CLOSURE_TIMELINE_BY_PAA: "CLOSURE_TIMELINE_BY_PAA",
  OVERDUE_BY_PAA: "OVERDUE_BY_PAA",
};

export const GRIEVANCE_REPORT_OPTIONS = [
  {
    value: GRIEVANCE_REPORT_TYPES.CATEGORY,
    label: "grievanceReport.type.category",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES,
    label: "grievanceReport.type.paaWithoutGrievances",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.CHANNEL,
    label: "grievanceReport.type.channel",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS,
    label: "grievanceReport.type.resolutionStatus",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE,
    label: "grievanceReport.type.closureTimeline",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.CLOSURE_TIMELINE_BY_PAA,
    label: "grievanceReport.type.closureTimelineByPaa",
  },
  {
    value: GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA,
    label: "grievanceReport.type.overdueByPaa",
  },
];
