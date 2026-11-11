import React from "react";
import { Grid } from "@material-ui/core";
import { TextInput } from "@openimis/fe-core";
import { EMPTY_STRING, MODULE_NAME } from "../constants";

const FIELDS = [
  ["hhid", "ticket.household.hhid"],
  ["head", "ticket.household.head"],
  ["representative", "ticket.household.representative"],
  ["programme", "ticket.legacyHousehold.programme"],
  ["district", "ticket.legacyHousehold.district"],
  ["village", "ticket.legacyHousehold.village"],
  ["members", "ticket.legacyHousehold.members"],
  ["phone", "ticket.legacyHousehold.phone"],
];

export default function LegacyHouseholdComplainantFields({ household, className }) {
  return FIELDS.map(([field, label]) => (
    <Grid item xs={3} className={className} key={field}>
      <TextInput
        module={MODULE_NAME}
        label={label}
        value={household?.[field] != null ? String(household[field]) : EMPTY_STRING}
        readOnly
      />
    </Grid>
  ));
}
