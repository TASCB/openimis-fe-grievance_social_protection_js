/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { TICKET_STATUS } from "../constants";

// eslint-disable-next-line react/prefer-stateless-function
class TicketStatusPicker extends Component {
  render() {
    const {
      readOnly = false,
      statuses = TICKET_STATUS,
      withNull = false,
      value,
      onChange,
      ...pickerProps
    } = this.props;

    return (
      <ConstantBasedPicker
        module="grievance"
        label="ticket.ticketStatus"
        constants={statuses}
        readOnly={readOnly}
        value={value}
        withNull={withNull}
        onChange={(option) => onChange(option, option ? `${option}` : null)}
        {...pickerProps}
      />
    );
  }
}

export default TicketStatusPicker;
