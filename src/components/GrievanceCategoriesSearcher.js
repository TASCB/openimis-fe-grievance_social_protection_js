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
import { deleteGrievanceCategory, fetchGrievanceCategories } from "../actions";
import GrievanceCategoryFilter from "./GrievanceCategoryFilter";

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

function GrievanceCategoriesSearcher({
  modulesManager,
  intl,
  history,
  rights,
  categories,
  categoriesPageInfo,
  fetchingCategories,
  fetchedCategories,
  errorCategories,
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
      dispatch(fetchGrievanceCategories(modulesManager, prms));
    },
    [dispatch, modulesManager],
  );

  const handleDeleteConfirm = () => {
    const { item } = deleteDialog;
    setDeleteDialog({ open: false, item: null });
    dispatch(
      deleteGrievanceCategory(
        item,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.deleteMutationLabel", {
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
    return [
      (category) => category.name,
      (category) => category.timeline,
      (category) =>
        category.isActive
          ? formatMessage(intl, MODULE_NAME, "status.active")
          : formatMessage(intl, MODULE_NAME, "status.inactive"),
      (category) => (
        <div className={classes.actionCell}>
          <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceCategory.viewTooltip")}>
            <IconButton
              className={classes.actionButton}
              onClick={() =>
                historyPush(
                  modulesManager,
                  history,
                  "grievanceSocialProtection.route.ticketCategory",
                  [category.id],
                  false,
                )
              }
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          {rights.includes(RIGHT_TICKET_EDIT) && (
            <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceCategory.editTooltip")}>
              <IconButton
                className={classes.actionButton}
                onClick={() =>
                  historyPush(
                    modulesManager,
                    history,
                    "grievanceSocialProtection.route.ticketCategoryEdit",
                    [category.id],
                    false,
                  )
                }
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {rights.includes(RIGHT_TICKET_DELETE) && (
            <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceCategory.deleteTooltip")}>
              <IconButton
                className={classes.actionButton}
                onClick={() => setDeleteDialog({ open: true, item: category })}
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
    "grievanceCategory.name",
    "grievanceCategory.timeline",
    "grievanceCategory.status",
    "",
  ];

  return (
    <>
      <div className={classes.searcher}>
        <Searcher
          module={MODULE_NAME}
          cacheFiltersKey={cacheFiltersKey}
          FilterPane={({ filters, onChangeFilters }) => (
            <GrievanceCategoryFilter filters={filters} onChangeFilters={onChangeFilters} />
          )}
          filterPaneContributionsKey={filterPaneContributionsKey}
          items={categories}
          itemsPageInfo={categoriesPageInfo}
          fetchingItems={fetchingCategories}
          fetchedItems={fetchedCategories}
          errorItems={errorCategories}
          tableTitle={formatMessage(intl, MODULE_NAME, "grievanceCategory.listTitle")}
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
            ["timeline", true],
          ]}
          onDoubleClick={(category) =>
            historyPush(
              modulesManager,
              history,
              "grievanceSocialProtection.route.ticketCategory",
              [category.id],
              false,
            )
          }
          reset={reset}
        />
      </div>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceCategory.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.item &&
              formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.deleteConfirmMessage", {
                name: deleteDialog.item.name,
              })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceCategory.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  categories: state.grievanceSocialProtection.grievanceCategories,
  categoriesPageInfo: state.grievanceSocialProtection.grievanceCategoriesPageInfo,
  fetchingCategories: state.grievanceSocialProtection.fetchingGrievanceCategories,
  fetchedCategories: state.grievanceSocialProtection.fetchedGrievanceCategories,
  errorCategories: state.grievanceSocialProtection.errorGrievanceCategories,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

export default withModulesManager(
  withHistory(
    injectIntl(
      withTheme(withStyles(styles)(connect(mapStateToProps)(GrievanceCategoriesSearcher))),
    ),
  ),
);
