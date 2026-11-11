import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery, useTranslations } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const MIN_SEARCH = 3;

const GRAPHQL_QUERY = `
  query GrievanceLegacyHouseholdComplainants($search: String) {
    grievanceLegacyHouseholdComplainants(search: $search) {
      id hhid head representative village district members phone pmtScore programme
    }
  }
`;

export const legacyHouseholdLabel = (household) => {
  if (!household) return "";
  const name = household.representative || household.head;
  return [household.hhid, name, household.village].filter(Boolean).join(" — ");
};

export default function LegacyHouseholdComplainantPicker({
  label, value = null, onChange, readOnly = false, required = false,
}) {
  const [search, setSearch] = useState("");
  const { formatMessage } = useTranslations(MODULE_NAME);
  const term = (search || "").trim();
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { search: term },
    { skip: term.length < MIN_SEARCH, keepStale: false },
  );

  return (
    <Autocomplete
      multiple={false}
      required={required}
      error={error}
      label={label}
      placeholder={formatMessage("ticket.legacyHousehold.placeholder")}
      withLabel
      withPlaceholder
      readOnly={readOnly}
      options={term.length < MIN_SEARCH ? [] : data?.grievanceLegacyHouseholdComplainants ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={legacyHouseholdLabel}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      noOptionsText={formatMessage(
        term.length < MIN_SEARCH ? "ticket.legacyHousehold.typeMore" : "ticket.legacyHousehold.noneFound",
      )}
      filterOptions={(options) => options}
      onInputChange={setSearch}
      onChange={(option) => onChange(option ?? null)}
    />
  );
}
