import React, { useEffect, useRef, useState } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
} from "@material-ui/core";
import {
  formatMessage,
  formatMessageWithValues,
  historyPush,
  journalize,
  ProgressOrError,
  PublishedComponent,
  TextInput,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
import {
  createGrievanceCategory,
  fetchGrievanceCategory,
  updateGrievanceCategory,
} from "../actions";
import { MODULE_NAME, RIGHT_TICKET_ADD, RIGHT_TICKET_EDIT, RIGHT_TICKET_SEARCH } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  paper: {
    ...theme.paper.paper,
    padding: theme.spacing(3),
  },
  actions: {
    marginTop: theme.spacing(3),
    display: "flex",
    gap: theme.spacing(2),
  },
});

function newCategory() {
  return {
    code: "",
    name: "",
    isActive: true,
    type: null,
  };
}

function GrievanceCategoryFormPage({
  mode,
  classes,
  intl,
  modulesManager,
  history,
  categoryId,
  grievanceCategory,
  fetchingGrievanceCategory,
  errorGrievanceCategory,
  submittingMutation,
  mutation,
  rights,
  fetchGrievanceCategory,
  createGrievanceCategory,
  updateGrievanceCategory,
  journalize,
}) {
  const [edited, setEdited] = useState(newCategory());
  const previousSubmittingMutation = useRef(false);
  const readOnly = mode === "view";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isCreate && categoryId) {
      fetchGrievanceCategory(modulesManager, [`id: "${categoryId}"`, "first: 1"]);
    }
  }, [isCreate, categoryId, modulesManager, fetchGrievanceCategory]);

  useEffect(() => {
    if (!isCreate && grievanceCategory) {
      setEdited(grievanceCategory);
    }
  }, [isCreate, grievanceCategory]);

  useEffect(() => {
    if (previousSubmittingMutation.current && !submittingMutation && mutation) {
      journalize(mutation);
      historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketCategories");
    }
    previousSubmittingMutation.current = submittingMutation;
  }, [submittingMutation, mutation, journalize, modulesManager, history]);

  const canSave = () => !!edited.code && !!edited.name && !!edited.type?.id;

  const save = () => {
    if (!canSave()) return;
    if (isCreate) {
      createGrievanceCategory(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.createMutationLabel", {
          name: edited.name,
        }),
      );
    } else {
      updateGrievanceCategory(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.updateMutationLabel", {
          name: edited.name,
        }),
      );
    }
  };

  const back = () =>
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketCategories");

  const titleKey =
    mode === "create"
      ? "grievanceCategory.createPageTitle"
      : mode === "edit"
        ? "grievanceCategory.editPageTitle"
        : "grievanceCategory.viewPageTitle";

  const titleValues = { name: edited.name || grievanceCategory?.name || "" };
  const canAccess =
    (mode === "create" && rights.includes(RIGHT_TICKET_ADD)) ||
    (mode === "edit" && rights.includes(RIGHT_TICKET_EDIT)) ||
    (mode === "view" && rights.includes(RIGHT_TICKET_SEARCH));

  if (!canAccess) return null;

  return (
    <div className={classes.page}>
      <ProgressOrError progress={fetchingGrievanceCategory && !isCreate} error={errorGrievanceCategory} />
      {(isCreate || grievanceCategory) && (
        <Paper className={classes.paper}>
          <Typography variant="h6">
            {formatMessageWithValues(intl, MODULE_NAME, titleKey, titleValues)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceCategory.code"
                value={edited.code || ""}
                readOnly={readOnly}
                onChange={(code) => setEdited((prev) => ({ ...prev, code }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PublishedComponent
                pubRef="grievanceSocialProtection.GrievanceTypePicker"
                value={edited.type}
                readOnly={readOnly}
                onChange={(type) => setEdited((prev) => ({ ...prev, type }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceCategory.name"
                value={edited.name || ""}
                readOnly={readOnly}
                onChange={(name) => setEdited((prev) => ({ ...prev, name }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!edited.isActive}
                    disabled={readOnly}
                    onChange={(event) =>
                      setEdited((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                }
                label={formatMessage(intl, MODULE_NAME, "grievanceCategory.active")}
              />
            </Grid>
          </Grid>
          <div className={classes.actions}>
            <Button variant="outlined" onClick={back}>
              {formatMessage(intl, MODULE_NAME, "grievanceCategory.back")}
            </Button>
            {!readOnly && (
              <Button color="primary" variant="contained" disabled={!canSave() || submittingMutation} onClick={save}>
                {formatMessage(intl, MODULE_NAME, isCreate ? "grievanceCategory.create" : "grievanceCategory.save")}
              </Button>
            )}
          </div>
        </Paper>
      )}
    </div>
  );
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  categoryId: props.match.params.category_id,
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
