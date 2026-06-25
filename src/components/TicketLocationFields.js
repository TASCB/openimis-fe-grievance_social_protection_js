import React from "react";
import { Grid } from "@material-ui/core";
import { injectIntl } from "react-intl";
import { formatMessage } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";
import GrievanceLocationPicker from "../pickers/GrievanceLocationPicker";

const LEVELS = [
  { role: "region", key: "region", label: "ticket.location.region", type: "R" },
  { role: "district", key: "district", label: "ticket.location.district", type: "D" },
  { role: "ward", key: "ward", label: "ticket.location.ward", type: "W" },
  { role: "village", key: "village", label: "ticket.location.village", type: "V" },
];

const locationIndex = (location) => (
  location ? LEVELS.findIndex(({ type }) => type === location.type) : -1
);

const TicketLocationFields = ({
  value = {},
  onChange,
  readOnly = false,
  scope = null,
  intl,
  required = false,
  fieldNames = {},
}) => {
  const assignedLevel = locationIndex(scope?.assignedLocation);
  const fields = {
    region: "region",
    district: "district",
    ward: "ward",
    village: "village",
    eventLocation: "eventLocation",
    ...fieldNames,
  };
  const levels = LEVELS.map((level) => ({
    ...level,
    key: fields[level.role],
  }));

  const updateLocation = (index, location) => {
    const next = { ...value };
    levels.forEach(({ key }, levelIndex) => {
      if (levelIndex === index) next[key] = location;
      if (levelIndex > index) next[key] = null;
    });
    next[fields.eventLocation] = [...levels]
      .reverse()
      .map(({ key }) => next[key])
      .find(Boolean) ?? null;
    onChange(next);
  };

  return (
    <>
      {levels.map(({ key, label, type }, index) => {
        const parentLocation = index > 0 ? value[levels[index - 1].key] ?? null : null;
        const parentMissing = index > 0 && !parentLocation;
        return (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <GrievanceLocationPicker
              value={value[key] ?? null}
              parentLocation={parentLocation}
              locationType={type}
              label={formatMessage(intl, MODULE_NAME, label)}
              required={required}
              readOnly={readOnly || parentMissing || (assignedLevel >= 0 && index <= assignedLevel)}
              onChange={(location) => updateLocation(index, location)}
            />
          </Grid>
        );
      })}
    </>
  );
};

export default injectIntl(TicketLocationFields);
