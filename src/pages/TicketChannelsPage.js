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
} from "@openimis/fe-core";

import { MODULE_NAME, RIGHT_TICKET_ADD } from "../constants";
import GrievanceChannelsSearcher from "../components/GrievanceChannelsSearcher";

function styles(theme) {
  return {
    page: theme.page,
    fab: theme.fab,
  };
}

function TicketChannelsPage({ intl, classes, rights, modulesManager, history }) {
  function handleCreate() {
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketChannelCreate");
  }

  return (
    <div className={classes.page}>
      <GrievanceChannelsSearcher cacheFiltersKey="grievanceChannelPageFiltersCache" />

      {rights.includes(RIGHT_TICKET_ADD) &&
        withTooltip(
          <div className={classes.fab}>
            <Fab color="primary" onClick={handleCreate}>
              <AddIcon />
            </Fab>
          </div>,
          formatMessage(intl, MODULE_NAME, "grievanceChannel.create"),
        )}
    </div>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketChannelsPage)))),
  ),
);
