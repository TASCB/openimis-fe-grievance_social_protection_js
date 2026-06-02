import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import TicketReportSearcher from "../components/TicketReportSearcher";

function styles(theme) {
  return {
    page: theme.page,
    fab: theme.fab,
  };
}

function TicketReportPage({ classes, match }) {
  return (
    <div className={classes.page}>
      <TicketReportSearcher initialReport={match?.params?.report} />
    </div>
  );
}

export default withTheme(withStyles(styles)(TicketReportPage));
