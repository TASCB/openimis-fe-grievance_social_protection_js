/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component, useRef } from 'react';
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';
import PrintIcon from '@material-ui/icons/Print';
import Alert from '@material-ui/lab/Alert';
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
import {
  EMPTY_STRING,
  MODULE_NAME,
  RIGHT_TICKET_EDIT,
  RIGHT_TICKET_RESOLVE,
  TICKET_STATUS,
  TICKET_STATUSES,
} from '../constants';
import TicketPrintTemplate from '../components/TicketPrintTemplate';
import GrievantTypePicker from '../pickers/GrievantTypePicker';
import ExternalReporterFields from '../components/ExternalReporterFields';
import {
  clearExternalReporterFields,
  externalReporterValidationErrorIds,
  getReporterType,
  isExternalReporterType,
  parseSerializedReporter,
} from '../utils/externalReporter';

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
  descriptionHelperAlert: {
    marginTop: theme.spacing(1),
  },
});

const PAYMENT_WINDOW_LABELS = {
  JAN_FEB: 'Jan - Feb',
  MAR_APR: 'Mar - Apr',
  MAY_JUN: 'May - Jun',
  JUL_AUG: 'Jul - Aug',
  SEP_OCT: 'Sep - Oct',
  NOV_DEC: 'Nov - Dec',
};

class EditTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stateEdited: props.ticket,
      comments: props.comments,
      reporter: {},
      benefitPlan: null,
      grievanceConfig: {},
      validationErrors: [],
      closingDialogOpen: false,
      closingComment: EMPTY_STRING,
    };
  }

  componentDidMount() {
    if (this.props.edited_id) {
      this.setState({ grievanceConfig: this.props.grievanceConfig });
      this.setState({ stateEdited: this.props.ticket });
      if (this.props.ticket.reporter) {
        this.setState({ reporter: parseSerializedReporter(this.props.ticket.reporter) ?? {} });
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

  hasRight = (right) => (this.props.rights || []).includes(right);

  canEditTicket = () => this.hasRight(RIGHT_TICKET_EDIT);

  canResolveTicket = () => this.hasRight(RIGHT_TICKET_RESOLVE);

  canCloseTicket = () => (
    this.canEditTicket() && this.canResolveTicket()
  );

  availableStatuses = () => (
    this.canResolveTicket()
      ? TICKET_STATUS
      : TICKET_STATUS.filter(
        (status) => ![
          TICKET_STATUSES.RESOLVED,
          TICKET_STATUSES.CLOSED,
        ].includes(status),
      )
  );

  persistTicket = () => {
    this.props.updateTicket(
      this.state.stateEdited,
      `updated ticket ${this.state.stateEdited.code}`,
    );
  };

  save = () => {
    const validationErrors = isExternalReporterType(getReporterType(this.state.stateEdited))
      ? externalReporterValidationErrorIds(this.state.stateEdited)
      : [];
    if (validationErrors.length > 0) {
      this.setState({ validationErrors });
      return;
    }
    if (this.isClosingTransition()) {
      if (!this.canCloseTicket()) return;
      this.setState({ closingDialogOpen: true, closingComment: EMPTY_STRING });
      return;
    }
    this.persistTicket();
  };

  confirmClose = () => {
    const { user } = this.props;
    const { stateEdited, closingComment } = this.state;
    if (!this.canCloseTicket()) return;
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
      validationErrors: [],
      stateEdited: { ...state.stateEdited, [k]: v },
    }));
  };

  updateTypeOfGrievant = (field, value) => {
    this.setState((state) => {
      const reporterType = value || null;
      const nextTicket = {
        ...state.stateEdited,
        reporter: null,
        reporterId: null,
        reporterType,
        reporterTypeName: reporterType,
      };
      return {
        validationErrors: [],
        benefitPlan: null,
        reporter: {},
        stateEdited: isExternalReporterType(reporterType)
          ? nextTicket
          : clearExternalReporterFields(nextTicket),
      };
    });
  };

  updateBenefitPlan = (field, value) => {
    this.updateAttribute('reporter', null);
    this.setState({ benefitPlan: value });
  };

  updateExternalReporter = (ticket) => {
    this.setState({
      validationErrors: [],
      stateEdited: ticket,
    });
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

  getTicketJsonExt = () => {
    const jsonExt = this.state.stateEdited?.jsonExt;
    if (!jsonExt) return {};
    if (typeof jsonExt === 'string') {
      try {
        return JSON.parse(jsonExt);
      } catch (e) {
        return {};
      }
    }
    return jsonExt;
  };

  getPaymentWindowLabel = () => {
    const paymentWindow = this.getTicketJsonExt().paymentWindow;
    return PAYMENT_WINDOW_LABELS[paymentWindow] || paymentWindow || EMPTY_STRING;
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
      stateEdited, reporter, comments, benefitPlan, validationErrors,
    } = this.state;
    const reporterType = getReporterType(stateEdited);
    const reporterPickerValue = typeof stateEdited.reporter === 'string'
      ? reporter
      : stateEdited.reporter || reporter;
    const ticketJsonExt = this.getTicketJsonExt();
    const paymentWindowLabel = this.getPaymentWindowLabel();
    return (
      <div className={classes.page}>
        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titleone} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Grid container className={classes.item}>
                <Grid item xs={12} sm={6} md={3} className={classes.item}>
                  <GrievantTypePicker
                    module={MODULE_NAME}
                    label="type"
                    readOnly={propsReadOnly}
                    withNull
                    value={(reporterType ?? '').toString().replace(/\s+/g, '')}
                    onChange={(v) => this.updateTypeOfGrievant('grievantType', v)}
                    withLabel
                  />
                </Grid>
                {reporterType === 'individual' && (
                <>
                  {!propsReadOnly && (
                  <Grid item xs={12} sm={6} md={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="socialProtection.BenefitPlanPicker"
                      withNull
                      label="socialProtection.benefitPlan"
                      value={benefitPlan}
                      onChange={(v) => this.updateBenefitPlan('benefitPlan', v)}
                      readOnly={propsReadOnly}
                    />
                  </Grid>
                  )}
                  <Grid item xs={12} sm={6} md={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="individual.IndividualPicker"
                      value={reporterPickerValue}
                      onChange={(v) => this.updateAttribute('reporter', v)}
                      label="Complainant"
                      benefitPlan={benefitPlan}
                      readOnly={propsReadOnly}
                    />
                  </Grid>
                </>
                )}
                {reporterType === 'beneficiary' && (
                <>
                  {!propsReadOnly && (
                  <Grid item xs={12} sm={6} md={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="socialProtection.BenefitPlanPicker"
                      withNull
                      label="socialProtection.benefitPlan"
                      value={benefitPlan}
                      onChange={(v) => this.updateBenefitPlan('benefitPlan', v)}
                      readOnly={propsReadOnly}
                    />
                  </Grid>
                  )}
                  {(benefitPlan || propsReadOnly) && (
                  <Grid item xs={12} sm={6} md={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="socialProtection.BeneficiaryPicker"
                      onChange={(v) => this.updateAttribute('reporter', v)}
                      readOnly={propsReadOnly}
                      value={propsReadOnly ? {
                        individual: {
                          firstName: stateEdited.reporterFirstName,
                          lastName: stateEdited.reporterLastName,
                          dob: stateEdited.reporterDob,
                        },
                      } : stateEdited.reporter}
                      benefitPlan={benefitPlan}
                      module={MODULE_NAME}
                    />
                  </Grid>
                  )}
                </>
                )}
                {reporterType === 'user' && (
                <Grid item xs={12} sm={6} md={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={reporterPickerValue}
                    module="core"
                    onChange={(v) => this.updateAttribute('reporter', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                )}
                {isExternalReporterType(reporterType) && (
                <ExternalReporterFields
                  value={stateEdited}
                  onChange={this.updateExternalReporter}
                  readOnly={propsReadOnly}
                  errors={validationErrors}
                />
                )}
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                {reporterType === 'individual' && (
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
                {reporterType === 'beneficiary' && propsReadOnly && (
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
              </Grid>
            </Paper>
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
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketTypePicker"
                    label="ticket.title"
                    value={stateEdited.title}
                    onChange={(v) => this.updateAttribute('title', v)}
                    required
                    withNull
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
                    maxDate={new Date()}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketStatusPicker"
                    value={stateEdited.status}
                    onChange={(v) => this.updateAttribute('status', v)}
                    required={false}
                    readOnly={propsReadOnly}
                    statuses={this.availableStatuses()}
                  />
                </Grid>
                {!!paymentWindowLabel && (
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    module={MODULE_NAME}
                    label="ticket.paymentWindow"
                    value={paymentWindowLabel}
                    onChange={() => null}
                    required={false}
                    readOnly
                  />
                </Grid>
                )}
                {!!ticketJsonExt.paymentYear && (
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    module={MODULE_NAME}
                    label="ticket.paymentYear"
                    value={String(ticketJsonExt.paymentYear)}
                    onChange={() => null}
                    required={false}
                    readOnly
                  />
                </Grid>
                )}
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketPriorityPicker"
                    value={stateEdited.priority}
                    onChange={(v) => this.updateAttribute('priority', v)}
                    required={false}
                    readOnly
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
                    label="Assigned To/Attending Staff"
                    onChange={(v) => this.updateAttribute('attendingStaff', v)}
                    readOnly={propsReadOnly}
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    module={MODULE_NAME}
                    label="ticket.consentGiven"
                    value={stateEdited.consentGiven ? 'Yes' : 'No'}
                    onChange={() => null}
                    required={false}
                    readOnly
                  />
                  <Typography variant="caption" color="textSecondary">
                    <FormattedMessage module={MODULE_NAME} id="ticket.consent.message" />
                  </Typography>
                </Grid>
                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.description"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute('description', v)}
                    required={false}
                    readOnly
                  />
                  <Alert severity="info" className={classes.descriptionHelperAlert}>
                    <FormattedMessage module={MODULE_NAME} id="ticket.description.helperText" />
                  </Alert>
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
                {this.canEditTicket() && (
                  <Grid item xs={1} className={classes.item}>
                    <IconButton
                      data-testid="grievance-save"
                      variant="contained"
                      component="label"
                      color="primary"
                      onClick={this.save}
                      disabled={
                        propsReadOnly
                        || !this.doesTicketChange()
                        || (this.isClosingTransition() && !this.canCloseTicket())
                      }
                    >
                      <Save />
                    </IconButton>
                  </Grid>
                )}
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
  rights: state.core?.user?.i_user?.rights ?? [],
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
