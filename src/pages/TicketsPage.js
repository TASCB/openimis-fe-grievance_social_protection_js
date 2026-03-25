/* eslint-disable react/destructuring-assignment */
import React, { Component } from "react";
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
import TicketSearcher from "../components/TicketSearcher";

import { MODULE_NAME, RIGHT_TICKET_ADD } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

class TicketsPage extends Component {
  onDoubleClick = (ticket, newTab = false) => {
    const routeParams = ["grievanceSocialProtection.route.ticket", [decodeId(ticket.id)]];
    if (ticket?.isHistory) {
      routeParams[1].push(ticket.version);
    }
    historyPush(this.props.modulesManager, this.props.history, ...routeParams, newTab);
  };

  onAdd = () => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "grievanceSocialProtection.route.ticket",
    );
  };

  render() {
    const { intl, classes, rights } = this.props;

    return (
      <div className={classes.page}>
        <TicketSearcher
          cacheFiltersKey="ticketPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
        />
        {rights.includes(RIGHT_TICKET_ADD) &&
          withTooltip(
            <div className={classes.fab}>
              <Fab color="primary" onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </div>,
            formatMessage(intl, MODULE_NAME, "addNewticketTooltip"),
          )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
});

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketsPage)))),
  ),
);
