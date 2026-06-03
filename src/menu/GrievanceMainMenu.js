/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import { GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY, MODULE_NAME } from "../constants";

function GrievanceMainMenu(props) {
  const entries = props.modulesManager
    .getContribs(GRIEVANCE_MAIN_MENU_CONTRIBUTION_KEY)
    .filter((c) => !c.filter || c.filter(props.rights));

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(props.intl, MODULE_NAME, "mainMenuGrievance")}
      entries={entries}
      menuId="GrievanceMainMenu"
    />
  );
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
});

export default injectIntl(withModulesManager(connect(mapStateToProps)(GrievanceMainMenu)));
