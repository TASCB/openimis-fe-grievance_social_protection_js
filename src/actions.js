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
  openBlob,
  formatQuery,
} from "@openimis/fe-core";
import { ACTION_TYPE } from "./reducer";
import { FETCH_INDIVIDUAL_REF } from "./constants";
import { isBase64Encoded } from "./utils/utils";
import { CLEAR, ERROR, REQUEST, SUCCESS } from "./utils/action-type";

const GRIEVANCE_CONFIGURATION_PROJECTION = () => [
  "grievanceTypes",
  "grievanceFlags",
  "grievanceChannels",
  "grievanceDefaultResolutionsByCategory{category, resolutionTime}",
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

const GRIEVANCE_CATEGORY_PROJECTION = () => ["id", "code", "name", "isActive"];
const GRIEVANCE_CHANNEL_PROJECTION = () => ["id", "code", "name", "isActive"];

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
  const payload = formatPageQueryWithCount("grievanceTypes", filters, GRIEVANCE_TYPE_PROJECTION(mm));
  return graphql(payload, "GRIEVANCE_TYPE_TYPES");
}

export function fetchGrievanceType(mm, filters = []) {
  const payload = formatPageQueryWithCount("grievanceTypes", filters, GRIEVANCE_TYPE_PROJECTION(mm));
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
    "reporter",
    "reporterId",
    "reporterType",
    "reporterTypeName",
    "category",
    "flags",
    "channel",
    "resolution",
    "title",
    "dateOfIncident",
    "dateCreated",
    "version",
    "isHistory",
    "reporterFirstName",
    "reporterLastName",
    "reporterDob",
  ];
  const payload = formatPageQueryWithCount("tickets", filters, projections);
  return graphql(payload, "TICKET_TICKETS");
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
  ];
  const payload = formatPageQueryWithCount("tickets", filters, projections);
  return graphql(payload, "TICKET_TICKET");
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

export function formatTicketGQL(ticket) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${ticket.code ? `code: "${formatGQLString(ticket.code)}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ""}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ""}
    ${!!ticket.description && !!ticket.description ? `description: "${ticket.description}"` : ""}
    ${
      ticket.reporter
        ? isBase64Encoded(ticket.reporter.id)
          ? `reporterId: "${decodeId(ticket.reporter.id)}"`
          : `reporterId: "${ticket.reporter.id}"`
        : ""
    }
    ${!!ticket.reporterType && !!ticket.reporterType ? `reporterType: "${ticket.reporterType}"` : ""}
    ${ticket.nameOfComplainant ? `nameOfComplainant: "${formatGQLString(ticket.nameOfComplainant)}"` : ""}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ""}
    ${ticket.status ? `status: "${formatGQLString(ticket.status)}"` : ""}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ""}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ""}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ""}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ""}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ""}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ""}
  `;
}

export function formatUpdateTicketGQL(ticket) {
  // eslint-disable-next-line no-param-reassign
  if (ticket.reporter) ticket.reporter = JSON.parse(JSON.parse(ticket.reporter || "{}"), "{}");
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${ticket.title}"` : ""}
    ${!!ticket.description && !!ticket.description ? `description: "${ticket.description}"` : ""}
    ${!!ticket.attendingStaff && !!ticket.attendingStaff ? `attendingStaffId: "${decodeId(ticket.attendingStaff.id)}"` : ""}
    ${
      ticket.reporter
        ? isBase64Encoded(ticket.reporter.id)
          ? `reporterId: "${decodeId(ticket.reporter.id)}"`
          : `reporterId: "${ticket.reporter.id}"`
        : ""
    }
    ${!!ticket.reporter && !!ticket.reporter ? `reporterType: "${ticket.reporterTypeName}"` : ""}
    ${ticket.nameOfComplainant ? `nameOfComplainant: "${formatGQLString(ticket.nameOfComplainant)}"` : ""}
    ${ticket.resolution ? `resolution: "${formatGQLString(ticket.resolution)}"` : ""}
    ${ticket.status ? `status: ${formatGQLString(ticket.status)}` : ""}
    ${ticket.priority ? `priority: "${formatGQLString(ticket.priority)}"` : ""}
    ${ticket.dueDate ? `dueDate: "${formatGQLString(ticket.dueDate)}"` : ""}
    ${ticket.dateSubmitted ? `dateSubmitted: "${formatGQLString(ticket.dateSubmitted)}"` : ""}
    ${ticket.dateOfIncident ? `dateOfIncident: "${formatGQLString(ticket.dateOfIncident)}"` : ""}
    ${!!ticket.channel && !!ticket.channel ? `channel: "${ticket.channel}"` : ""}
    ${!!ticket.flags && !!ticket.flags ? `flags: "${ticket.flags}"` : ""}
  `;
}

export function formatCloseTicketGQL(ticket, closingComment, commenter, commenterType) {
  return `
    ${ticket.id !== undefined && ticket.id !== null ? `id: "${ticket.id}"` : ""}
    ${!!ticket.category && !!ticket.category ? `category: "${ticket.category}"` : ""}
    ${!!ticket.title && !!ticket.title ? `title: "${formatGQLString(ticket.title)}"` : ""}
    ${!!ticket.description && !!ticket.description ? `description: "${formatGQLString(ticket.description)}"` : ""}
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
    ${category.id ? `id: "${formatGQLString(category.id)}"` : ""}
    ${category.code ? `code: "${formatGQLString(category.code)}"` : ""}
    ${category.name ? `name: "${formatGQLString(category.name)}"` : ""}
    ${typeof category.isActive === "boolean" ? `isActive: ${category.isActive}` : ""}
  `;
}

export function formatGrievanceTypeGQL(type) {
  return `
    ${type.id ? `id: "${formatGQLString(type.id)}"` : ""}
    ${type.code ? `code: "${formatGQLString(type.code)}"` : ""}
    ${type.name ? `name: "${formatGQLString(type.name)}"` : ""}
    ${typeof type.isActive === "boolean" ? `isActive: ${type.isActive}` : ""}
    ${type.category?.id ? `categoryId: "${formatGQLString(type.category.id)}"` : ""}
  `;
}

export function formatGrievanceChannelGQL(channel) {
  return `
    ${channel.id ? `id: "${formatGQLString(channel.id)}"` : ""}
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
    [
      "GRIEVANCE_TYPE_MUTATION_REQ",
      "GRIEVANCE_TYPE_CREATE_RESP",
      "GRIEVANCE_TYPE_MUTATION_ERR",
    ],
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
    [
      "GRIEVANCE_TYPE_MUTATION_REQ",
      "GRIEVANCE_TYPE_UPDATE_RESP",
      "GRIEVANCE_TYPE_MUTATION_ERR",
    ],
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
    [
      "GRIEVANCE_TYPE_MUTATION_REQ",
      "GRIEVANCE_TYPE_DELETE_RESP",
      "GRIEVANCE_TYPE_MUTATION_ERR",
    ],
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
  if (ticket && ticket.uuid) {
    const payload = formatPageQuery(
      "ticketAttachments",
      [`ticket_Uuid: "${ticket.uuid}"`],
      ["id", "uuid", "date", "filename", "mimeType", "ticket{id, uuid, ticketCode}"],
    );
    return graphql(payload, "TICKET_TICKET_ATTACHMENTS");
  }
  return { type: "TICKET_TICKET_ATTACHMENTS", payload: { data: [] } };
}

export function downloadAttachment(attach) {
  const url = new URL(`${window.location.origin}${baseApiUrl}/ticket/attach`);
  url.search = new URLSearchParams({ id: decodeId(attach.id) });
  return () =>
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => openBlob(blob, attach.filename, attach.mime));
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
    [
      REQUEST(ACTION_TYPE.MUTATION),
      SUCCESS(ACTION_TYPE.CLOSE_TICKET),
      ERROR(ACTION_TYPE.MUTATION),
    ],
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
