import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { Helmet, useModulesManager, useTranslations } from "@openimis/fe-core";
import TicketReportSearcher from "../components/TicketReportSearcher";
import { MODULE_NAME, RIGHT_TICKET_SEARCH } from "../constants";

function styles(theme) {
  return {
    page: theme.page,
  };
}

function TicketReportPage({ classes, match, rights }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  return (
    rights.includes(RIGHT_TICKET_SEARCH) && (
      <div className={classes.page}>
        <Helmet title={formatMessage("grievanceReport.title")} />
        <TicketReportSearcher initialReport={match?.params?.report} rights={rights} />
      </div>
    )
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withTheme(withStyles(styles)(connect(mapStateToProps)(TicketReportPage)));
