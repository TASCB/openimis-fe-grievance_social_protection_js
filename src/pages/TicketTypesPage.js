import React from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import {
  historyPush,
  withModulesManager,
  withHistory,
  withTooltip,
  formatMessage,
  decodeId,
} from "@openimis/fe-core";

import { MODULE_NAME, RIGHT_TICKET_ADD } from "../constants";
import TicketTypeSearcher from "../components/TicketTypeSearcher";

function styles(theme) {
  return {
    page: theme.page,
    fab: theme.fab,
  };
}

function TicketTypesPage({ intl, classes, rights, modulesManager, history }) {
  function onDoubleClick(ticket, newTab = false) {
    const routeParams = ["grievanceSocialProtection.route.ticket", [decodeId(ticket.id)]];
    if (ticket?.isHistory) {
      routeParams[1].push(ticket.version);
    }
    historyPush(modulesManager, history, ...routeParams, newTab);
  }

  function handleCreate() {
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticket");
  }

  return (
    <div className={classes.page}>
      <TicketTypeSearcher cacheFiltersKey="ticketPageFiltersCache" onDoubleClick={onDoubleClick} />

      {rights.includes(RIGHT_TICKET_ADD) &&
        withTooltip(
          <div className={classes.fab}>
            <Fab color="primary" onClick={handleCreate}>
              <AddIcon />
            </Fab>
          </div>,
          formatMessage(intl, MODULE_NAME, "addNewticketTooltip"),
        )}
    </div>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketTypesPage)))),
  ),
);
