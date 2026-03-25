import React from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { historyPush, withModulesManager, withHistory, decodeId } from "@openimis/fe-core";
import TicketReportSearcher from "../components/TicketReportSearcher";

function styles(theme) {
  return {
    page: theme.page,
    fab: theme.fab,
  };
}

function TicketReportPage({ intl, classes, rights, modulesManager, history }) {
  function onDoubleClick(ticket, newTab = false) {
    const routeParams = ["grievanceSocialProtection.route.ticket", [decodeId(ticket.id)]];
    if (ticket?.isHistory) {
      routeParams[1].push(ticket.version);
    }
    historyPush(modulesManager, history, ...routeParams, newTab);
  }

  return (
    <div className={classes.page}>
      <TicketReportSearcher
        cacheFiltersKey="ticketPageFiltersCache"
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketReportPage)))),
  ),
);
