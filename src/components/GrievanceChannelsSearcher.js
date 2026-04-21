import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { injectIntl } from "react-intl";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { connect } from "react-redux";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  Searcher,
  withHistory,
  withModulesManager,
  formatMessage,
  formatMessageWithValues,
  historyPush,
} from "@openimis/fe-core";
import { MODULE_NAME, RIGHT_TICKET_DELETE, RIGHT_TICKET_EDIT } from "../constants";
import { deleteGrievanceChannel, fetchGrievanceChannels } from "../actions";
import GrievanceChannelFilter from "./GrievanceChannelFilter";

function styles(theme) {
  return {
    paper: { ...theme.paper.paper, margin: 0 },
    paperHeader: { ...theme.paper.header, padding: 10 },
    deleteButton: { color: theme.palette.error.main },
  };
}

function GrievanceChannelsSearcher({
  modulesManager,
  intl,
  history,
  rights,
  channels,
  channelsPageInfo,
  fetchingChannels,
  fetchedChannels,
  errorChannels,
  submittingMutation,
  mutation,
  cacheFiltersKey,
  filterPaneContributionsKey,
  classes,
}) {
  const dispatch = useDispatch();
  const [reset, setReset] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

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

  useEffect(() => {
    if (!submittingMutation && mutation?.clientMutationId) {
      setReset((prev) => prev + 1);
    }
  }, [submittingMutation, mutation]);

  const fetch = useCallback(
    (prms) => {
      dispatch(fetchGrievanceChannels(modulesManager, prms));
    },
    [dispatch, modulesManager],
  );

  const handleDeleteConfirm = () => {
    const { item } = deleteDialog;
    setDeleteDialog({ open: false, item: null });
    dispatch(
      deleteGrievanceChannel(
        item,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteMutationLabel", {
          name: item.name,
        }),
      ),
    );
  };

  const filtersToQueryParams = (state) => {
    const prms = Object.keys(state.filters)
      .filter((f) => f !== "code")
      .filter((f) => !!state.filters[f].filter)
      .map((f) => state.filters[f].filter);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) prms.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) prms.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) prms.push(`orderBy: ["${state.orderBy}"]`);
    return prms;
  };

  const itemFormatters = () => {
    const formatters = [
      (channel) => channel.name,
      (channel) =>
        channel.isActive
          ? formatMessage(intl, MODULE_NAME, "status.active")
          : formatMessage(intl, MODULE_NAME, "status.inactive"),
      (channel) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceChannel.viewTooltip")}>
          <IconButton
            onClick={() =>
              historyPush(
                modulesManager,
                history,
                "grievanceSocialProtection.route.ticketChannel",
                [channel.id],
                false,
              )
            }
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    ];

    if (rights.includes(RIGHT_TICKET_EDIT)) {
      formatters.push((channel) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceChannel.editTooltip")}>
          <IconButton
            onClick={() =>
              historyPush(
                modulesManager,
                history,
                "grievanceSocialProtection.route.ticketChannelEdit",
                [channel.id],
                false,
              )
            }
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }

    if (rights.includes(RIGHT_TICKET_DELETE)) {
      formatters.push((channel) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceChannel.deleteTooltip")}>
          <IconButton
            className={classes.deleteButton}
            onClick={() => setDeleteDialog({ open: true, item: channel })}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ));
    }

    return formatters;
  };

  const headers = () => [
    "grievanceChannel.name",
    "grievanceChannel.status",
    "",
    ...(rights.includes(RIGHT_TICKET_EDIT) ? [""] : []),
    ...(rights.includes(RIGHT_TICKET_DELETE) ? [""] : []),
  ];

  return (
    <>
      <Searcher
        module={MODULE_NAME}
        cacheFiltersKey={cacheFiltersKey}
        FilterPane={({ filters, onChangeFilters }) => (
          <GrievanceChannelFilter filters={filters} onChangeFilters={onChangeFilters} />
        )}
        filterPaneContributionsKey={filterPaneContributionsKey}
        items={channels}
        itemsPageInfo={channelsPageInfo}
        fetchingItems={fetchingChannels}
        fetchedItems={fetchedChannels}
        errorItems={errorChannels}
        tableTitle={formatMessage(intl, MODULE_NAME, "grievanceChannel.listTitle")}
        rowsPerPageOptions={rowsPerPageOptions}
        defaultPageSize={defaultPageSize}
        fetch={fetch}
        rowIdentifier={(r) => r.id}
        filtersToQueryParams={filtersToQueryParams}
        defaultOrderBy="name"
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={() => [
          ["name", true],
        ]}
        onDoubleClick={(channel) =>
          historyPush(
            modulesManager,
            history,
            "grievanceSocialProtection.route.ticketChannel",
            [channel.id],
            false,
          )
        }
        reset={reset}
      />

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceChannel.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.item &&
              formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteConfirmMessage", {
                name: deleteDialog.item.name,
              })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceChannel.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  channels: state.grievanceSocialProtection.grievanceChannels,
  channelsPageInfo: state.grievanceSocialProtection.grievanceChannelsPageInfo,
  fetchingChannels: state.grievanceSocialProtection.fetchingGrievanceChannels,
  fetchedChannels: state.grievanceSocialProtection.fetchedGrievanceChannels,
  errorChannels: state.grievanceSocialProtection.errorGrievanceChannels,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

export default withModulesManager(
  withHistory(
    injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(GrievanceChannelsSearcher)))),
  ),
);
