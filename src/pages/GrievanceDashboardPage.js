import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import GrievanceDashboard from "../components/dashboard/GrievanceDashboard";
import { RIGHT_TICKET_SEARCH } from "../constants";

function styles(theme) {
  return {
    page: theme.page,
  };
}

function GrievanceDashboardPage({ classes, rights }) {
  return (
    rights.includes(RIGHT_TICKET_SEARCH) && (
      <div className={classes.page}>
        <GrievanceDashboard />
      </div>
    )
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withTheme(withStyles(styles)(connect(mapStateToProps)(GrievanceDashboardPage)));
