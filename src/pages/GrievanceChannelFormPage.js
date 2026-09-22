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
import GrievanceChannelHeadPanel from "../components/GrievanceChannelHeadPanel";
import {
  createGrievanceChannel,
  deleteGrievanceChannel,
  fetchGrievanceChannel,
  updateGrievanceChannel,
} from "../actions";
import {
  MODULE_NAME,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_DELETE,
  RIGHT_TICKET_EDIT,
  RIGHT_TICKET_SEARCH,
} from "../constants";

const styles = (theme) => ({ page: theme.page });

const ROUTE_LIST = "grievanceSocialProtection.route.ticketChannels";

function newChannel() {
  return { code: "", name: "", isActive: true };
}

function GrievanceChannelFormPage(props) {
  const {
    mode, classes, intl, modulesManager, history, channelId, grievanceChannel,
    fetchingGrievanceChannel, errorGrievanceChannel, submittingMutation, mutation, rights,
    confirmed,
  } = props;

  const [edited, setEdited] = useState(newChannel());
  const [resetKey, setResetKey] = useState(0);
  const prevSubmitting = useRef(false);
  const prevConfirmed = useRef(false);
  const confirmedAction = useRef(null);

  const isCreate = mode === "create";
  const canEdit = rights.includes(RIGHT_TICKET_EDIT);
  const readOnly = !isCreate && !canEdit;

  useEffect(() => {
    if (!isCreate && channelId) {
      props.fetchGrievanceChannel(modulesManager, [`id: "${channelId}"`, "first: 1"]);
    }
  }, [isCreate, channelId, modulesManager]);

  useEffect(() => {
    if (!isCreate && grievanceChannel) {
      setEdited(grievanceChannel);
      setResetKey((key) => key + 1);
    }
  }, [isCreate, grievanceChannel]);

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

  const canSave = () => !readOnly && !!edited.name;

  const save = (data) => {
    const label = formatMessageWithValues(
      intl,
      MODULE_NAME,
      isCreate ? "grievanceChannel.createMutationLabel" : "grievanceChannel.updateMutationLabel",
      { name: data.name },
    );
    if (isCreate) props.createGrievanceChannel(data, label);
    else props.updateGrievanceChannel(data, label);
  };

  const onDelete = () => {
    confirmedAction.current = () =>
      props.deleteGrievanceChannel(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteMutationLabel", {
          name: edited.name,
        }),
      );
    props.coreConfirm(
      formatMessage(intl, MODULE_NAME, "grievanceChannel.deleteConfirmTitle"),
      formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteConfirmMessage", {
        name: edited.name,
      }),
    );
  };

  const back = () => historyPush(modulesManager, history, ROUTE_LIST);

  const titleKey = isCreate
    ? "grievanceChannel.createPageTitle"
    : mode === "edit"
      ? "grievanceChannel.editPageTitle"
      : "grievanceChannel.viewPageTitle";

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
            tooltip: formatMessage(intl, MODULE_NAME, "grievanceChannel.delete"),
          },
        ]
      : [];

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, MODULE_NAME, titleKey)} />
      <ProgressOrError progress={fetchingGrievanceChannel && !isCreate} error={errorGrievanceChannel} />
      {(isCreate || grievanceChannel) && (
        <Form
          key={resetKey}
          module={MODULE_NAME}
          title={titleKey}
          titleParams={{ name: edited.name ?? "" }}
          edited={edited}
          edited_id={channelId}
          reset={resetKey}
          openDirty
          onEditedChanged={setEdited}
          back={back}
          save={readOnly ? null : save}
          canSave={canSave}
          saveTooltip={formatMessage(intl, MODULE_NAME, "grievanceChannel.save")}
          HeadPanel={GrievanceChannelHeadPanel}
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
  channelId: props.match?.params?.channel_id,
  grievanceChannel: state.grievanceSocialProtection.grievanceChannel,
  fetchingGrievanceChannel: state.grievanceSocialProtection.fetchingGrievanceChannel,
  errorGrievanceChannel: state.grievanceSocialProtection.errorGrievanceChannel,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGrievanceChannel,
      createGrievanceChannel,
      updateGrievanceChannel,
      deleteGrievanceChannel,
      coreConfirm,
      journalize,
    },
    dispatch,
  );

export default withHistory(
  withModulesManager(
    injectIntl(
      withTheme(
        withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(GrievanceChannelFormPage)),
      ),
    ),
  ),
);
