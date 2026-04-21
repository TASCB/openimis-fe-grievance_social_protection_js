/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import {
  Form, formatMessageWithValues, journalize, ProgressOrError, withModulesManager, formatMessage,
} from '@openimis/fe-core';
import { bindActionCreators } from 'redux';
import {
  clearTicket,
  fetchComments, fetchGrievanceConfiguration, fetchTicket, reopenTicket,
} from '../actions';
import { ticketLabel } from '../utils/utils';
import EditTicketPage from '../pages/EditTicketPage';
import AddTicketPage from '../pages/AddTicketPage';
import TicketCommentPanel from './TicketCommentsPanel';
import TicketAttachmentsPanel from './TicketAttachmentsPanel';
import { MODULE_NAME, TICKET_STATUSES } from '../constants';

class TicketForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lockNew: false,
      reset: 0,
      ticketUuid: null,
      ticket: this._newTicket(),
    };
  }

  componentDidMount() {
    this.props.fetchGrievanceConfiguration();
    if (this.props.ticketUuid) {
      this.setState((state, props) => ({ ticketUuid: props.ticketUuid }));
    }
  }

  // eslint-disable-next-line react/sort-comp
  componentWillUnmount() {
    this.props.clearTicket();
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.ticket.ticketCode !== this.state.ticket.ticketCode) {
      document.title = formatMessageWithValues(
        this.props.intl,
        MODULE_NAME,
        'ticket.title.bar',
        { label: ticketLabel(this.state.ticket) },
      );
    }
    if (prevProps.fetchedTicket !== this.props.fetchedTicket
            && !!this.props.fetchedTicket
            && !!this.props.ticket) {
      this.setState((state, props) => ({
        ticket: { ...props.ticket },
        ticketUuid: props.ticket.id,
        lockNew: false,
      }));
    } else if (
      prevState.ticketUuid !== this.state.ticketUuid
      && this.state.ticketUuid !== this.props.ticket?.id
    ) {
      const filters = [`id: "${this.state.ticketUuid}"`];
      if (this.props.ticketVersion) filters.push(`ticketVersion: ${this.props.ticketVersion}`);
      this.props.fetchTicket(
        this.props.modulesManager,
        filters,
      );
    } else if (prevProps.ticketUuid && !this.props.ticketUuid) {
      this.setState({ ticket: this._newTicket(), lockNew: false, ticketUuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state) => ({ reset: state.reset + 1 }));
      const createdOrUpdatedTicketId = this.props?.ticket?.id || this.props?.mutation?.id;
      if (createdOrUpdatedTicketId) {
        this.props.fetchTicket(
          this.props.modulesManager,
          [`id: "${createdOrUpdatedTicketId}"`],
        );
      }
    }
  }

  // eslint-disable-next-line react/sort-comp
  _newTicket() {
    return {};
  }

  reload = () => {
    this.props.fetchComments(
      this.state.ticket,
    );
  };

  canSave = () => {
    if (!this.state.ticket.reporter) return false;
    if (!this.state.ticket.category) return false;
    if (!this.state.ticket.title) return false;
    return true;
  };

  _save = (ticket) => {
    this.setState(
      { lockNew: !ticket.uuid },
      () => this.props.save(ticket),
    );
  };

  onEditedChanged = (ticket) => {
    this.setState({ ticket });
  };

  reopenTicket = () => {
    const { intl, ticket } = this.props;
    this.props.reopenTicket(
      ticket.id,
      formatMessage(intl, MODULE_NAME, 'reopenTicket.mutation.label'),
    );
  };

  render() {
    const {
      fetchingTicket,
      fetchedTicket,
      errorTicket,
      save, back,
    } = this.props;

    const {
      lockNew,
      reset,
      update,
      overview,
      ticketUuid,
      ticket,
    } = this.state;

    const readOnly = lockNew || !!ticket.validityTo || this.props.readOnly;
    const actions = [
      {
        doIt: this.reopenTicket,
        icon: <LockOpenIcon />,
        onlyIfDirty: ticket.status !== TICKET_STATUSES.CLOSED,
        disabled: ticket.isHistory,
      },
    ];

    return (
      <>
        <ProgressOrError progress={fetchingTicket} error={errorTicket} />
        {(!!fetchedTicket || !ticketUuid) && (
        <Form
          module={MODULE_NAME}
          edited_id={ticketUuid}
          edited={ticket}
          reset={reset}
          update={update}
          title="ticket.title.bar"
          titleParams={{ label: ticketLabel(this.state.ticket) }}
          back={back}
          save={save ? this._save : null}
          canSave={this.canSave}
          reload={(ticketUuid || readOnly) && this.reload}
          readOnly={readOnly}
          overview={overview}
          Panels={ticketUuid ? [EditTicketPage, TicketAttachmentsPanel, TicketCommentPanel] : [AddTicketPage]}
          onEditedChanged={this.onEditedChanged}
          actions={actions}
        />
        )}
      </>
    );
  }
}

// eslint-disable-next-line no-unused-vars
const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingTicket: state.grievanceSocialProtection.fetchingTicket,
  errorTicket: state.grievanceSocialProtection.errorTicket,
  fetchedTicket: state.grievanceSocialProtection.fetchedTicket,
  ticket: state.grievanceSocialProtection.ticket,
  submittingMutation: state.grievanceSocialProtection.submittingMutation,
  mutation: state.grievanceSocialProtection.mutation,
  grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchTicket,
  fetchComments,
  reopenTicket,
  fetchGrievanceConfiguration,
  clearTicket,
  journalize,
}, dispatch);

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(TicketForm),

));
