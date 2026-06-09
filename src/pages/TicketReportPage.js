import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import TicketReportSearcher from "../components/TicketReportSearcher";
import { RIGHT_TICKET_SEARCH } from "../constants";

function styles(theme) {
  return {
    page: theme.page,
    fab: theme.fab,
  };
}

function TicketReportPage({ classes, match, rights }) {
  return (
    rights.includes(RIGHT_TICKET_SEARCH) && (
      <div className={classes.page}>
        <TicketReportSearcher initialReport={match?.params?.report} rights={rights} />
      </div>
    )
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withTheme(withStyles(styles)(connect(mapStateToProps)(TicketReportPage)));
