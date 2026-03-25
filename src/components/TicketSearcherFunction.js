/* eslint-disable no-nested-ternary */
/* eslint-disable no-undef */
/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { injectIntl } from "react-intl";
import { IconButton, Tooltip } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import {
  formatMessageWithValues,
  journalize,
  Searcher,
  withHistory,
  withModulesManager,
  PublishedComponent,
  formatMessage,
  historyPush,
  decodeId,
} from "@openimis/fe-core";
import EditIcon from "@material-ui/icons/Edit";
import { MODULE_NAME, RIGHT_TICKET_EDIT } from "../constants";
import { fetchTicketSummaries, resolveTicket } from "../actions";
import { isEmptyObject } from "../utils/utils";

import TicketFilter from "./TicketFilter";
import EnquiryDialog from "./EnquiryDialog";

const styles = (theme) => ({
  paper: { ...theme.paper.paper, margin: 0 },
  paperHeader: { ...theme.paper.header, padding: 10 },
  tableTitle: theme.table.title,
  fab: theme.fab,
  button: { margin: theme.spacing(1) },
  item: { padding: theme.spacing(1) },
});

const TicketSearcher = ({
  intl,
  modulesManager,
  history,
  classes,
  cacheFiltersKey,
  filterPaneContributionsKey,
  onDoubleClick,
}) => {
  const dispatch = useDispatch();

  const rights = useSelector((state) => state.core?.user?.i_user?.rights || []);

  const tickets = useSelector((state) => state.grievanceSocialProtection.tickets);
  const ticketsPageInfo = useSelector((state) => state.grievanceSocialProtection.ticketsPageInfo);
  const fetchingTickets = useSelector((state) => state.grievanceSocialProtection.fetchingTickets);
  const fetchedTickets = useSelector((state) => state.grievanceSocialProtection.fetchedTickets);
  const errorTickets = useSelector((state) => state.grievanceSocialProtection.errorTickets);
  const submittingMutation = useSelector(
    (state) => state.grievanceSocialProtection.submittingMutation,
  );
  const mutation = useSelector((state) => state.grievanceSocialProtection.mutation);
  const confirmed = useSelector((state) => state.core.confirmed);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [chfid, setChfid] = useState(null);
  const [confirmedAction, setConfirmedAction] = useState(null);
  const [reset, setReset] = useState(0);
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [displayVersion, setDisplayVersion] = useState(false);

  const rowsPerPageOptions = modulesManager.getConf(
    "fe-grievance_social_protection",
    "ticketFilter.rowsPerPageOptions",
    [10, 20, 50, 100],
  );

  const defaultPageSize = modulesManager.getConf(
    "fe-grievance_social_protection",
    "ticketFilter.defaultPageSize",
    10,
  );

  // Effect for mutation/submission changes
  useEffect(() => {
    if (!submittingMutation && mutation) {
      journalize(mutation);
      setReset((prev) => prev + 1);
    }
    if (confirmed && confirmedAction) {
      confirmedAction();
    }
  }, [submittingMutation, mutation, confirmed, confirmedAction]);

  const fetch = useCallback(
    (prms) => {
      setDisplayVersion(showHistoryFilter);
      dispatch(fetchTicketSummaries(modulesManager, prms));
    },
    [dispatch, modulesManager, showHistoryFilter],
  );

  const rowIdentifier = (r) => r.uuid;
  const isShowHistory = () => displayVersion;

  const filtersToQueryParams = (state) => {
    const prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f].filter)
      .map((f) => state.filters[f].filter);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) prms.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) prms.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) prms.push(`orderBy: ["${state.orderBy}"]`);
    return prms;
  };

  const headers = () => [
    "tickets.code",
    "tickets.category",
    "tickets.type",
    "tickets.status",
    "ticket.dateOfIncident",
    "tickets.beneficary",
    "tickets.priority",
    isShowHistory() ? "tickets.version" : "",
  ];

  const sorts = () => [
    ["code", true],
    ["category", true],
    ["category", true],
    ["reporter_id", true],
    ["priority", true],
    ["status", true],
    ["version", true],
  ];

  const itemFormatters = () => {
    const formatters = [
      (ticket) => ticket.code,
      (ticket) => ticket.title,
      (ticket) => {
        const reporter =
          typeof ticket.reporter === "object"
            ? ticket.reporter
            : JSON.parse(JSON.parse(ticket.reporter || "{}") || "{}");
        if (ticket.reporterTypeName === "individual") {
          return (
            <PublishedComponent
              pubRef="individual.IndividualPicker"
              readOnly
              withNull
              label="ticket.reporter"
              required
              value={reporter && !isEmptyObject(reporter) ? reporter : null}
            />
          );
        }
        if (ticket.reporterTypeName === "beneficiary") {
          return (
            <PublishedComponent
              pubRef="socialProtection.BeneficiaryPicker"
              readOnly
              withNull
              label="ticket.reporter"
              required
              value={{
                individual: {
                  firstName: ticket.reporterFirstName,
                  lastName: ticket.reporterLastName,
                  dob: ticket.reporterDob,
                },
              }}
            />
          );
        }
        if (ticket.reporterTypeName === "user") {
          return (
            <PublishedComponent
              pubRef="admin.UserPicker"
              readOnly
              value={reporter && !isEmptyObject(reporter) ? reporter : null}
              module="core"
              label="ticket.reporter"
            />
          );
        }
        return `${formatMessage(intl, MODULE_NAME, "anonymousUser")}`;
      },
      (ticket) => ticket.priority,
      (ticket) => ticket.status,
      (ticket) => ticket.category,
      (ticket) => (isShowHistory() ? ticket?.version : null),
    ];

    if (rights.includes(RIGHT_TICKET_EDIT)) {
      formatters.push((ticket) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "editButtonTooltip")}>
          <IconButton
            disabled={ticket?.isHistory}
            onClick={() =>
              historyPush(
                modulesManager,
                history,
                "grievanceSocialProtection.route.ticket",
                [decodeId(ticket.id)],
                false,
              )
            }
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    return formatters;
  };

  const rowDisabled = (selection, i) => !!i.validityTo;
  const rowLocked = (selection, i) => !!i.clientMutationId;

  const filterPane = ({ filters, onChangeFilters }) => (
    <TicketFilter
      filters={filters}
      onChangeFilters={onChangeFilters}
      setShowHistoryFilter={setShowHistoryFilter}
    />
  );

  return (
    <>
      <EnquiryDialog
        open={enquiryOpen}
        chfid={chfid}
        onClose={() => {
          setEnquiryOpen(false);
          setChfid(null);
        }}
      />
      <Searcher
        module={MODULE_NAME}
        cacheFiltersKey={cacheFiltersKey}
        FilterPane={filterPane}
        filterPaneContributionsKey={filterPaneContributionsKey}
        items={tickets}
        itemsPageInfo={ticketsPageInfo}
        fetchingItems={fetchingTickets}
        fetchedItems={fetchedTickets}
        errorItems={errorTickets}
        tableTitle={formatMessageWithValues(intl, MODULE_NAME, "ticketSummaries", {
          count: ticketsPageInfo?.totalCount,
        })}
        rowsPerPageOptions={rowsPerPageOptions}
        defaultPageSize={defaultPageSize}
        fetch={fetch}
        rowIdentifier={rowIdentifier}
        filtersToQueryParams={filtersToQueryParams}
        defaultOrderBy="-dateCreated"
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowDisabled={rowDisabled}
        rowLocked={rowLocked}
        onDoubleClick={(i) => !i.clientMutationId && onDoubleClick(i)}
        reset={reset}
      />
    </>
  );
};

export default withModulesManager(
  withHistory(injectIntl(withTheme(withStyles(styles)(TicketSearcher)))),
);
