// Disable due to core architecture
/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import React from "react";
import { ListAlt, AddCircleOutline } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import GrievanceMainMenu from "./menu/GrievanceMainMenu";
import TicketsPage from "./pages/TicketsPage";
import TicketPage from "./pages/TicketPage";
import TicketSearcher from "./components/TicketSearcher";
import TicketPriorityPicker from "./pickers/TicketPriorityPicker";
import TicketStatusPicker from "./pickers/TicketStatusPicker";
import CategoryPicker from "./pickers/CategoryPicker";
import GrievanceConfigurationDialog from "./dialogs/GrievanceConfigurationDialog";
import ChannelPicker from "./pickers/ChannelPicker";
import FlagPicker from "./pickers/FlagsPicker";
import { MODULE_NAME, RIGHT_TICKET_ADD, RIGHT_TICKET_SEARCH } from "./constants";
import TicketTypePicker from "./pickers/TicketTypePicker";
import TicketCategoryPicker from "./pickers/TicketCategoryPicker";
import TicketTypesPage from "./pages/TicketTypesPage";
import GrievanceTypesSearcher from "./components/GrievanceTypesSearcher";
import TicketCategoriesPage from "./pages/TicketCategoriesPage";
import TicketReportPage from "./pages/TicketReportPage";
import CreateTicketCategoryPage from "./pages/CreateTicketCategoryPage";
import ViewTicketCategoryPage from "./pages/ViewTicketCategoryPage";
import EditTicketCategoryPage from "./pages/EditTicketCategoryPage";
import CreateTicketTypePage from "./pages/CreateTicketTypePage";
import ViewTicketTypePage from "./pages/ViewTicketTypePage";
import EditTicketTypePage from "./pages/EditTicketTypePage";
import GrievanceTypePicker from "./pickers/GrievanceTypePicker";
import GrievanceCategoryPicker from "./pickers/GrievanceCategoryPicker";

const ROUTE_TICKET_TICKETS = "ticket/tickets";
const ROUTE_TICKET_TICKET = "ticket/ticket";
const ROUTE_TICKET_NEW_TICKET = "ticket/newTicket";
const ROUTE_TICKET_TYPES = "ticket/types";
const ROUTE_TICKET_TYPES_CREATE = "ticket/types/create";
const ROUTE_TICKET_TYPE = "ticket/types/type";
const ROUTE_TICKET_TYPE_EDIT = "ticket/types/type/edit";
const ROUTE_TICKET_CATEGORIES = "ticket/categories";
const ROUTE_TICKET_CATEGORIES_CREATE = "ticket/categories/create";
const ROUTE_TICKET_CATEGORY = "ticket/categories/category";
const ROUTE_TICKET_CATEGORY_EDIT = "ticket/categories/category/edit";
const ROUTE_TICKET_REPORTS = "ticket/reports";

const DEFAULT_CONFIG = {
  translations: [
    {
      key: "en",
      messages: messages_en,
    },
  ],
  reducers: [
    {
      key: "grievanceSocialProtection",
      reducer,
    },
  ],
  refs: [
    {
      key: "grievanceSocialProtection.route.tickets",
      ref: ROUTE_TICKET_TICKETS,
    },
    {
      key: "grievanceSocialProtection.route.ticket",
      ref: ROUTE_TICKET_TICKET,
    },
    {
      key: "grievanceSocialProtection.route.ticketTypes",
      ref: ROUTE_TICKET_TYPES,
    },
    {
      key: "grievanceSocialProtection.route.ticketTypeCreate",
      ref: ROUTE_TICKET_TYPES_CREATE,
    },
    {
      key: "grievanceSocialProtection.route.ticketType",
      ref: ROUTE_TICKET_TYPE,
    },
    {
      key: "grievanceSocialProtection.route.ticketTypeEdit",
      ref: ROUTE_TICKET_TYPE_EDIT,
    },
    {
      key: "grievanceSocialProtection.route.ticketCategories",
      ref: ROUTE_TICKET_CATEGORIES,
    },
    {
      key: "grievanceSocialProtection.route.ticketCategoryCreate",
      ref: ROUTE_TICKET_CATEGORIES_CREATE,
    },
    {
      key: "grievanceSocialProtection.route.ticketCategory",
      ref: ROUTE_TICKET_CATEGORY,
    },
    {
      key: "grievanceSocialProtection.route.ticketCategoryEdit",
      ref: ROUTE_TICKET_CATEGORY_EDIT,
    },
    {
      key: "grievanceSocialProtection.route.ticketSearcher",
      ref: TicketSearcher,
    },
    {
      key: "grievanceSocialProtection.route.ticketTypeSearcher",
      ref: GrievanceTypesSearcher,
    },
    {
      key: "grievanceSocialProtection.TicketTypePicker",
      ref: TicketTypePicker,
    },
    {
      key: "grievanceSocialProtection.TicketCategoryPicker",
      ref: TicketCategoryPicker,
    },
    {
      key: "grievanceSocialProtection.TicketStatusPicker",
      ref: TicketStatusPicker,
    },
    {
      key: "grievanceSocialProtection.TicketPriorityPicker",
      ref: TicketPriorityPicker,
    },
    {
      key: "grievanceSocialProtection.DropDownCategoryPicker",
      ref: CategoryPicker,
    },
    {
      key: "grievanceSocialProtection.CategoryPicker",
      ref: CategoryPicker,
    },
    {
      key: "grievanceSocialProtection.FlagPicker",
      ref: FlagPicker,
    },
    {
      key: "grievanceSocialProtection.ChannelPicker",
      ref: ChannelPicker,
    },
    {
      key: "grievanceSocialProtection.GrievanceConfigurationDialog",
      ref: GrievanceConfigurationDialog,
    },
    {
      key: "grievanceSocialProtection.GrievanceTypePicker",
      ref: GrievanceTypePicker,
    },
    {
      key: "grievanceSocialProtection.GrievanceCategoryPicker",
      ref: GrievanceCategoryPicker,
    },
  ],
  "core.Router": [
    { path: `${ROUTE_TICKET_TICKETS}`, component: TicketsPage },
    { path: `${ROUTE_TICKET_TICKET}/:ticket_uuid?/:version?`, component: TicketPage },
    { path: `${ROUTE_TICKET_NEW_TICKET}`, component: TicketPage },
    { path: `${ROUTE_TICKET_TYPES}`, component: TicketTypesPage },
    { path: `${ROUTE_TICKET_TYPES_CREATE}`, component: CreateTicketTypePage },
    { path: `${ROUTE_TICKET_TYPE}/:type_id`, component: ViewTicketTypePage },
    { path: `${ROUTE_TICKET_TYPE_EDIT}/:type_id`, component: EditTicketTypePage },
    { path: `${ROUTE_TICKET_CATEGORIES}`, component: TicketCategoriesPage },
    { path: `${ROUTE_TICKET_CATEGORIES_CREATE}`, component: CreateTicketCategoryPage },
    { path: `${ROUTE_TICKET_CATEGORY}/:category_id`, component: ViewTicketCategoryPage },
    { path: `${ROUTE_TICKET_CATEGORY_EDIT}/:category_id`, component: EditTicketCategoryPage },
    { path: `${ROUTE_TICKET_REPORTS}`, component: TicketReportPage },
  ],
  "core.MainMenu": [
    {
      name: "GrievanceMainMenu",
      component: GrievanceMainMenu,
    },
  ],
  "grievance.MainMenu": [
    {
      text: "Reports",
      icon: <ListAlt />,
      route: `/${ROUTE_TICKET_REPORTS}`,
      filter: (rights) => rights.includes(RIGHT_TICKET_SEARCH),
      id: "grievance.reports",
    },

    {
      text: "Categories",
      icon: <ListAlt />,
      route: `/${ROUTE_TICKET_CATEGORIES}`,
      filter: (rights) => rights.includes(RIGHT_TICKET_SEARCH),
      id: "grievance.categories",
    },
    {
      text: "Types",
      icon: <ListAlt />,
      route: `/${ROUTE_TICKET_TYPES}`,
      filter: (rights) => rights.includes(RIGHT_TICKET_SEARCH),
      id: "grievance.types",
    },
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.grievance.grievances" />,
      icon: <ListAlt />,
      route: `/${ROUTE_TICKET_TICKETS}`,
      filter: (rights) => rights.includes(RIGHT_TICKET_SEARCH),
      id: "grievance.grievances",
    },
    {
      text: <FormattedMessage module={MODULE_NAME} id="menu.grievance.add" />,
      icon: <AddCircleOutline />,
      route: `/${ROUTE_TICKET_NEW_TICKET}`,
      filter: (rights) => rights.includes(RIGHT_TICKET_ADD),
      id: "grievance.add",
    },
  ],
};

export const GrievanceSocialProtectionModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
