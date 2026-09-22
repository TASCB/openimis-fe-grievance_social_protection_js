import React, { useEffect, useRef, useState } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  Form,
  Helmet,
  ProgressOrError,
  coreConfirm,
  formatMessage,
  formatMessageWithValues,
  historyPush,
  journalize,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
import GrievanceTypeHeadPanel from "../components/GrievanceTypeHeadPanel";
import {
  createGrievanceType,
  deleteGrievanceType,
  fetchGrievanceType,
  updateGrievanceType,
} from "../actions";
import {
  MODULE_NAME,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_DELETE,
  RIGHT_TICKET_EDIT,
  RIGHT_TICKET_SEARCH,
} from "../constants";

const styles = (theme) => ({ page: theme.page });

const ROUTE_LIST = "grievanceSocialProtection.route.ticketTypes";

function newType() {
  return { code: "", name: "", isActive: true, category: null };
}

function GrievanceTypeFormPage(props) {
  const {
    mode, classes, intl, modulesManager, history, typeId, grievanceType,
    fetchingGrievanceType, errorGrievanceType, submittingMutation, mutation, rights,
    confirmed,
  } = props;

  const [edited, setEdited] = useState(newType());
  const [resetKey, setResetKey] = useState(0);
  const prevSubmitting = useRef(false);
  const prevConfirmed = useRef(false);
  const confirmedAction = useRef(null);

  const isCreate = mode === "create";
  const canEdit = rights.includes(RIGHT_TICKET_EDIT);
  const readOnly = !isCreate && !canEdit;

  useEffect(() => {
    if (!isCreate && typeId) {
      props.fetchGrievanceType(modulesManager, [`id: "${typeId}"`, "first: 1"]);
    }
  }, [isCreate, typeId, modulesManager]);

  useEffect(() => {
    if (!isCreate && grievanceType) {
      setEdited(grievanceType);
      setResetKey((key) => key + 1);
    }
  }, [isCreate, grievanceType]);

  useEffect(() => {
    if (prevSubmitting.current && !submittingMutation && mutation) {
      props.journalize(mutation);
      historyPush(modulesManager, history, ROUTE_LIST);
    }
    prevSubmitting.current = submittingMutation;
  }, [submittingMutation, mutation]);

  useEffect(() => {
    if (!prevConfirmed.current && confirmed && confirmedAction.current) {
      confirmedAction.current();
      confirmedAction.current = null;
    }
    prevConfirmed.current = confirmed;
  }, [confirmed]);

  const canSave = () => !readOnly && !!edited.name && !!edited.category;

  const save = (data) => {
    const label = formatMessageWithValues(
      intl,
      MODULE_NAME,
      isCreate ? "grievanceType.createMutationLabel" : "grievanceType.updateMutationLabel",
      { name: data.name },
    );
    if (isCreate) props.createGrievanceType(data, label);
    else props.updateGrievanceType(data, label);
  };

  const onDelete = () => {
    confirmedAction.current = () =>
      props.deleteGrievanceType(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteMutationLabel", {
          name: edited.name,
        }),
      );
    props.coreConfirm(
      formatMessage(intl, MODULE_NAME, "grievanceType.deleteConfirmTitle"),
      formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteConfirmMessage", {
        name: edited.name,
      }),
    );
  };

  const back = () => historyPush(modulesManager, history, ROUTE_LIST);

  const titleKey = isCreate
    ? "grievanceType.createPageTitle"
    : mode === "edit"
      ? "grievanceType.editPageTitle"
      : "grievanceType.viewPageTitle";

  const canAccess = isCreate
    ? rights.includes(RIGHT_TICKET_ADD)
    : canEdit || rights.includes(RIGHT_TICKET_SEARCH);

  if (!canAccess) return null;

  const actions =
    !isCreate && rights.includes(RIGHT_TICKET_DELETE)
      ? [
          {
            doIt: onDelete,
            icon: <DeleteIcon />,
            disabled: submittingMutation,
            tooltip: formatMessage(intl, MODULE_NAME, "grievanceType.delete"),
          },
        ]
      : [];

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, MODULE_NAME, titleKey)} />
      <ProgressOrError progress={fetchingGrievanceType && !isCreate} error={errorGrievanceType} />
      {(isCreate || grievanceType) && (
        <Form
          key={resetKey}
          module={MODULE_NAME}
          title={titleKey}
          titleParams={{ name: edited.name ?? "" }}
          edited={edited}
          edited_id={typeId}
          reset={resetKey}
          openDirty
          onEditedChanged={setEdited}
          back={back}
          save={readOnly ? null : save}
          canSave={canSave}
          saveTooltip={formatMessage(intl, MODULE_NAME, "grievanceType.save")}
          HeadPanel={GrievanceTypeHeadPanel}
          readOnly={readOnly}
          actions={actions}
          rights={rights}
        />
      )}
    </div>
  );
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  confirmed: state.core.confirmed,
  typeId: props.match?.params?.type_id,
  grievanceType: state.grievanceSocialProtection.grievanceType,
  fetchingGrievanceType: state.grievanceSocialProtection.fetchingGrievanceType,
  errorGrievanceType: state.grievanceSocialProtection.errorGrievanceType,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGrievanceType,
      createGrievanceType,
      updateGrievanceType,
      deleteGrievanceType,
      coreConfirm,
      journalize,
    },
    dispatch,
  );

export default withHistory(
  withModulesManager(
    injectIntl(
      withTheme(
        withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(GrievanceTypeFormPage)),
      ),
    ),
  ),
);
