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
import TicketTypeSearcher from "./components/TicketTypeSearcher";
import TicketCategoriesPage from "./pages/TicketCategoriesPage";
import TicketReportPage from "./pages/TicketReportPage";

const ROUTE_TICKET_TICKETS = "ticket/tickets";
const ROUTE_TICKET_TICKET = "ticket/ticket";
const ROUTE_TICKET_NEW_TICKET = "ticket/newTicket";
const ROUTE_TICKET_TYPES = "ticket/types";
const ROUTE_TICKET_TYPES_CREATE = "ticket/types/create";
const ROUTE_TICKET_CATEGORIES = "ticket/categories";
const ROUTE_TICKET_CATEGORIES_CREATE = "ticket/categories/create";
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
      key: "grievanceSocialProtection.route.ticketSearcher",
      ref: TicketSearcher,
    },
    {
      key: "grievanceSocialProtection.route.ticketTypeSearcher",
      ref: TicketTypeSearcher,
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
  ],
  "core.Router": [
    { path: `${ROUTE_TICKET_TICKETS}`, component: TicketsPage },
    { path: `${ROUTE_TICKET_TICKET}/:ticket_uuid?/:version?`, component: TicketPage },
    { path: `${ROUTE_TICKET_NEW_TICKET}`, component: TicketPage },
    { path: `${ROUTE_TICKET_TYPES}`, component: TicketTypesPage },
    { path: `${ROUTE_TICKET_TYPES_CREATE}`, component: TicketTypesPage },
    { path: `${ROUTE_TICKET_CATEGORIES}`, component: TicketCategoriesPage },
    { path: `${ROUTE_TICKET_CATEGORIES_CREATE}`, component: TicketCategoriesPage },
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
