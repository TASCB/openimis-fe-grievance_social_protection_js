import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { FormattedMessage, TextInput } from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';
import TicketLocationFields from './TicketLocationFields';
import { externalReporterLocationFieldNames } from '../utils/externalReporter';

export default function ExternalReporterFields({
  value,
  onChange,
  readOnly = false,
  errors = [],
}) {
  const updateAttribute = (field, fieldValue) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateLocation = (location) => {
    onChange({ ...value, ...location });
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle2">
          <FormattedMessage module={MODULE_NAME} id="ticket.externalReporter.title" />
        </Typography>
      </Grid>
      {errors.length > 0 && (
        <Grid item xs={12}>
          <Alert severity="error">
            {errors.map((errorId) => (
              <Typography key={errorId} variant="caption" display="block">
                <FormattedMessage module={MODULE_NAME} id={errorId} />
              </Typography>
            ))}
          </Alert>
        </Grid>
      )}
      <Grid item xs={12} sm={6} md={3}>
        <TextInput
          module={MODULE_NAME}
          label="ticket.externalReporter.firstName"
          value={value.externalReporterFirstName || ''}
          onChange={(v) => updateAttribute('externalReporterFirstName', v)}
          required
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextInput
          module={MODULE_NAME}
          label="ticket.externalReporter.lastName"
          value={value.externalReporterLastName || ''}
          onChange={(v) => updateAttribute('externalReporterLastName', v)}
          required
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextInput
          module={MODULE_NAME}
          label="ticket.externalReporter.phone"
          value={value.externalReporterPhone || ''}
          onChange={(v) => updateAttribute('externalReporterPhone', v)}
          required
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextInput
          module={MODULE_NAME}
          label="ticket.externalReporter.emailOptional"
          value={value.externalReporterEmail || ''}
          onChange={(v) => updateAttribute('externalReporterEmail', v)}
          required={false}
          readOnly={readOnly}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2">
          <FormattedMessage module={MODULE_NAME} id="ticket.externalReporter.locationTitle" />
        </Typography>
      </Grid>
      <TicketLocationFields
        value={value}
        onChange={updateLocation}
        readOnly={readOnly}
        required
        fieldNames={externalReporterLocationFieldNames}
      />
    </>
  );
}
