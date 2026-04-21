/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';
import PrintIcon from '@material-ui/icons/Print';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';
import {
  formatDateTimeFromISO,
  formatMessage,
  ProgressOrError,
  PublishedComponent,
  Table,
  withHistory,
  withModulesManager,
} from '@openimis/fe-core';
import {
  IconButton, Paper, Tooltip,
} from '@material-ui/core';
import ReplayIcon from '@material-ui/icons/Replay';
import DoneIcon from '@material-ui/icons/Done';
import { createTicketComment, fetchComments, resolveGrievanceByComment } from '../actions';
import GrievanceCommentDialog from '../dialogs/GrievanceCommentDialog';
import { isEmptyObject } from '../utils/utils';
import { MODULE_NAME, TICKET_STATUSES } from '../constants';
import TicketPrintCommentTemplate from './TicketPrintCommentTemplate';

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.table.item,
  fullHeight: {
    height: '100%',
  },
});

class TicketCommentPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      pageSize: 5,
      comment: {},
      commenterType: null,
    };
    this.rowsPerPageOptions = props.modulesManager.getConf(
      'fe-grievance_social_protection',
      'ticketFilter.rowsPerPageOptions',
      [10, 20, 50, 100],
    );
    this.defaultPageSize = props.modulesManager.getConf(
      'fe-grievance_social_protection',
      'ticketFilter.defaultPageSize',
      10,
    );
  }

  query = () => {
    if (this.props.edited) {
      this.props.fetchComments(this.props.edited);
    }
  };

  onChangeRowsPerPage = (cnt) => {
    this.setState(
      {
        pageSize: cnt,
        page: 0,
      },
      () => this.query(),
    );
  };

  componentDidMount() {
    this.setState({ }, () => this.onChangeRowsPerPage(this.defaultPageSize));
    if (!this.isReadOnly()) {
      this.interval = setInterval(this.reload, 5000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  ticketChanged = (prevProps) => {
    const prevTicketExists = !!prevProps.ticket;
    const currentTicketExists = !!this.props.ticket;

    const ticketChanged = (!prevTicketExists && currentTicketExists) // New ticket appeared
        || (prevTicketExists
            && currentTicketExists
            && prevProps.ticket.uuid !== this.props.ticket.uuid); // Ticket UUID changed

    return ticketChanged;
  };

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.ticketChanged(prevProps)) {
      this.query();
    }
  }

  onChangePage = (page, nbr) => {
    this.setState((prevState) => {
      if (nbr > prevState.page) {
        return { page: prevState.page + 1 };
      } if (nbr < prevState.page) {
        return { page: prevState.page - 1 };
      }
      // If nbr === prevState.page, return null to indicate no state update
      return null;
    }, () => {
      this.query();
    });
  };

  reload = () => {
    this.props.fetchComments(this.props.edited);
  };

  updateCommenterType = (field, value) => {
    this.updateCommentAttribute('commenter', null);
    this.setState((state) => ({
      commenterType: value,
    }));
  };

  updateCommentAttribute = (k, v) => {
    this.setState((state) => ({
      comment: { ...state.comment, [k]: v },
    }));
  };

  handleOpenModal = () => {
    this.setState((prevState) => ({
      ...prevState,
      openCommentModal: !prevState.openCommentModal,
    }));
  };

  handleComment = (e) => {
    e.preventDefault();
    if (this.state.comment) {
      this.props.createTicketComment(
        this.state.comment,
        this.props.edited,
        this.state.commenterType,
        'Added Ticket Comment',
      );
    }
    this.setState((prev) => ({
      ...prev,
      openCommentModal: false,
      comment: {},
      commenterType: null,
    }));
  };

  resolveGrievanceByComment = (comment) => {
    this.props.resolveGrievanceByComment(
      comment.id,
      formatMessage(this.props.intl, MODULE_NAME, 'resolveGrievanceByComment.mutation.label'),
    );
  };

  isReadOnly = () => this.props?.ticket?.status === TICKET_STATUSES.CLOSED || this.props?.ticket?.isHistory;

  getTicketCommentIds = () => {
    const jsonExt = this.props.ticket?.jsonExt;
    if (!jsonExt) return null;
    if (typeof jsonExt === 'string') {
      try {
        return JSON.parse(jsonExt)?.comment_ids ?? null;
      } catch (e) {
        return null;
      }
    }
    return jsonExt.comment_ids ?? null;
  };

  filterComments = (comments) => {
    if (!comments) return comments;
    if (!this.props.ticket?.isHistory) return comments;
    const commentIds = this.getTicketCommentIds();
    if (!commentIds) return [];
    return comments.filter((comment) => commentIds.includes(comment.id));
  };

  render() {
    const {
      intl, classes,
      errorTicketComments, ticketComments,
    } = this.props;

    const headers = [
      'ticket.commenter',
      'ticket.comment',
      'ticket.dateCreated',
      'ticket.markAsResolved',
    ];

    const shouldHighlight = (row) => row?.isResolution;

    const itemFormatters = [
      (comment) => {
        const commenter = typeof comment.commenter === 'object'
          ? comment.commenter : JSON.parse(JSON.parse(comment.commenter || '{}') || '{}');
        let picker = '';
        if (comment.commenterTypeName === 'individual') {
          picker = (
            <PublishedComponent
              pubRef="individual.IndividualPicker"
              readOnly
              withNull
              label="ticket.commenter"
              required
              value={
                commenter !== undefined
                && commenter !== null ? (isEmptyObject(commenter)
                    ? null : commenter) : null
              }
            />
          );
        }
        if (comment.commenterTypeName === 'user') {
          picker = (
            <PublishedComponent
              pubRef="admin.UserPicker"
              readOnly
              value={
                commenter !== undefined
                && commenter !== null ? (isEmptyObject(commenter)
                    ? null : commenter) : null
              }
              module={MODULE_NAME}
              label={formatMessage(this.props.intl, MODULE_NAME, 'ticket.commenter')}
            />
          );
        }
        if (comment.commenterTypeName === 'beneficiary') {
          picker = (
            <PublishedComponent
              pubRef="socialProtection.BeneficiaryPicker"
              readOnly
              value={
                {
                  individual: {
                    firstName: comment.commenterFirstName,
                    lastName: comment.commenterLastName,
                    dob: comment.commenterDob,
                  },
                }
              }
              module={MODULE_NAME}
              label={formatMessage(this.props.intl, MODULE_NAME, 'ticket.commenter')}
            />
          );
        }
        if (comment.commenterTypeName === null) {
          picker = 'Anonymous User';
        }
        return picker;
      },
      (comment) => comment.comment,
      (comment) => formatDateTimeFromISO(this.props.modulesManager, intl, comment.dateCreated),
      (comment) => (
        <Tooltip title={formatMessage(this.props.intl, MODULE_NAME, 'resolveButtonTooltip')}>
          <IconButton
            onClick={() => { this.resolveGrievanceByComment(comment); }}
            disabled={this.isReadOnly()}
            style={comment.isResolution ? { color: 'green' } : null}
          >
            <DoneIcon />
          </IconButton>
        </Tooltip>
      ),

    ];

    const { comment, commenterType } = this.state;

    return (
      <div className={classes.page}>

        <ProgressOrError error={errorTicketComments} />

        <Paper className={classes.paper}>
          <div style={{ textAlign: 'end', background: '#b7d4d8', height: '2.5em' }}>
            <IconButton variant="contained" component="label" onClick={this.reload} disabled={this.isReadOnly()}>
              <ReplayIcon />
            </IconButton>
            <GrievanceCommentDialog
              handleComment={this.handleComment}
              openCommentModal={this.state.openCommentModal}
              handleOpenModal={this.handleOpenModal}
              updateCommentAttribute={this.updateCommentAttribute}
              comment={comment}
              updateCommenterType={this.updateCommenterType}
              commenterType={commenterType}
              disabled={this.isReadOnly()}
            />
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
          </div>
          <Table
            module={MODULE_NAME}
            fetch={this.props.fetchComments}
            header={formatMessage(this.props.intl, MODULE_NAME, 'TicketCommentsPanel.table.header')}
            headers={headers}
            itemFormatters={itemFormatters}
            items={this.isReadOnly() ? this.filterComments(ticketComments) : ticketComments}
            withPagination
            page={this.state.page}
            pageSize={this.state.pageSize}
            onChangePage={this.onChangePage}
            onChangeRowsPerPage={this.onChangeRowsPerPage}
            rowSecondaryHighlighted={shouldHighlight}
            rowsPerPageOptions={this.rowsPerPageOptions}
            defaultPageSize={this.defaultPageSize}
            rights={this.rights}
            defaultOrderBy="-dateCreated"
          />
        </Paper>
        <div style={{ display: 'none' }}>
          <TicketPrintCommentTemplate
            ref={(el) => (this.componentRef = el)}
            ticketComments={ticketComments}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  fetchingTicketComments: state.grievanceSocialProtection.fetchingTicketComments,
  errorTicketComments: state.grievanceSocialProtection.errorTicketComments,
  fetchedTicketComments: state.grievanceSocialProtection.fetchedTicketComments,
  ticketComments: state.grievanceSocialProtection.ticketComments,
  ticket: state.grievanceSocialProtection.ticket,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchComments, createTicketComment, resolveGrievanceByComment,
}, dispatch);

export default withHistory(withModulesManager(connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withTheme(withStyles(styles)(TicketCommentPanel))),
)));
