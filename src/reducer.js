// Disabled due to consistency with other modules
/* eslint-disable default-param-last */

import {
  parseData,
  pageInfo,
  formatServerError,
  formatGraphQLError,
  dispatchMutationReq,
  dispatchMutationResp,
  dispatchMutationErr,
  decodeId,
} from "@openimis/fe-core";
import { CLEAR, ERROR, REQUEST, SUCCESS } from "./utils/action-type";

export const ACTION_TYPE = {
  GET_GRIEVANCE_CONFIGURATION: "GET_GRIEVANCE_CONFIGURATION",
  GRIEVANCE_REPORTS: "GRIEVANCE_REPORTS",
  EXPORT_GRIEVANCE_REPORTS: "EXPORT_GRIEVANCE_REPORTS",
  MUTATION: "GRIEVANCE_SOCIAL_PROTECTION_MUTATION",
  CLOSE_TICKET: "CLOSE_TICKET",
  RESOLVE_BY_COMMENT: "RESOLVE_BY_COMMENT",
  REOPEN_TICKET: "REOPEN_TICKET",
  CLEAR_TICKET: "CLEAR_TICKET",
};

function reducer(
  state = {
    fetchingTickets: false,
    errorTickets: null,
    fetchedTickets: false,
    tickets: [],
    ticketsPageInfo: { totalCount: 0 },

    fetchingTicket: false,
    errorTicket: null,
    fetchedTicket: false,
    ticket: null,
    ticketPageInfo: { totalCount: 0 },

    fetchingCategory: false,
    fetchedCategory: false,
    errorCategory: null,
    category: [],
    categoryPageInfo: { totalCount: 0 },

    fetchingGrievanceCategories: false,
    fetchedGrievanceCategories: false,
    errorGrievanceCategories: null,
    grievanceCategories: [],
    grievanceCategoriesPageInfo: { totalCount: 0 },

    fetchingGrievanceCategory: false,
    fetchedGrievanceCategory: false,
    errorGrievanceCategory: null,
    grievanceCategory: null,

    fetchingGrievanceTypes: false,
    fetchedGrievanceTypes: false,
    errorGrievanceTypes: null,
    grievanceTypes: [],
    grievanceTypesPageInfo: { totalCount: 0 },

    fetchingGrievanceType: false,
    fetchedGrievanceType: false,
    errorGrievanceType: null,
    grievanceType: null,

    fetchingGrievanceChannels: false,
    fetchedGrievanceChannels: false,
    errorGrievanceChannels: null,
    grievanceChannels: [],
    grievanceChannelsPageInfo: { totalCount: 0 },

    fetchingGrievanceChannel: false,
    fetchedGrievanceChannel: false,
    errorGrievanceChannel: null,
    grievanceChannel: null,

    fetchingTicketAttachments: false,
    fetchedTicketAttachments: false,
    errorTicketAttachments: null,
    ticketAttachments: null,

    uploadingAttachments: false,
    uploadAttachmentsResult: null,
    errorUploadAttachments: null,
    pendingAttachments: [],

    fetchingGrievanceConfig: false,
    fetchedGrievanceConfig: false,
    errorGrievanceConfig: null,
    grievanceConfig: null,

    fetchingGrievanceLocationScope: false,
    fetchedGrievanceLocationScope: false,
    errorGrievanceLocationScope: null,
    grievanceLocationScope: null,

    fetchingGrievanceReports: false,
    fetchedGrievanceReports: false,
    errorGrievanceReports: null,
    grievanceReports: [],

    submittingMutation: false,
    mutation: {},

    fetchingTicketComments: false,
    fetchedTicketComments: false,
    errorTicketComments: null,
    ticketComments: null,
  },
  action,
) {
  switch (action.type) {
    case "TICKET_TICKETS_REQ":
      return {
        ...state,
        fetchingTickets: true,
        fetchedTickets: false,
        tickets: [],
        ticketsPageInfo: { totalCount: 0 },
        errorTickets: null,
      };
    case "TICKET_TICKETS_RESP":
      return {
        ...state,
        fetchingTickets: false,
        fetchedTickets: true,
        tickets: parseData(action.payload.data.tickets),
        ticketsPageInfo: pageInfo(action.payload.data.tickets),
        errorTickets: formatGraphQLError(action.payload),
      };
    case "TICKET_TICKETS_ERR":
      return {
        ...state,
        fetching: false,
        error: formatServerError(action.payload),
      };
    case "TICKET_TICKET_REQ":
      return {
        ...state,
        fetchingTicket: true,
        fetchedTicket: false,
        ticket: null,
        errorTicket: null,
      };
    case "TICKET_TICKET_RESP":
      return {
        ...state,
        fetchingTicket: false,
        fetchedTicket: true,
        ticket: parseData(action.payload.data.tickets).map((ticket) => ({
          ...ticket,
          id: decodeId(ticket.id),
        }))?.[0],
        errorTicket: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_LOCATION_SCOPE_REQ":
      return {
        ...state,
        fetchingGrievanceLocationScope: true,
        fetchedGrievanceLocationScope: false,
        errorGrievanceLocationScope: null,
      };
    case "GRIEVANCE_LOCATION_SCOPE_RESP":
      return {
        ...state,
        fetchingGrievanceLocationScope: false,
        fetchedGrievanceLocationScope: true,
        grievanceLocationScope: action.payload.data.grievanceLocationScope,
        errorGrievanceLocationScope: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_LOCATION_SCOPE_ERR":
      return {
        ...state,
        fetchingGrievanceLocationScope: false,
        fetchedGrievanceLocationScope: false,
        errorGrievanceLocationScope: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.CLEAR_TICKET):
      return {
        ...state,
        fetchingTicket: false,
        fetchedTicket: false,
        ticket: null,
        errorTicket: null,
        fetchingTicketAttachments: false,
        fetchedTicketAttachments: false,
        errorTicketAttachments: null,
        ticketAttachments: null,
        uploadingAttachments: false,
        uploadAttachmentsResult: null,
        errorUploadAttachments: null,
        pendingAttachments: [],
        fetchingTicketComments: false,
        fetchedTicketComments: false,
        ticketComments: [],
        ticketCommentsPageInfo: { totalCount: 0 },
        errorTicketComments: null,
      };
    case "COMMENT_COMMENTS_REQ":
      return {
        ...state,
        fetchingTicketComments: false,
        fetchedTicketComments: false,
        ticketComments: state.ticketComments || [],
        ticketCommentsPageInfo: { totalCount: 0 },
        errorTicketComments: null,
      };
    case "COMMENT_COMMENTS_RESP":
      return {
        ...state,
        fetchingTicketComments: false,
        fetchedTicketComments: true,
        ticketComments: parseData(action.payload.data.comments).map((comment) => ({
          ...comment,
          id: decodeId(comment.id),
        })),
        ticketCommentsPageInfo: pageInfo(action.payload.data.comments),
        errorTicketComments: formatGraphQLError(action.payload),
      };
    case "COMMENT_COMMENTS_ERR":
      return {
        ...state,
        fetchingTicketComments: false,
        ticketComments: [],
        error: formatServerError(action.payload),
      };
    case "CATEGORY_CATEGORY_REQ":
      return {
        ...state,
        fetchingCategory: true,
        fetchedCategory: false,
        category: [],
        errorCategory: null,
      };
    case "CATEGORY_CATEGORY_RESP":
      return {
        ...state,
        fetchingCategory: false,
        fetchedCategory: true,
        category: parseData(action.payload.data.category),
        categoryPageInfo: pageInfo(action.payload.data.category),
        errorCategory: formatGraphQLError(action.payload),
      };
    case "CATEGORY_CATEGORY_ERR":
      return {
        ...state,
        fetching: false,
        error: formatServerError(action.payload),
      };
    case "GRIEVANCE_CATEGORY_CATEGORIES_REQ":
      return {
        ...state,
        fetchingGrievanceCategories: true,
        fetchedGrievanceCategories: false,
        grievanceCategories: [],
        grievanceCategoriesPageInfo: { totalCount: 0 },
        errorGrievanceCategories: null,
      };
    case "GRIEVANCE_CATEGORY_CATEGORIES_RESP":
      return {
        ...state,
        fetchingGrievanceCategories: false,
        fetchedGrievanceCategories: true,
        grievanceCategories: parseData(action.payload.data.grievanceCategories).map((category) => ({
          ...category,
          id: decodeId(category.id),
        })),
        grievanceCategoriesPageInfo: pageInfo(action.payload.data.grievanceCategories),
        errorGrievanceCategories: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_CATEGORY_CATEGORIES_ERR":
      return {
        ...state,
        fetchingGrievanceCategories: false,
        grievanceCategories: [],
        errorGrievanceCategories: formatServerError(action.payload),
      };
    case "GRIEVANCE_CATEGORY_CATEGORY_REQ":
      return {
        ...state,
        fetchingGrievanceCategory: true,
        fetchedGrievanceCategory: false,
        grievanceCategory: null,
        errorGrievanceCategory: null,
      };
    case "GRIEVANCE_CATEGORY_CATEGORY_RESP":
      return {
        ...state,
        fetchingGrievanceCategory: false,
        fetchedGrievanceCategory: true,
        grievanceCategory: parseData(action.payload.data.grievanceCategories).map((category) => ({
          ...category,
          id: decodeId(category.id),
        }))?.[0],
        errorGrievanceCategory: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_CATEGORY_CATEGORY_ERR":
      return {
        ...state,
        fetchingGrievanceCategory: false,
        grievanceCategory: null,
        errorGrievanceCategory: formatServerError(action.payload),
      };
    case "GRIEVANCE_TYPE_TYPES_REQ":
      return {
        ...state,
        fetchingGrievanceTypes: true,
        fetchedGrievanceTypes: false,
        grievanceTypes: [],
        grievanceTypesPageInfo: { totalCount: 0 },
        errorGrievanceTypes: null,
      };
    case "GRIEVANCE_TYPE_TYPES_RESP":
      return {
        ...state,
        fetchingGrievanceTypes: false,
        fetchedGrievanceTypes: true,
        grievanceTypes: parseData(action.payload.data.grievanceTypes).map((type) => ({
          ...type,
          id: decodeId(type.id),
          category: type.category ? { ...type.category, id: decodeId(type.category.id) } : null,
        })),
        grievanceTypesPageInfo: pageInfo(action.payload.data.grievanceTypes),
        errorGrievanceTypes: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_TYPE_TYPES_ERR":
      return {
        ...state,
        fetchingGrievanceTypes: false,
        grievanceTypes: [],
        errorGrievanceTypes: formatServerError(action.payload),
      };
    case "GRIEVANCE_TYPE_TYPE_REQ":
      return {
        ...state,
        fetchingGrievanceType: true,
        fetchedGrievanceType: false,
        grievanceType: null,
        errorGrievanceType: null,
      };
    case "GRIEVANCE_TYPE_TYPE_RESP":
      return {
        ...state,
        fetchingGrievanceType: false,
        fetchedGrievanceType: true,
        grievanceType: parseData(action.payload.data.grievanceTypes).map((type) => ({
          ...type,
          id: decodeId(type.id),
          category: type.category ? { ...type.category, id: decodeId(type.category.id) } : null,
        }))?.[0],
        errorGrievanceType: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_TYPE_TYPE_ERR":
      return {
        ...state,
        fetchingGrievanceType: false,
        grievanceType: null,
        errorGrievanceType: formatServerError(action.payload),
      };
    case "GRIEVANCE_CHANNEL_CHANNELS_REQ":
      return {
        ...state,
        fetchingGrievanceChannels: true,
        fetchedGrievanceChannels: false,
        grievanceChannels: [],
        grievanceChannelsPageInfo: { totalCount: 0 },
        errorGrievanceChannels: null,
      };
    case "GRIEVANCE_CHANNEL_CHANNELS_RESP":
      return {
        ...state,
        fetchingGrievanceChannels: false,
        fetchedGrievanceChannels: true,
        grievanceChannels: parseData(action.payload.data.grievanceChannels).map((channel) => ({
          ...channel,
          id: decodeId(channel.id),
        })),
        grievanceChannelsPageInfo: pageInfo(action.payload.data.grievanceChannels),
        errorGrievanceChannels: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_CHANNEL_CHANNELS_ERR":
      return {
        ...state,
        fetchingGrievanceChannels: false,
        grievanceChannels: [],
        errorGrievanceChannels: formatServerError(action.payload),
      };
    case "GRIEVANCE_CHANNEL_CHANNEL_REQ":
      return {
        ...state,
        fetchingGrievanceChannel: true,
        fetchedGrievanceChannel: false,
        grievanceChannel: null,
        errorGrievanceChannel: null,
      };
    case "GRIEVANCE_CHANNEL_CHANNEL_RESP":
      return {
        ...state,
        fetchingGrievanceChannel: false,
        fetchedGrievanceChannel: true,
        grievanceChannel: parseData(action.payload.data.grievanceChannels).map((channel) => ({
          ...channel,
          id: decodeId(channel.id),
        }))?.[0],
        errorGrievanceChannel: formatGraphQLError(action.payload),
      };
    case "GRIEVANCE_CHANNEL_CHANNEL_ERR":
      return {
        ...state,
        fetchingGrievanceChannel: false,
        grievanceChannel: null,
        errorGrievanceChannel: formatServerError(action.payload),
      };
    case "TICKET_TICKET_ATTACHMENTS_REQ":
      return {
        ...state,
        fetchingTicketAttachments: true,
        fetchedTicketAttachments: false,
        ticketAttachments: null,
        errorTicketAttachments: null,
      };
    case "TICKET_TICKET_ATTACHMENTS_RESP":
      return {
        ...state,
        fetchingTicketAttachments: false,
        fetchedTicketAttachments: true,
        ticketAttachments: parseData(action.payload.data.ticketAttachments),
        errorTicketAttachments: formatGraphQLError(action.payload),
      };
    case "TICKET_TICKET_ATTACHMENTS_ERR":
      return {
        ...state,
        fetchingTicketAttachments: false,
        errorTicketAttachments: formatServerError(action.payload),
      };
    case "TICKET_TICKET_ATTACHMENTS_CLEAR":
      return {
        ...state,
        ticketAttachments: null,
        fetchedTicketAttachments: false,
      };
    case "TICKET_UPLOAD_ATTACHMENTS_REQ":
      return {
        ...state,
        uploadingAttachments: true,
        uploadAttachmentsResult: null,
        errorUploadAttachments: null,
      };
    case "TICKET_UPLOAD_ATTACHMENTS_RESP":
      return {
        ...state,
        uploadingAttachments: false,
        uploadAttachmentsResult: action.payload,
        errorUploadAttachments: null,
      };
    case "TICKET_UPLOAD_ATTACHMENTS_ERR":
      return {
        ...state,
        uploadingAttachments: false,
        errorUploadAttachments: action.payload,
      };
    case "TICKET_PENDING_ATTACHMENTS_SET":
      return {
        ...state,
        pendingAttachments: action.payload || [],
      };
    case "TICKET_PENDING_ATTACHMENTS_CLEAR":
      return {
        ...state,
        pendingAttachments: [],
      };
    case "TICKET_INSUREE_TICKETS_REQ":
      return {
        ...state,
        fetchingTickets: true,
        fetchedTickets: false,
        tickets: null,
        policy: null,
        errorTickets: null,
      };
    case "TICKET_INSUREE_TICKETS_RESP":
      return {
        ...state,
        fetchingTickets: false,
        fetchedTickets: true,
        tickets: parseData(action.payload.data.ticketsByInsuree),
        ticketsPageInfo: pageInfo(action.payload.data.ticketsByInsuree),
        errorTickets: formatGraphQLError(action.payload),
      };
    case "TICKET_INSUREE_TICKETS_ERR":
      return {
        ...state,
        fetchingTickets: false,
        errorTickets: formatServerError(action.payload),
      };
    case REQUEST(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: true,
        fetchedGrievanceConfig: false,
        errorGrievanceConfig: null,
        grievanceConfig: null,
      };
    case SUCCESS(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: false,
        fetchedGrievanceConfig: true,
        errorGrievanceConfig: null,
        grievanceConfig: action.payload.data.grievanceConfig,
      };
    case ERROR(ACTION_TYPE.GET_GRIEVANCE_CONFIGURATION):
      return {
        ...state,
        fetchingGrievanceConfig: false,
        fetchedGrievanceConfig: false,
        errorGrievanceConfig: formatGraphQLError(action.payload),
        grievanceConfig: null,
      };
    case REQUEST(ACTION_TYPE.GRIEVANCE_REPORTS):
      return {
        ...state,
        fetchingGrievanceReports: true,
        fetchedGrievanceReports: false,
        errorGrievanceReports: null,
        grievanceReports: [],
      };
    case SUCCESS(ACTION_TYPE.GRIEVANCE_REPORTS):
      return {
        ...state,
        fetchingGrievanceReports: false,
        fetchedGrievanceReports: true,
        errorGrievanceReports: formatGraphQLError(action.payload),
        grievanceReports: action.payload.data.grievanceReports || [],
      };
    case ERROR(ACTION_TYPE.GRIEVANCE_REPORTS):
      return {
        ...state,
        fetchingGrievanceReports: false,
        fetchedGrievanceReports: false,
        errorGrievanceReports: formatServerError(action.payload),
        grievanceReports: [],
      };
    case REQUEST(ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return dispatchMutationErr(state, action);
    case SUCCESS(ACTION_TYPE.RESOLVE_BY_COMMENT):
      return dispatchMutationResp(state, "resolveGrievanceByComment", action);
    case SUCCESS(ACTION_TYPE.CLOSE_TICKET):
      return dispatchMutationResp(state, "closeTicket", action);
    case SUCCESS(ACTION_TYPE.REOPEN_TICKET):
      return dispatchMutationResp(state, "reopenTicket", action);
    case "TICKET_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "TICKET_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "TICKET_CREATE_TICKET_RESP":
      return dispatchMutationResp(state, "createTicket", action);
    case "TICKET_UPDATE_TICKET_RESP":
      return dispatchMutationResp(state, "updateTicket", action);
    case "TICKET_DELETE_TICKET_RESP":
      return dispatchMutationResp(state, "deleteTicket", action);
    case "GRIEVANCE_CATEGORY_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "GRIEVANCE_CATEGORY_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "GRIEVANCE_CATEGORY_CREATE_RESP":
      return dispatchMutationResp(state, "createGrievanceCategory", action);
    case "GRIEVANCE_CATEGORY_UPDATE_RESP":
      return dispatchMutationResp(state, "updateGrievanceCategory", action);
    case "GRIEVANCE_CATEGORY_DELETE_RESP":
      return dispatchMutationResp(state, "deleteGrievanceCategory", action);
    case "GRIEVANCE_TYPE_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "GRIEVANCE_TYPE_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "GRIEVANCE_TYPE_CREATE_RESP":
      return dispatchMutationResp(state, "createGrievanceType", action);
    case "GRIEVANCE_TYPE_UPDATE_RESP":
      return dispatchMutationResp(state, "updateGrievanceType", action);
    case "GRIEVANCE_TYPE_DELETE_RESP":
      return dispatchMutationResp(state, "deleteGrievanceType", action);
    case "GRIEVANCE_CHANNEL_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "GRIEVANCE_CHANNEL_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "GRIEVANCE_CHANNEL_CREATE_RESP":
      return dispatchMutationResp(state, "createGrievanceChannel", action);
    case "GRIEVANCE_CHANNEL_UPDATE_RESP":
      return dispatchMutationResp(state, "updateGrievanceChannel", action);
    case "GRIEVANCE_CHANNEL_DELETE_RESP":
      return dispatchMutationResp(state, "deleteGrievanceChannel", action);
    case "TICKET_ATTACHMENT_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "TICKET_ATTACHMENT_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "TICKET_CREATE_TICKET_ATTACHMENT_RESP":
      return dispatchMutationResp(state, "createTicketAttachment", action);
    default:
      return state;
  }
}

export default reducer;
