import React from "react";
import { Grid } from "@material-ui/core";
import { injectIntl } from "react-intl";
import { formatMessage } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";
import GrievanceLocationPicker from "../pickers/GrievanceLocationPicker";

const LEVELS = [
  { key: "region", level: 0, label: "ticket.location.region", type: "R" },
  { key: "district", level: 1, label: "ticket.location.district", type: "D" },
  { key: "ward", level: 2, label: "ticket.location.ward", type: "W" },
  { key: "village", level: 3, label: "ticket.location.village", type: "V" },
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
}) => {
  const assignedLevel = locationIndex(scope?.assignedLocation);

  const updateLocation = (index, location) => {
    const next = { ...value };
    LEVELS.forEach(({ key }, levelIndex) => {
      if (levelIndex === index) next[key] = location;
      if (levelIndex > index) next[key] = null;
    });
    next.eventLocation = [...LEVELS]
      .reverse()
      .map(({ key }) => next[key])
      .find(Boolean) ?? null;
    onChange(next);
  };

  return (
    <>
      {LEVELS.map(({ key, label, type }, index) => (
        <Grid item xs={3} key={key}>
          <GrievanceLocationPicker
            value={value[key] ?? null}
            parentLocation={index > 0 ? value[LEVELS[index - 1].key] ?? null : null}
            locationType={type}
            label={formatMessage(intl, MODULE_NAME, label)}
            readOnly={readOnly || (assignedLevel >= 0 && index <= assignedLevel)}
            onChange={(location) => updateLocation(index, location)}
          />
        </Grid>
      ))}
    </>
  );
};

export default injectIntl(TicketLocationFields);
