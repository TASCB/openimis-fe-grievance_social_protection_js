import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { injectIntl } from "react-intl";
import { IconButton, Tooltip } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { connect } from "react-redux";
import {
  coreConfirm,
  journalize,
  Searcher,
  withHistory,
  withModulesManager,
  formatMessage,
  historyPush,
  decodeId,
} from "@openimis/fe-core";
import EditIcon from "@material-ui/icons/Edit";
import { MODULE_NAME, RIGHT_TICKET_EDIT } from "../constants";
import { fetchTicketSummaries, resolveTicket } from "../actions";
import EnquiryDialog from "./EnquiryDialog";
import TicketReportFilter from "./TicketReportFilter";

function styles(theme) {
  return {
    fab: theme.fab,
    tableTitle: theme.table.title,
    paper: { ...theme.paper.paper, margin: 0 },
    paperHeader: { ...theme.paper.header, padding: 10 },
    button: { margin: theme.spacing(1) },
    item: { padding: theme.spacing(1) },
  };
}

function TicketReportSearcher({
  modulesManager,
  intl,
  history,
  rights,
  tickets,
  ticketsPageInfo,
  fetchingTickets,
  fetchedTickets,
  errorTickets,
  submittingMutation,
  mutation,
  confirmed,
  cacheFiltersKey,
  filterPaneContributionsKey,
  onDoubleClick,
}) {
  const dispatch = useDispatch();

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

  // ComponentDidUpdate equivalent
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

  function rowIdentifier(r) {
    return r.uuid;
  }

  function isShowHistory() {
    return displayVersion;
  }

  function filtersToQueryParams(state) {
    const prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f].filter)
      .map((f) => state.filters[f].filter);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) prms.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) prms.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) prms.push(`orderBy: ["${state.orderBy}"]`);
    return prms;
  }

  function headers() {
    return [
      "tickets.code",
      "tickets.category",
      "tickets.type",
      "tickets.status",
      "tickets.reporter",
      "tickets.dateOfIncident",
      isShowHistory() ? "tickets.version" : "",
    ];
  }

  function sorts() {
    return [
      ["code", true],
      ["category", true],
      ["type", true],
      ["reporter", true],
      ["status", true],
    ];
  }

  function itemFormatters() {
    const formatters = [
      (ticket) => ticket.code,
      (ticket) => ticket.category,
      (ticket) => ticket.reporter,
      (ticket) => ticket.status,
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
  }

  function rowDisabled(selection, i) {
    return !!i.validityTo;
  }

  function rowLocked(selection, i) {
    return !!i.clientMutationId;
  }

  function filterPane({ filters, onChangeFilters }) {
    return (
      <TicketReportFilter
        filters={filters}
        onChangeFilters={onChangeFilters}
        setShowHistoryFilter={setShowHistoryFilter}
      />
    );
  }

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
        tableTitle={"Grievance reports"}
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
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  tickets: state.grievanceSocialProtection.tickets,
  ticketsPageInfo: state.grievanceSocialProtection.ticketsPageInfo,
  fetchingTickets: state.grievanceSocialProtection.fetchingTickets,
  fetchedTickets: state.grievanceSocialProtection.fetchedTickets,
  errorTickets: state.grievanceSocialProtection.errorTickets,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  confirmed: state.core.confirmed,
});

export default withModulesManager(
  withHistory(
    injectIntl(
      withTheme(
        withStyles(styles)(
          connect(mapStateToProps, {
            fetchTicketSummaries,
            resolveTicket,
            journalize,
            coreConfirm,
          })(TicketReportSearcher),
        ),
      ),
    ),
  ),
);
