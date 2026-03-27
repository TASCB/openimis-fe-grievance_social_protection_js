import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { injectIntl } from "react-intl";
import { IconButton, Tooltip } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { connect } from "react-redux";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import {
  Searcher,
  withHistory,
  withModulesManager,
  formatMessage,
  historyPush,
} from "@openimis/fe-core";
import { MODULE_NAME, RIGHT_TICKET_EDIT } from "../constants";
import { fetchGrievanceTypes } from "../actions";
import GrievanceTypeFilter from "./GrievanceTypeFilter";

function styles(theme) {
  return {
    paper: { ...theme.paper.paper, margin: 0 },
    paperHeader: { ...theme.paper.header, padding: 10 },
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
}) {
  const dispatch = useDispatch();
  const [reset, setReset] = useState(0);

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

  const itemFormatters = () => {
    const formatters = [
      (type) => type.code,
      (type) => type.name,
      (type) =>
        type.isActive
          ? formatMessage(intl, MODULE_NAME, "status.active")
          : formatMessage(intl, MODULE_NAME, "status.inactive"),
      (type) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceType.viewTooltip")}>
          <IconButton
            onClick={() =>
              historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketType", [type.id], false)
            }
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    ];

    if (rights.includes(RIGHT_TICKET_EDIT)) {
      formatters.push((type) => (
        <Tooltip title={formatMessage(intl, MODULE_NAME, "grievanceType.editTooltip")}>
          <IconButton
            onClick={() =>
              historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketTypeEdit", [type.id], false)
            }
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }

    return formatters;
  };

  return (
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
      headers={() => [
        "grievanceType.code",
        "grievanceType.name",
        "grievanceType.status",
        "",
        ...(rights.includes(RIGHT_TICKET_EDIT) ? [""] : []),
      ]}
      itemFormatters={itemFormatters}
      sorts={() => [
        ["code", true],
        ["name", true],
      ]}
      onDoubleClick={(type) =>
        historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketType", [type.id], false)
      }
      reset={reset}
    />
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
