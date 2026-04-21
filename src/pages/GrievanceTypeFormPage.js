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
  PublishedComponent,
  TextInput,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
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

function newType() {
  return { code: "", name: "", isActive: true, category: null };
}

function GrievanceTypeFormPage({
  mode,
  classes,
  intl,
  modulesManager,
  history,
  typeId,
  grievanceType,
  fetchingGrievanceType,
  errorGrievanceType,
  submittingMutation,
  mutation,
  rights,
  fetchGrievanceType,
  createGrievanceType,
  updateGrievanceType,
  deleteGrievanceType,
  journalize,
}) {
  const [edited, setEdited] = useState(newType());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const previousSubmittingMutation = useRef(false);
  const readOnly = mode === "view";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isCreate && typeId) {
      fetchGrievanceType(modulesManager, [`id: "${typeId}"`, "first: 1"]);
    }
  }, [isCreate, typeId, modulesManager, fetchGrievanceType]);

  useEffect(() => {
    if (!isCreate && grievanceType) {
      setEdited(grievanceType);
    }
  }, [isCreate, grievanceType]);

  useEffect(() => {
    if (previousSubmittingMutation.current && !submittingMutation && mutation) {
      journalize(mutation);
      historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketTypes");
    }
    previousSubmittingMutation.current = submittingMutation;
  }, [submittingMutation, mutation, journalize, modulesManager, history]);

  const canSave = () => !!edited.name && !!edited.category?.id;

  const save = () => {
    if (!canSave()) return;
    if (isCreate) {
      createGrievanceType(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceType.createMutationLabel", {
          name: edited.name,
        }),
      );
    } else {
      updateGrievanceType(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceType.updateMutationLabel", {
          name: edited.name,
        }),
      );
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    deleteGrievanceType(
      edited,
      formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteMutationLabel", {
        name: edited.name,
      }),
    );
  };

  const back = () =>
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketTypes");

  const titleKey =
    mode === "create"
      ? "grievanceType.createPageTitle"
      : mode === "edit"
        ? "grievanceType.editPageTitle"
        : "grievanceType.viewPageTitle";

  const titleValues = { name: edited.name || grievanceType?.name || "" };
  const canAccess =
    (mode === "create" && rights.includes(RIGHT_TICKET_ADD)) ||
    (mode === "edit" && rights.includes(RIGHT_TICKET_EDIT)) ||
    (mode === "view" && rights.includes(RIGHT_TICKET_SEARCH));

  if (!canAccess) return null;

  return (
    <div className={classes.page}>
      <ProgressOrError progress={fetchingGrievanceType && !isCreate} error={errorGrievanceType} />
      {(isCreate || grievanceType) && (
        <Paper className={classes.paper}>
          <Typography variant="h6">
            {formatMessageWithValues(intl, MODULE_NAME, titleKey, titleValues)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceType.code"
                value={edited.code || ""}
                readOnly={readOnly}
                onChange={(code) => setEdited((prev) => ({ ...prev, code }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceType.name"
                value={edited.name || ""}
                required
                readOnly={readOnly}
                onChange={(name) => setEdited((prev) => ({ ...prev, name }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PublishedComponent
                pubRef="grievanceSocialProtection.GrievanceCategoryPicker"
                value={edited.category}
                readOnly={readOnly}
                required
                onChange={(category) => setEdited((prev) => ({ ...prev, category }))}
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
                label={formatMessage(intl, MODULE_NAME, "grievanceType.active")}
              />
            </Grid>
          </Grid>
          <div className={classes.actions}>
            <Button variant="outlined" onClick={back}>
              {formatMessage(intl, MODULE_NAME, "grievanceType.back")}
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
                  isCreate ? "grievanceType.create" : "grievanceType.save",
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
                {formatMessage(intl, MODULE_NAME, "grievanceType.delete")}
              </Button>
            )}
          </div>
        </Paper>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceType.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {formatMessageWithValues(intl, MODULE_NAME, "grievanceType.deleteConfirmMessage", {
              name: edited.name,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceType.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
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
