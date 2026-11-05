import React from "react";
import { Grid } from "@material-ui/core";
import { TextInput } from "@openimis/fe-core";
import { EMPTY_STRING, MODULE_NAME } from "../constants";

const FIELDS = [
  ["hhid", "ticket.household.hhid"],
  ["representative", "ticket.household.representative"],
  ["head", "ticket.household.head"],
];

export default function HouseholdComplainantFields({ household, className }) {
  return FIELDS.map(([field, label]) => (
    <Grid item xs={4} className={className} key={field}>
      <TextInput
        module={MODULE_NAME}
        label={label}
        value={household?.[field] || EMPTY_STRING}
        readOnly
      />
    </Grid>
  ));
}
