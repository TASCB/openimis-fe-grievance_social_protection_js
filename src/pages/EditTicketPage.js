/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component, useRef } from 'react';
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';
import PrintIcon from '@material-ui/icons/Print';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import {
  journalize,
  TextInput,
  PublishedComponent,
  FormattedMessage,
} from '@openimis/fe-core';
import _ from 'lodash';
import { Save } from '@material-ui/icons';
import { closeTicket, updateTicket, fetchTicket } from '../actions';
import { EMPTY_STRING, MODULE_NAME, TICKET_STATUSES } from '../constants';
import TicketPrintTemplate from '../components/TicketPrintTemplate';

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class EditTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stateEdited: props.ticket,
      comments: props.comments,
      reporter: {},
      grievanceConfig: {},
      closingDialogOpen: false,
      closingComment: EMPTY_STRING,
    };
  }

  componentDidMount() {
    if (this.props.edited_id) {
      this.setState({ grievanceConfig: this.props.grievanceConfig });
      this.setState({ stateEdited: this.props.ticket });
      if (this.props.ticket.reporter) {
        this.setState({ reporter: JSON.parse(JSON.parse(this.props.ticket.reporter || '{}'), '{}') });
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevPops, prevState, snapshort) {
    if (prevPops.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
    }
  }

  isClosingTransition = () => {
    const { ticket } = this.props;
    const { stateEdited } = this.state;
    return (
      stateEdited?.status === TICKET_STATUSES.CLOSED
      && ticket?.status !== TICKET_STATUSES.CLOSED
    );
  };

  persistTicket = () => {
    this.props.updateTicket(
      this.state.stateEdited,
      `updated ticket ${this.state.stateEdited.code}`,
    );
  };

  save = () => {
    if (this.isClosingTransition()) {
      this.setState({ closingDialogOpen: true, closingComment: EMPTY_STRING });
      return;
    }
    this.persistTicket();
  };

  confirmClose = () => {
    const { user } = this.props;
    const { stateEdited, closingComment } = this.state;
    if (!closingComment || !closingComment.trim()) return;

    this.props.closeTicket(
      stateEdited,
      closingComment.trim(),
      user,
      'user',
      `Closed ticket ${stateEdited.code}`,
    );
    this.setState({ closingDialogOpen: false, closingComment: EMPTY_STRING });
  };

  cancelClose = () => {
    this.setState({ closingDialogOpen: false, closingComment: EMPTY_STRING });
  };

  updateAttribute = (k, v) => {
    this.setState((state) => ({
      stateEdited: { ...state.stateEdited, [k]: v },
    }));
  };

  extractFieldFromJsonExt = (reporter, field) => {
    if (reporter) {
      if (reporter.jsonExt) {
        return reporter.jsonExt[field] || '';
      }
      return '';
    }
    return '';
  };

  doesTicketChange = () => {
    const { ticket } = this.props;
    const { stateEdited } = this.state;
    return !_.isEqual(ticket, stateEdited);
  };

  render() {
    const {
      classes,
      titleone = ' Ticket.ComplainantInformation',
      titletwo = ' Ticket.DescriptionOfEvents',
      titlethree = ' Ticket.Resolution',
      titleParams = { label: EMPTY_STRING },
      grievanceConfig,
    } = this.props;

    const propsReadOnly = this.props.readOnly;

    const {
      stateEdited, reporter, comments,
    } = this.state;
    return (
      <div className={classes.page}>
        <Grid container>
          <Grid item xs={12}>
            {stateEdited.reporter && (
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titleone} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Grid container className={classes.item}>
                {stateEdited.reporterTypeName === 'individual' && (
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="individual.IndividualPicker"
                    value={reporter}
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    label="Complainant"
                    readOnly
                  />
                </Grid>
                )}
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                {stateEdited.reporterTypeName === 'individual' && (
                <>
                  <Grid item xs={4} className={classes.item}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.name"
                      value={reporter && reporter.individual
                        ? `${reporter.individual.firstName} ${reporter.individual.lastName} ${reporter.individual.dob}`
                        : reporter
                          ? `${reporter.firstName} ${reporter.lastName} ${reporter.dob}`
                          : EMPTY_STRING}
                      onChange={(v) => this.updateAttribute('name', v)}
                      required={false}
                      readOnly
                    />
                  </Grid>
                  <Grid item xs={4} className={classes.item}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.phone"
                      value={!!stateEdited && !!stateEdited.reporter
                        ? this.extractFieldFromJsonExt(reporter, 'phone')
                        : EMPTY_STRING}
                      onChange={(v) => this.updateAttribute('phone', v)}
                      required={false}
                      readOnly
                    />
                  </Grid>
                  <Grid item xs={4} className={classes.item}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.email"
                      value={!!stateEdited && !!stateEdited.reporter
                        ? this.extractFieldFromJsonExt(reporter, 'email')
                        : EMPTY_STRING}
                      onChange={(v) => this.updateAttribute('email', v)}
                      required={false}
                      readOnly
                    />
                  </Grid>
                </>
                )}
                {stateEdited.reporterTypeName === 'beneficiary' && (
                <PublishedComponent
                  pubRef="socialProtection.BeneficiaryPicker"
                  onChange={(v) => this.updateAttribute('reporter', v)}
                  readOnly
                  value={
                    {
                      individual: {
                        firstName: stateEdited.reporterFirstName,
                        lastName: stateEdited.reporterLastName,
                        dob: stateEdited.reporterDob,
                      },
                    }
                  }
                  module={MODULE_NAME}
                />
                )}
                {stateEdited.reporterTypeName === 'user' && (
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={reporter}
                    module="core"
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    readOnly
                  />
                </Grid>
                )}
              </Grid>
            </Paper>
            )}
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle} alignItems="center">
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage
                      module={MODULE_NAME}
                      id={titletwo}
                      values={titleParams}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ textAlign: 'right' }}>
                  <ReactToPrint content={() => this.componentRef}>
                    <PrintContextConsumer>
                      {({ handlePrint }) => (
                        <IconButton
                          variant="contained"
                          component="label"
                          onClick={handlePrint}
                        >
                          <PrintIcon />
                        </IconButton>
                      )}
                    </PrintContextConsumer>
                  </ReactToPrint>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.DropDownCategoryPicker"
                    value={stateEdited.category}
                    onChange={(v) => this.updateAttribute('category', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    label="ticket.title"
                    value={stateEdited.title}
                    onChange={(v) => this.updateAttribute('title', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    label="ticket.dateOfIncident"
                    value={stateEdited.dateOfIncident}
                    required={false}
                    onChange={(v) => this.updateAttribute('dateOfIncident', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketStatusPicker"
                    value={stateEdited.status}
                    onChange={(v) => this.updateAttribute('status', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketPriorityPicker"
                    value={stateEdited.priority}
                    onChange={(v) => this.updateAttribute('priority', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.ChannelPicker"
                    value={stateEdited.channel}
                    onChange={(v) => this.updateAttribute('channel', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={stateEdited.attendingStaff}
                    module="core"
                    onChange={(v) => this.updateAttribute('attendingStaff', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.FlagPicker"
                    value={stateEdited.flags}
                    onChange={(v) => this.updateAttribute('flags', v)}
                    required
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.description"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute('description', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={12} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage
                      module={MODULE_NAME}
                      id={titlethree}
                      values={titleParams}
                    />
                  </Typography>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                <Grid item xs={4} className={classes.item}>
                  <TextInput
                    label="ticket.resolution"
                    value={stateEdited.resolution}
                    onChange={(v) => this.updateAttribute('resolution', v)}
                    required={false}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={11} className={classes.item} />
                <Grid item xs={1} className={classes.item}>
                  <IconButton
                    variant="contained"
                    component="label"
                    color="primary"
                    onClick={this.save}
                    disabled={propsReadOnly || !this.doesTicketChange()}
                  >
                    <Save />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        <div style={{ display: 'none' }}>
          <TicketPrintTemplate
            ref={(el) => (this.componentRef = el)}
            ticket={stateEdited}
            reporter={reporter}
            comments={comments}
          />
        </div>

        <Dialog
          open={this.state.closingDialogOpen}
          onClose={this.cancelClose}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <FormattedMessage module={MODULE_NAME} id="ticket.closing.dialog.title" />
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" style={{ marginBottom: 12 }}>
              <FormattedMessage module={MODULE_NAME} id="ticket.closing.dialog.prompt" />
            </Typography>
            <TextInput
              module={MODULE_NAME}
              label="ticket.closing.dialog.comment"
              value={this.state.closingComment}
              onChange={(v) => this.setState({ closingComment: v })}
              required
              multiline
              rows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.cancelClose}>
              <FormattedMessage module={MODULE_NAME} id="ticket.closing.dialog.cancel" />
            </Button>
            <Button
              onClick={this.confirmClose}
              color="primary"
              variant="contained"
              disabled={!this.state.closingComment || !this.state.closingComment.trim()}
            >
              <FormattedMessage module={MODULE_NAME} id="ticket.closing.dialog.confirm" />
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

// eslint-disable-next-line no-unused-vars
const mapStateToProps = (state, props) => ({
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  fetchingTicket: state.grievanceSocialProtection.fetchingTicket,
  errorTicket: state.grievanceSocialProtection.errorTicket,
  fetchedTicket: state.grievanceSocialProtection.fetchedTicket,
  ticket: state.grievanceSocialProtection.ticket,
  grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
  comments: state.grievanceSocialProtection.ticketComments,
  user: state.core?.user ?? null,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    fetchTicket, updateTicket, closeTicket, journalize,
  },
  dispatch,
);

export default withTheme(
  withStyles(styles)(
    connect(mapStateToProps, mapDispatchToProps)(EditTicketPage),
  ),
);
