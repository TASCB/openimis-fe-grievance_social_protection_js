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
import GrievanceCategoryHeadPanel from "../components/GrievanceCategoryHeadPanel";
import {
  createGrievanceCategory,
  deleteGrievanceCategory,
  fetchGrievanceCategory,
  updateGrievanceCategory,
} from "../actions";
import {
  MODULE_NAME,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_DELETE,
  RIGHT_TICKET_EDIT,
  RIGHT_TICKET_SEARCH,
} from "../constants";

const styles = (theme) => ({ page: theme.page });

const ROUTE_LIST = "grievanceSocialProtection.route.ticketCategories";

function newCategory() {
  return { code: "", name: "", timeline: 0, isActive: true };
}

function GrievanceCategoryFormPage(props) {
  const {
    mode, classes, intl, modulesManager, history, categoryId, grievanceCategory,
    fetchingGrievanceCategory, errorGrievanceCategory, submittingMutation, mutation, rights,
    confirmed,
  } = props;

  const [edited, setEdited] = useState(newCategory());
  const [resetKey, setResetKey] = useState(0);
  const prevSubmitting = useRef(false);
  const prevConfirmed = useRef(false);
  const confirmedAction = useRef(null);

  const isCreate = mode === "create";
  const canEdit = rights.includes(RIGHT_TICKET_EDIT);
  const readOnly = !isCreate && !canEdit;

  useEffect(() => {
    if (!isCreate && categoryId) {
      props.fetchGrievanceCategory(modulesManager, [`id: "${categoryId}"`, "first: 1"]);
    }
  }, [isCreate, categoryId, modulesManager]);

  useEffect(() => {
    if (!isCreate && grievanceCategory) {
      setEdited(grievanceCategory);
      setResetKey((key) => key + 1);
    }
  }, [isCreate, grievanceCategory]);

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

  const timeline = Number.parseInt(edited.timeline, 10);
  const canSave = () => !readOnly && !!edited.name && !Number.isNaN(timeline) && timeline >= 0;

  const save = (data) => {
    const label = formatMessageWithValues(
      intl,
      MODULE_NAME,
      isCreate ? "grievanceCategory.createMutationLabel" : "grievanceCategory.updateMutationLabel",
      { name: data.name },
    );
    if (isCreate) props.createGrievanceCategory(data, label);
    else props.updateGrievanceCategory(data, label);
  };

  const onDelete = () => {
    confirmedAction.current = () =>
      props.deleteGrievanceCategory(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.deleteMutationLabel", {
          name: edited.name,
        }),
      );
    props.coreConfirm(
      formatMessage(intl, MODULE_NAME, "grievanceCategory.deleteConfirmTitle"),
      formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.deleteConfirmMessage", {
        name: edited.name,
      }),
    );
  };

  const back = () => historyPush(modulesManager, history, ROUTE_LIST);

  const titleKey = isCreate
    ? "grievanceCategory.createPageTitle"
    : mode === "edit"
      ? "grievanceCategory.editPageTitle"
      : "grievanceCategory.viewPageTitle";

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
            tooltip: formatMessage(intl, MODULE_NAME, "grievanceCategory.delete"),
          },
        ]
      : [];

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, MODULE_NAME, titleKey)} />
      <ProgressOrError progress={fetchingGrievanceCategory && !isCreate} error={errorGrievanceCategory} />
      {(isCreate || grievanceCategory) && (
        <Form
          key={resetKey}
          module={MODULE_NAME}
          title={titleKey}
          titleParams={{ name: edited.name ?? "" }}
          edited={edited}
          edited_id={categoryId}
          reset={resetKey}
          openDirty
          onEditedChanged={setEdited}
          back={back}
          save={readOnly ? null : save}
          canSave={canSave}
          saveTooltip={formatMessage(intl, MODULE_NAME, "grievanceCategory.save")}
          HeadPanel={GrievanceCategoryHeadPanel}
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
  categoryId: props.match?.params?.category_id,
  grievanceCategory: state.grievanceSocialProtection.grievanceCategory,
  fetchingGrievanceCategory: state.grievanceSocialProtection.fetchingGrievanceCategory,
  errorGrievanceCategory: state.grievanceSocialProtection.errorGrievanceCategory,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGrievanceCategory,
      createGrievanceCategory,
      updateGrievanceCategory,
      deleteGrievanceCategory,
      coreConfirm,
      journalize,
    },
    dispatch,
  );

export default withHistory(
  withModulesManager(
    injectIntl(
      withTheme(
        withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(GrievanceCategoryFormPage)),
      ),
    ),
  ),
);
