import React, { useEffect, useRef, useState } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  TextInput,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
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
  deleteButton: {
    marginLeft: "auto",
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
  },
});

function newCategory() {
  return { code: "", name: "", timeline: 0, isActive: true };
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
  deleteGrievanceCategory,
  journalize,
}) {
  const [edited, setEdited] = useState(newCategory());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const timeline = Number.parseInt(edited.timeline, 10);
  const canSave = () => !!edited.name && !Number.isNaN(timeline) && timeline >= 0;

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

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    deleteGrievanceCategory(
      edited,
      formatMessageWithValues(intl, MODULE_NAME, "grievanceCategory.deleteMutationLabel", {
        name: edited.name,
      }),
    );
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
            <Grid item xs={12} sm={4}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceCategory.code"
                value={edited.code || ""}
                readOnly={readOnly}
                onChange={(code) => setEdited((prev) => ({ ...prev, code }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceCategory.name"
                value={edited.name || ""}
                required
                readOnly={readOnly}
                onChange={(name) => setEdited((prev) => ({ ...prev, name }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceCategory.timeline"
                value={edited.timeline ?? ""}
                required
                readOnly={readOnly}
                type="number"
                inputProps={{ min: 0 }}
                onChange={(timeline) => setEdited((prev) => ({ ...prev, timeline }))}
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
              <Button
                color="primary"
                variant="contained"
                disabled={!canSave() || submittingMutation}
                onClick={save}
              >
                {formatMessage(
                  intl,
                  MODULE_NAME,
                  isCreate ? "grievanceCategory.create" : "grievanceCategory.save",
                )}
              </Button>
            )}
            {mode === "edit" && rights.includes(RIGHT_TICKET_DELETE) && (
              <Button
                variant="outlined"
                className={classes.deleteButton}
                disabled={submittingMutation}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {formatMessage(intl, MODULE_NAME, "grievanceCategory.delete")}
              </Button>
            )}
          </div>
        </Paper>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceCategory.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {formatMessageWithValues(
              intl,
              MODULE_NAME,
              "grievanceCategory.deleteConfirmMessage",
              { name: edited.name },
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceCategory.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
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
