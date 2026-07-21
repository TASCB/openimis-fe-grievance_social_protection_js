/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
import {
  graphql,
  formatMutation,
  formatPageQueryWithCount,
  formatGQLString,
  formatPageQuery,
  baseApiUrl,
  decodeId,
  formatQuery,
} from "@openimis/fe-core";
import { ACTION_TYPE } from "./reducer";
import { FETCH_INDIVIDUAL_REF } from "./constants";
import { isBase64Encoded } from "./utils/utils";
import { CLEAR, ERROR, REQUEST, SUCCESS } from "./utils/action-type";
import {
  getReporterType,
  isExternalReporterType,
  parseSerializedReporter,
} from "./utils/externalReporter";

const GRIEVANCE_CONFIGURATION_PROJECTION = () => [
  "grievanceTypes",
  "grievanceFlags",
  "grievanceChannels",
  "grievanceDefaultResolutionsByCategory{category, resolutionTime}",
];

const GRIEVANCE_REPORT_PROJECTION = () => [
  "report",
  "label",
  "count",
  "category",
  "channel",
  "status",
  "paaId",
  "paaName",
  "agentId",
  "agentName",
  "ticketId",
  "ticketCode",
  "ticketTitle",
  "dateReceived",
  "dateClosed",
  "dueDate",
  "closureDays",
  "overdueDays",
  "overdue",
  "timelineStatus",
  "timeTakenSeconds",
  "regionName",
  "districtName",
  "grievancesFiled",
  "openCount",
  "assignedCount",
  "reassignedCount",
  "inProgressCount",
  "closedCount",
  "escalatedCount",
];

const CATEGORY_FULL_PROJECTION = () => [
  "id",
  "uuid",
  "categoryTitle",
  "slug",
  "validityFrom",
  "validityTo",
];

const GRIEVANCE_TYPE_PROJECTION = () => [
  "id",
  "code",
  "name",
  "isActive",
  "category{id code name}",
  "categoryName",
];

const GRIEVANCE_CATEGORY_PROJECTION = () => ["id", "code", "name", "timeline", "isActive"];
const GRIEVANCE_CHANNEL_PROJECTION = () => ["id", "code", "name", "isActive"];
const LOCATION_PROJECTION = "id uuid code name type";
const EXTERNAL_REPORTER_PROJECTION = () => [
  "externalReporterFirstName",
  "externalReporterLastName",
  "externalReporterPhone",
  "externalReporterEmail",
  `externalReporterLocation{${LOCATION_PROJECTION}}`,
  `externalReporterRegion{${LOCATION_PROJECTION}}`,
  `externalReporterDistrict{${LOCATION_PROJECTION}}`,
  `externalReporterWard{${LOCATION_PROJECTION}}`,
  `externalReporterVillage{${LOCATION_PROJECTION}}`,
];

function formatIdGQL(id) {
  if (!id) return id;
  return isBase64Encoded(id) ? decodeId(id) : id;
}

function formatTimelineGQL(timeline) {
  if (timeline === undefined || timeline === null || timeline === "") return "";
  const parsedTimeline = Number.parseInt(timeline, 10);
  return Number.isNaN(parsedTimeline) || parsedTimeline < 0 ? "" : `timeline: ${parsedTimeline}`;
}

export function fetchCategoryForPicker(mm, filters) {
  const payload = formatPageQueryWithCount("category", filters, CATEGORY_FULL_PROJECTION(mm));
  return graphql(payload, "CATEGORY_CATEGORY");
}

export function fetchGrievanceCategories(mm, filters) {
  const payload = formatPageQueryWithCount(
    "grievanceCategories",
    filters,
    GRIEVANCE_CATEGORY_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_CATEGORY_CATEGORIES");
}

export function fetchGrievanceCategory(mm, filters) {
  const payload = formatPageQueryWithCount(
    "grievanceCategories",
    filters,
    GRIEVANCE_CATEGORY_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_CATEGORY_CATEGORY");
}

export function fetchGrievanceTypes(mm, filters = []) {
  const payload = formatPageQueryWithCount(
    "grievanceTypes",
    filters,
    GRIEVANCE_TYPE_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_TYPE_TYPES");
}

export function fetchGrievanceType(mm, filters = []) {
  const payload = formatPageQueryWithCount(
    "grievanceTypes",
    filters,
    GRIEVANCE_TYPE_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_TYPE_TYPE");
}

export function fetchGrievanceChannels(mm, filters = []) {
  const payload = formatPageQueryWithCount(
    "grievanceChannels",
    filters,
    GRIEVANCE_CHANNEL_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_CHANNEL_CHANNELS");
}

export function fetchGrievanceChannel(mm, filters = []) {
  const payload = formatPageQueryWithCount(
    "grievanceChannels",
    filters,
    GRIEVANCE_CHANNEL_PROJECTION(mm),
  );
  return graphql(payload, "GRIEVANCE_CHANNEL_CHANNEL");
}

export function fetchTicketSummaries(mm, filters) {
  const projections = [
    "id",
    "title",
    "code",
    "description",
    "status",
    "priority",
    "dueDate",
    "expectedResolutionDate",
    "closedAt",
    "overdue",
    "timelineStatus",
    "timeTakenSeconds",
    "reporter",
    "reporterId",
    "reporterType",
    "reporterTypeName",
    "category",
    "flags",
    "channel",
    "consentGiven",
    "resolution",
    "title",
    "dateOfIncident",
    "dateCreated",
    "version",
    "isHistory",
    "reporterFirstName",
    "reporterLastName",
    "reporterDob",
    `eventLocation{${LOCATION_PROJECTION}}`,
    `region{${LOCATION_PROJECTION}}`,
    `district{${LOCATION_PROJECTION}}`,
    `ward{${LOCATION_PROJECTION}}`,
    `village{${LOCATION_PROJECTION}}`,
    ...EXTERNAL_REPORTER_PROJECTION(),
  ];
  const payload = formatPageQueryWithCount("tickets", filters, projections);
  return graphql(payload, "TICKET_TICKETS");
}

export function fetchGrievanceReports(mm, params) {
  const payload = formatQuery("grievanceReports", params, GRIEVANCE_REPORT_PROJECTION());
  return graphql(payload, [
    REQUEST(ACTION_TYPE.GRIEVANCE_REPORTS),
    SUCCESS(ACTION_TYPE.GRIEVANCE_REPORTS),
    ERROR(ACTION_TYPE.GRIEVANCE_REPORTS),
  ]);
}

export function fetchGrievanceReportsForExport(mm, params) {
  const payload = formatQuery("grievanceReports", params, GRIEVANCE_REPORT_PROJECTION());
  return graphql(payload, [
    REQUEST(ACTION_TYPE.EXPORT_GRIEVANCE_REPORTS),
    SUCCESS(ACTION_TYPE.EXPORT_GRIEVANCE_REPORTS),
    ERROR(ACTION_TYPE.EXPORT_GRIEVANCE_REPORTS),
  ]);
}

export function fetchTicket(mm, filters) {
  const projections = [
    "id",
    "title",
    "code",
    "description",
    "status",
    "priority",
    "dueDate",
    "reporter",
    "reporterId",
    "reporterType",
    "reporterTypeName",
    "category",
    "flags",
    "channel",
    "consentGiven",
    "resolution",
    "title",
    "dateOfIncident",
    "dateCreated",
    "attendingStaff {id, username}",
    "version",
    "isHistory,",
    "jsonExt",
    "reporterFirstName",
    "reporterLastName",
    "reporterDob",
    `eventLocation{${LOCATION_PROJECTION}}`,
    `region{${LOCATION_PROJECTION}}`,
    `district{${LOCATION_PROJECTION}}`,
    `ward{${LOCATION_PROJECTION}}`,
    `village{${LOCATION_PROJECTION}}`,
    ...EXTERNAL_REPORTER_PROJECTION(),
  ];
  const payload = formatPageQueryWithCount("tickets", filters, projections);
  return graphql(payload, "TICKET_TICKET");
}

export function fetchGrievanceLocationScope() {
  const payload = formatQuery("grievanceLocationScope", null, [
    "restricted",
    "required",
    `assignedLocation{${LOCATION_PROJECTION}}`,
    `assignedLocations{${LOCATION_PROJECTION}}`,
    `region{${LOCATION_PROJECTION}}`,
    `district{${LOCATION_PROJECTION}}`,
    `ward{${LOCATION_PROJECTION}}`,
    `village{${LOCATION_PROJECTION}}`,
  ]);
  return graphql(payload, "GRIEVANCE_LOCATION_SCOPE");
}

export function fetchComments(ticket) {
  if (ticket && ticket.id) {
    const filters = [`ticket_Id: "${ticket.id}"`, 'orderBy: ["-dateCreated"]'];
    const projections = [
      "id",
      "commenter",
      "commenterId",
      "commenterType",
      "commenterTypeName",
      "comment",
      "isResolution",
      "dateCreated",
      "commenterFirstName",
      "commenterLastName",
      "commenterDob",
    ];
    const payload = formatPageQueryWithCount("comments", filters, projections);
    return graphql(payload, "COMMENT_COMMENTS");
  }
  return { type: "COMMENT_COMMENTS", payload: { data: [] } };
}

function formatJsonExtGQL(jsonExt) {
  if (!jsonExt) return "";
  const jsonExtString = typeof jsonExt === "string" ? jsonExt : JSON.stringify(jsonExt);
  return `jsonExt: ${JSON.stringify(jsonExtString)}`;
}

function locationId(location) {
  if (!location?.id) return null;
  return isBase64Encoded(location.id) ? decodeId(location.id) : location.id;
}

function formatOptionalStringGQL(fieldName, value, includeBlank = false) {
  if (value === undefined || value === null) return "";
  const stringValue = `${value}`;
  if (stringValue === "" && !includeBlank) return "";
  return `${fieldName}: "${formatGQLString(stringValue)}"`;
}

function formatOptionalIdGQL(fieldName, id) {
  if (id === undefined || id === null || id === "") return "";
  return `${fieldName}: ${id}`;
}

function formatReporterGQL(ticket, includeNullReporterType = false) {
  const reporter = parseSerializedReporter(ticket.reporter);
  const reporterType = getReporterType(ticket);
  const hasReporterType =
    reporterType !== undefined && reporterType !== null && reporterType !== "";
  const shouldClearReporterType =
    includeNullReporterType || Object.prototype.hasOwnProperty.call(ticket, "reporterType");

  return `
    ${
      reporter
        ? isBase64Encoded(reporter.id)
          ? `reporterId: "${formatGQLString(decodeId(reporter.id))}"`
          : `reporterId: "${formatGQLString(reporter.id)}"`
        : ""
    }
    ${
      hasReporterType
        ? `reporterType: "${formatGQLString(reporterType)}"`
        : shouldClearReporterType
          ? 'reporterType: ""'
          : ""
    }
  `;
}

function formatLocationGQL(ticket) {
  return `
    ${formatOptionalIdGQL("regionId", locationId(ticket.region))}
    ${formatOptionalIdGQL("districtId", locationId(ticket.district))}
    ${formatOptionalIdGQL("wardId", locationId(ticket.ward))}
    ${formatOptionalIdGQL("villageId", locationId(ticket.village))}
    ${formatOptionalIdGQL("eventLocationId", locationId(ticket.eventLocation))}
  `;
}

function formatExternalReporterLocationGQL(ticket) {
  return `
    ${formatOptionalIdGQL("externalReporterRegionId", locationId(ticket.externalReporterRegion))}
    ${formatOptionalIdGQL("externalReporterDistrictId", locationId(ticket.externalReporterDistrict))}
    ${formatOptionalIdGQL("externalReporterWardId", locationId(ticket.externalReporterWard))}
    ${formatOptionalIdGQL("externalReporterVillageId", locationId(ticket.externalReporterVillage))}
    ${formatOptionalIdGQL("externalReporterLocationId", locationId(ticket.externalReporterLocation))}
  `;
}

function formatExternalReporterGQL(ticket) {
  const reporterType = getReporterType(ticket);
  if (!isExternalReporterType(reporterType)) {
    return "";
  }
  return `
    ${formatOptionalStringGQL("externalReporterFirstName", ticket.externalReporterFirstName)}
    ${formatOptionalStringGQL("externalReporterLastName", ticket.externalReporterLastName)}
    ${formatOptionalStringGQL("externalReporterPhone", ticket.externalReporterPhone)}
    ${formatOptionalStringGQL("externalReporterEmail", ticket.externalReporterEmail, true)}
    ${formatExternalReporterLocationGQL(ticket)}
  `;
}

function formatConsentGQL(ticket, includeDefault = false) {
  if (typeof ticket.consentGiven === "boolean") {
    return `consentGiven: ${ticket.consentGiven}`;
  }
  return includeDefault ? "consentGiven: false" : "";
}

export function formatTicketGQL(ticket) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${ticket.code ? `code: "${formatGQLString(ticket.code)}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ""}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ""}
    ${!!ticket.description && !!ticket.description ? `description: "${formatGQLString(ticket.description)}"` : ""}
    ${formatReporterGQL(ticket)}
    ${formatExternalReporterGQL(ticket)}
    ${ticket.nameOfComplainant ? `nameOfComplainant: "${formatGQLString(ticket.nameOfComplainant)}"` : ""}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ""}
    ${ticket.status ? `status: "${formatGQLString(ticket.status)}"` : ""}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ""}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ""}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ""}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ""}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ""}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ""}
    ${formatConsentGQL(ticket, true)}
    ${formatJsonExtGQL(ticket.jsonExt)}
    ${formatLocationGQL(ticket)}
  `;
}

export function formatUpdateTicketGQL(ticket) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ""}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ""}
    ${formatReporterGQL(ticket, true)}
    ${formatExternalReporterGQL(ticket)}
    ${ticket.nameOfComplainant ? `nameOfComplainant: "${formatGQLString(ticket.nameOfComplainant)}"` : ""}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ""}
    ${ticket.status ? `status: ${formatGQLString(ticket.status)}` : ""}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ""}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ""}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ""}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ""}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ""}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ""}
    ${formatConsentGQL(ticket)}
    ${formatLocationGQL(ticket)}
  `;
}

export function formatCloseTicketGQL(ticket, closingComment, commenter, commenterType) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${formatGQLString(ticket.title)}"` : ""}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ""}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ""}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ""}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ""}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ""}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ""}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ""}
    ${
      commenter
        ? isBase64Encoded(commenter.id)
          ? `commenterId: "${decodeId(commenter.id)}"`
          : `commenterId: "${commenter.id}"`
        : ""
    }
    ${commenterType ? `commenterType: "${commenterType}"` : ""}
    ${closingComment ? `comment: "${formatGQLString(closingComment)}"` : ""}
    ${formatLocationGQL(ticket)}
  `;
}

export function resolveTicketGQL(ticket) {
  return `
    ${ticket.uuid !== undefined && ticket.uuid !== null ? `uuid: "${ticket.uuid}"` : ""}
    ${ticket.ticketStatus ? 'ticketStatus: "Close"' : ""}
    ${!!ticket.insuree && !!ticket.insuree.id ? `insureeUuid: "${ticket.insuree.uuid}"` : ""}
    ${!!ticket.category && !!ticket.category.id ? `categoryUuid: "${ticket.category.uuid}"` : ""}
  `;
}

export function formatGrievanceCategoryGQL(category) {
  return `
    ${category.id ? `id: "${formatGQLString(formatIdGQL(category.id))}"` : ""}
    ${category.code ? `code: "${formatGQLString(category.code)}"` : ""}
    ${category.name ? `name: "${formatGQLString(category.name)}"` : ""}
    ${formatTimelineGQL(category.timeline)}
    ${typeof category.isActive === "boolean" ? `isActive: ${category.isActive}` : ""}
  `;
}

export function formatGrievanceTypeGQL(type) {
  return `
    ${type.id ? `id: "${formatGQLString(formatIdGQL(type.id))}"` : ""}
    ${type.code ? `code: "${formatGQLString(type.code)}"` : ""}
    ${type.name ? `name: "${formatGQLString(type.name)}"` : ""}
    ${typeof type.isActive === "boolean" ? `isActive: ${type.isActive}` : ""}
    ${type.category?.id ? `categoryId: "${formatGQLString(formatIdGQL(type.category.id))}"` : ""}
  `;
}

export function formatGrievanceChannelGQL(channel) {
  return `
    ${channel.id ? `id: "${formatGQLString(formatIdGQL(channel.id))}"` : ""}
    ${channel.code ? `code: "${formatGQLString(channel.code)}"` : ""}
    ${channel.name ? `name: "${formatGQLString(channel.name)}"` : ""}
    ${typeof channel.isActive === "boolean" ? `isActive: ${channel.isActive}` : ""}
  `;
}

export function createGrievanceCategory(category, clientMutationLabel) {
  const mutation = formatMutation(
    "createGrievanceCategory",
    formatGrievanceCategoryGQL(category),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CATEGORY_MUTATION_REQ",
      "GRIEVANCE_CATEGORY_CREATE_RESP",
      "GRIEVANCE_CATEGORY_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function updateGrievanceCategory(category, clientMutationLabel) {
  const mutation = formatMutation(
    "updateGrievanceCategory",
    formatGrievanceCategoryGQL(category),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CATEGORY_MUTATION_REQ",
      "GRIEVANCE_CATEGORY_UPDATE_RESP",
      "GRIEVANCE_CATEGORY_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: category.id,
    },
  );
}

export function createGrievanceType(type, clientMutationLabel) {
  const mutation = formatMutation(
    "createGrievanceType",
    formatGrievanceTypeGQL(type),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["GRIEVANCE_TYPE_MUTATION_REQ", "GRIEVANCE_TYPE_CREATE_RESP", "GRIEVANCE_TYPE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function updateGrievanceType(type, clientMutationLabel) {
  const mutation = formatMutation(
    "updateGrievanceType",
    formatGrievanceTypeGQL(type),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["GRIEVANCE_TYPE_MUTATION_REQ", "GRIEVANCE_TYPE_UPDATE_RESP", "GRIEVANCE_TYPE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: type.id,
    },
  );
}

export function createGrievanceChannel(channel, clientMutationLabel) {
  const mutation = formatMutation(
    "createGrievanceChannel",
    formatGrievanceChannelGQL(channel),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CHANNEL_MUTATION_REQ",
      "GRIEVANCE_CHANNEL_CREATE_RESP",
      "GRIEVANCE_CHANNEL_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function updateGrievanceChannel(channel, clientMutationLabel) {
  const mutation = formatMutation(
    "updateGrievanceChannel",
    formatGrievanceChannelGQL(channel),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CHANNEL_MUTATION_REQ",
      "GRIEVANCE_CHANNEL_UPDATE_RESP",
      "GRIEVANCE_CHANNEL_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: channel.id,
    },
  );
}

export function deleteGrievanceCategory(category, clientMutationLabel) {
  const mutation = formatMutation(
    "deleteGrievanceCategory",
    `ids: ["${category.id}"]`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CATEGORY_MUTATION_REQ",
      "GRIEVANCE_CATEGORY_DELETE_RESP",
      "GRIEVANCE_CATEGORY_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: category.id,
    },
  );
}

export function deleteGrievanceType(type, clientMutationLabel) {
  const mutation = formatMutation(
    "deleteGrievanceType",
    `ids: ["${type.id}"]`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["GRIEVANCE_TYPE_MUTATION_REQ", "GRIEVANCE_TYPE_DELETE_RESP", "GRIEVANCE_TYPE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: type.id,
    },
  );
}

export function deleteGrievanceChannel(channel, clientMutationLabel) {
  const mutation = formatMutation(
    "deleteGrievanceChannel",
    `ids: ["${channel.id}"]`,
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "GRIEVANCE_CHANNEL_MUTATION_REQ",
      "GRIEVANCE_CHANNEL_DELETE_RESP",
      "GRIEVANCE_CHANNEL_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: channel.id,
    },
  );
}

export function createTicket(ticket, grievanceConfig, clientMutationLabel) {
  const resolutionTimeMap = {};
  grievanceConfig.grievanceDefaultResolutionsByCategory.forEach((item) => {
    resolutionTimeMap[item.category] = item.resolutionTime;
  });

  // eslint-disable-next-line no-param-reassign
  ticket.resolution = resolutionTimeMap[ticket.category];
  const mutation = formatMutation("createTicket", formatTicketGQL(ticket), clientMutationLabel);

  console.log(mutation?.payload);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["TICKET_MUTATION_REQ", "TICKET_CREATE_TICKET_RESP", "TICKET_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function updateTicket(ticket, clientMutationLabel) {
  const mutation = formatMutation(
    "updateTicket",
    formatUpdateTicketGQL(ticket),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["TICKET_MUTATION_REQ", "TICKET_UPDATE_TICKET_RESP", "TICKET_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      id: ticket.id,
    },
  );
}

export function resolveTicket(ticket, clientMutationLabel) {
  const mutation = formatMutation("updateTicket", resolveTicketGQL(ticket), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["TICKET_MUTATION_REQ", "TICKET_UPDATE_TICKET_RESP", "TICKET_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      ticketUuid: ticket.uuid,
    },
  );
}

export function fetchTicketAttachments(ticket) {
  if (ticket && ticket.id) {
    const rawId = isBase64Encoded(ticket.id) ? decodeId(ticket.id) : ticket.id;
    const payload = formatPageQuery(
      "ticketAttachments",
      [`ticket_Id: "${rawId}"`],
      ["id", "filename", "mimeType", "url", "ticket{id}"],
    );
    return graphql(payload, "TICKET_TICKET_ATTACHMENTS");
  }
  return { type: "TICKET_TICKET_ATTACHMENTS_CLEAR" };
}

export function attachmentDownloadUrl(attachment) {
  const id = isBase64Encoded(attachment.id) ? decodeId(attachment.id) : attachment.id;
  return `${baseApiUrl}/grievance_social_protection/attach?id=${encodeURIComponent(id)}`;
}

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="))
    ?.split("=")[1];
}

function restHeaders({ multipart = false } = {}) {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (!multipart) {
    headers["Content-Type"] = "application/json";
  }
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }
  return headers;
}

export function downloadAttachment(attach) {
  return async () => {
    const response = await fetch(attachmentDownloadUrl(attach), {
      method: "GET",
      credentials: "same-origin",
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = attach.filename || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  };
}

export function uploadTicketAttachments(ticketUuid, files, opts = {}) {
  return async (dispatch) => {
    if (!files || files.length === 0) return { saved: [], errors: [] };
    dispatch({ type: "TICKET_UPLOAD_ATTACHMENTS_REQ" });
    const form = new FormData();
    if (ticketUuid) {
      const rawUuid = isBase64Encoded(ticketUuid) ? decodeId(ticketUuid) : ticketUuid;
      form.append("ticket_uuid", rawUuid);
    } else if (opts.clientMutationId) {
      form.append("client_mutation_id", opts.clientMutationId);
    }
    files.forEach((f) => form.append("files", f));
    try {
      const response = await fetch(`${baseApiUrl}/grievance_social_protection/upload`, {
        method: "POST",
        credentials: "same-origin",
        headers: restHeaders({ multipart: true }),
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        dispatch({ type: "TICKET_UPLOAD_ATTACHMENTS_ERR", payload: data });
        return { error: data };
      }
      dispatch({ type: "TICKET_UPLOAD_ATTACHMENTS_RESP", payload: data });
      return data;
    } catch (err) {
      dispatch({ type: "TICKET_UPLOAD_ATTACHMENTS_ERR", payload: { error: String(err) } });
      return { error: String(err) };
    }
  };
}

export function setPendingAttachments(files) {
  return { type: "TICKET_PENDING_ATTACHMENTS_SET", payload: files };
}

export function clearPendingAttachments() {
  return { type: "TICKET_PENDING_ATTACHMENTS_CLEAR" };
}

export function formatTicketAttachmentGQL(ticketattachment) {
  return `
    ${ticketattachment.uuid !== undefined && ticketattachment.uuid !== null ? `uuid: "${ticketattachment.uuid}"` : ""}
    ${!!ticketattachment.ticket && !!ticketattachment.ticket.id ? `ticketUuid: "${ticketattachment.ticket.uuid}"` : ""}
    ${ticketattachment.filename ? `filename: "${formatGQLString(ticketattachment.filename)}"` : ""}
    ${ticketattachment.mimeType ? `mimeType: "${formatGQLString(ticketattachment.mimeType)}"` : ""}
    ${ticketattachment.url ? `url: "${formatGQLString(ticketattachment.url)}"` : ""}
    ${ticketattachment.date ? `date: "${formatGQLString(ticketattachment.date)}"` : ""}
    ${ticketattachment.document ? `document: "${formatGQLString(ticketattachment.document)}"` : ""}
  `;
}

export function formatTicketCommentGQL(ticketComment, ticket, commenterType) {
  return `
    ${ticketComment.uuid !== undefined && ticketComment.uuid !== null ? `uuid: "${ticketComment.uuid}"` : ""}
    ${ticket.id ? `ticketId: "${ticket.id}"` : ""}
    ${
      ticketComment.commenter
        ? isBase64Encoded(ticketComment.commenter.id)
          ? `commenterId: "${decodeId(ticketComment.commenter.id)}"`
          : `commenterId: "${ticketComment.commenter.id}"`
        : ""
    }
    ${commenterType ? `commenterType: "${commenterType}"` : ""}
    ${ticketComment.comment ? `comment: "${formatGQLString(ticketComment.comment)}"` : ""}
  `;
}

export function createTicketAttachment(ticketattachment, clientMutationLabel) {
  const mutation = formatMutation(
    "createTicketAttachment",
    formatTicketAttachmentGQL(ticketattachment),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "TICKET_ATTACHMENT_MUTATION_REQ",
      "TICKET_CREATE_TICKET_ATTACHMENT_RESP",
      "TICKET_ATTACHMENT_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function createTicketComment(ticketComment, ticket, commenterType, clientMutationLabel) {
  const mutation = formatMutation(
    "createComment",
    formatTicketCommentGQL(ticketComment, ticket, commenterType),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "TICKET_ATTACHMENT_MUTATION_REQ",
      "TICKET_CREATE_TICKET_ATTACHMENT_RESP",
      "TICKET_ATTACHMENT_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function resolveGrievanceByComment(id, clientMutationLabel) {
  const mutation = formatMutation("resolveGrievanceByComment", `id: "${id}"`, clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      REQUEST(ACTION_TYPE.MUTATION),
      SUCCESS(ACTION_TYPE.RESOLVE_BY_COMMENT),
      ERROR(ACTION_TYPE.MUTATION),
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function closeTicket(ticket, closingComment, commenter, commenterType, clientMutationLabel) {
  const mutation = formatMutation(
    "closeTicket",
    formatCloseTicketGQL(ticket, closingComment, commenter, commenterType),
    clientMutationLabel,
  );
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(ACTION_TYPE.CLOSE_TICKET), ERROR(ACTION_TYPE.MUTATION)],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function reopenTicket(id, clientMutationLabel) {
  const mutation = formatMutation("reopenTicket", `id: "${id}"`, clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      REQUEST(ACTION_TYPE.MUTATION),
      SUCCESS(ACTION_TYPE.REOPEN_TICKET),
      ERROR(ACTION_TYPE.MUTATION),
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function fetchIndividual(mm, id) {
  const fetchIndividualCallable = mm.getRef(FETCH_INDIVIDUAL_REF);
  return fetchIndividualCallable([`id: ${id}`]);
}

export function fetchInsureeTicket(mm, chfId) {
  const filters = [`chfId: "${chfId}"`];
  const projections = [
    "id",
    "uuid",
    "ticketTitle",
    "ticketCode",
    "ticketDescription",
    "name",
    "phone",
    "email",
    "dateOfIncident",
    "nameOfComplainant",
    "witness",
    "resolution",
    "ticketStatus",
    "ticketPriority",
    "dateSubmitted",
    "dateSubmitted",
    "category{id, uuid, categoryTitle, slug}",
    "insuree{id, uuid, otherNames, lastName, dob, chfId, phone, email}",
    "attachment{edges{node{id, uuid, filename, mimeType, url, document, date}}}",
  ];
  const payload = formatPageQueryWithCount(
    `ticketsByInsuree(chfId: "${chfId}", orderBy: "ticketCode", ticketCode: false, first: 5)`,
    filters,
    projections,
  );
  return graphql(payload, "TICKET_TICKET");
}

export function fetchGrievanceConfiguration(params) {
  const payload = formatQuery("grievanceConfig", params, GRIEVANCE_CONFIGURATION_PROJECTION());
  return graphql(payload, ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION);
}

export const clearTicket = () => (dispatch) => {
  dispatch({
    type: CLEAR(ACTION_TYPE.CLEAR_TICKET),
  });
};
