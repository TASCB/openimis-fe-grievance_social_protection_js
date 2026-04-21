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

function newChannel() {
  return { code: "", name: "", isActive: true };
}

function GrievanceChannelFormPage({
  mode,
  classes,
  intl,
  modulesManager,
  history,
  channelId,
  grievanceChannel,
  fetchingGrievanceChannel,
  errorGrievanceChannel,
  submittingMutation,
  mutation,
  rights,
  fetchGrievanceChannel,
  createGrievanceChannel,
  updateGrievanceChannel,
  deleteGrievanceChannel,
  journalize,
}) {
  const [edited, setEdited] = useState(newChannel());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const previousSubmittingMutation = useRef(false);
  const readOnly = mode === "view";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isCreate && channelId) {
      fetchGrievanceChannel(modulesManager, [`id: "${channelId}"`, "first: 1"]);
    }
  }, [isCreate, channelId, modulesManager, fetchGrievanceChannel]);

  useEffect(() => {
    if (!isCreate && grievanceChannel) {
      setEdited(grievanceChannel);
    }
  }, [isCreate, grievanceChannel]);

  useEffect(() => {
    if (previousSubmittingMutation.current && !submittingMutation && mutation) {
      journalize(mutation);
      historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketChannels");
    }
    previousSubmittingMutation.current = submittingMutation;
  }, [submittingMutation, mutation, journalize, modulesManager, history]);

  const canSave = () => !!edited.name;

  const save = () => {
    if (!canSave()) return;
    if (isCreate) {
      createGrievanceChannel(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.createMutationLabel", {
          name: edited.name,
        }),
      );
    } else {
      updateGrievanceChannel(
        edited,
        formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.updateMutationLabel", {
          name: edited.name,
        }),
      );
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    deleteGrievanceChannel(
      edited,
      formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteMutationLabel", {
        name: edited.name,
      }),
    );
  };

  const back = () =>
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketChannels");

  const titleKey =
    mode === "create"
      ? "grievanceChannel.createPageTitle"
      : mode === "edit"
        ? "grievanceChannel.editPageTitle"
        : "grievanceChannel.viewPageTitle";

  const titleValues = { name: edited.name || grievanceChannel?.name || "" };
  const canAccess =
    (mode === "create" && rights.includes(RIGHT_TICKET_ADD)) ||
    (mode === "edit" && rights.includes(RIGHT_TICKET_EDIT)) ||
    (mode === "view" && rights.includes(RIGHT_TICKET_SEARCH));

  if (!canAccess) return null;

  return (
    <div className={classes.page}>
      <ProgressOrError progress={fetchingGrievanceChannel && !isCreate} error={errorGrievanceChannel} />
      {(isCreate || grievanceChannel) && (
        <Paper className={classes.paper}>
          <Typography variant="h6">
            {formatMessageWithValues(intl, MODULE_NAME, titleKey, titleValues)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceChannel.code"
                value={edited.code || ""}
                readOnly={readOnly}
                onChange={(code) => setEdited((prev) => ({ ...prev, code }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextInput
                module={MODULE_NAME}
                label="grievanceChannel.name"
                value={edited.name || ""}
                required
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
                label={formatMessage(intl, MODULE_NAME, "grievanceChannel.active")}
              />
            </Grid>
          </Grid>
          <div className={classes.actions}>
            <Button variant="outlined" onClick={back}>
              {formatMessage(intl, MODULE_NAME, "grievanceChannel.back")}
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
                  isCreate ? "grievanceChannel.create" : "grievanceChannel.save",
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
                {formatMessage(intl, MODULE_NAME, "grievanceChannel.delete")}
              </Button>
            )}
          </div>
        </Paper>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {formatMessage(intl, MODULE_NAME, "grievanceChannel.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {formatMessageWithValues(intl, MODULE_NAME, "grievanceChannel.deleteConfirmMessage", {
              name: edited.name,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {formatMessage(intl, MODULE_NAME, "cancel")}
          </Button>
          <Button color="secondary" onClick={handleDeleteConfirm}>
            {formatMessage(intl, MODULE_NAME, "grievanceChannel.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  channelId: props.match.params.channel_id,
  grievanceChannel: state.grievanceSocialProtection.grievanceChannel,
  fetchingGrievanceChannel: state.grievanceSocialProtection.fetchingGrievanceChannel,
  errorGrievanceChannel: state.grievanceSocialProtection.errorGrievanceChannel,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchGrievanceChannel,
  createGrievanceChannel,
  updateGrievanceChannel,
  deleteGrievanceChannel,
  journalize,
}, dispatch);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(
      injectIntl(withTheme(withStyles(styles)(GrievanceChannelFormPage))),
    ),
  ),
);
