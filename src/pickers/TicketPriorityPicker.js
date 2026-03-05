/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { TICKET_PRIORITY } from "../constants";

// eslint-disable-next-line react/prefer-stateless-function
class TicketPriorityPicker extends Component {
  render() {
    const { readOnly = false } = this.props;

    return (
      <ConstantBasedPicker
        module="grievance"
        label="Ticket Priority"
        constants={TICKET_PRIORITY}
        readOnly={readOnly}
        {...this.props}
      />
    );
  }
}

export default TicketPriorityPicker;
