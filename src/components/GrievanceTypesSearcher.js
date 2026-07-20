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
import { deleteGrievanceType, fetchGrievanceTypes } from "../actions";
import GrievanceTypeFilter from "./GrievanceTypeFilter";

function styles(theme) {
  return {
    paper: { ...theme.paper.paper, margin: 0 },
    paperHeader: { ...theme.paper.header, padding: 10 },
    searcher: {
      "& table thead tr th:last-child, & table tbody tr td:last-child": {
        width: 116,
        minWidth: 116,
        maxWidth: 116,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        whiteSpace: "nowrap",
      },
    },
    actionCell: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      width: 108,
      minWidth: 108,
      maxWidth: 108,
    },
    actionButton: {
      width: 32,
      height: 32,
      padding: theme.spacing(0.5),
      marginLeft: theme.spacing(0.75),
      "&:first-child": {
        marginLeft: 0,
      },
    },
    deleteButton: { color: theme.palette.error.main },
  };
}

function GrievanceTypesSearcher({
  modulesManager,
  intl,
  history,
  rights,
  types,
  typesPageInfo,
  fetchingTypes,
  fetchedTypes,
  errorTypes,
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
      dispatch(fetchGrievanceTypes(modulesManager, prms));
    },
    [dispatch, modulesManager],
  );

  const handleDeleteConfirm = () => {
    const { item } = deleteDialog;
    setDeleteDialog({ open: false, item: null });
    dispatch(
      deleteGrievanceType(
        item,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteMutationLabel", {
          name: item.name,
        }),
      ),
    );
  };

  const filtersToQueryParams = (state) => {
    const prms = Object.keys(state.filters)
      .filter((f) => f !== "code")
      .filter((f) => f !== "categoryName")
      .filter((f) => !!state.filters[f].filter)
      .map((f) => state.filters[f].filter);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) prms.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) prms.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) prms.push(`orderBy: ["${state.orderBy}"]`);
    return prms;
  };

  const itemFormatters = () => {
    return [
      (type) => type.name,
      (type) => type.categoryName || type.category?.name || "",
      (type) =>
        type.isActive
          ? formatMessage(intl, MODULE_NAME, "status.active")
          : formatMessage(intl, MODULE_NAME, "status.inactive"),
      (type) => (
        <div className={classes.actionCell}>
          <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceType.viewTooltip")}>
            <IconButton
              className={classes.actionButton}
              onClick={() =>
                historyPush(
                  modulesManager,
                  history,
                  "grievanceSocialProtection.route.ticketType",
                  [type.id],
                  false,
                )
              }
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          {rights.includes(RIGHT_TICKET_EDIT) && (
            <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceType.editTooltip")}>
              <IconButton
                className={classes.actionButton}
                onClick={() =>
                  historyPush(
                    modulesManager,
                    history,
                    "grievanceSocialProtection.route.ticketTypeEdit",
                    [type.id],
                    false,
                  )
                }
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {rights.includes(RIGHT_TICKET_DELETE) && (
            <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceType.deleteTooltip")}>
              <IconButton
                className={classes.actionButton}
                onClick={() => setDeleteDialog({ open: true, item: type })}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ),
    ];
  };

  const headers = () => [
    "grievanceType.name",
    "grievanceType.category",
    "grievanceType.status",
    "",
  ];

  return (
    <>
      <div className={classes.searcher}>
        <Searcher
          module={MODULE_NAME}
          cacheFiltersKey={cacheFiltersKey}
          FilterPane={({ filters, onChangeFilters }) => (
            <GrievanceTypeFilter filters={filters} onChangeFilters={onChangeFilters} />
          )}
          filterPaneContributionsKey={filterPaneContributionsKey}
          items={types}
          itemsPageInfo={typesPageInfo}
          fetchingItems={fetchingTypes}
          fetchedItems={fetchedTypes}
          errorItems={errorTypes}
          tableTitle={formatMessage(intl, MODULE_NAME, "grievanceType.listTitle")}
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
            ["category__name", true],
          ]}
          onDoubleClick={(type) =>
            historyPush(
              modulesManager,
              history,
              "grievanceSocialProtection.route.ticketType",
              [type.id],
              false,
            )
          }
          reset={reset}
        />
      </div>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceType.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.item &&
              formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteConfirmMessage", {
                name: deleteDialog.item.name,
              })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceType.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  types: state.grievanceSocialProtection.grievanceTypes,
  typesPageInfo: state.grievanceSocialProtection.grievanceTypesPageInfo,
  fetchingTypes: state.grievanceSocialProtection.fetchingGrievanceTypes,
  fetchedTypes: state.grievanceSocialProtection.fetchedGrievanceTypes,
  errorTypes: state.grievanceSocialProtection.errorGrievanceTypes,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

export default withModulesManager(
  withHistory(
    injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(GrievanceTypesSearcher)))),
  ),
);
