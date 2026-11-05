import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery, useTranslations } from "@openimis/fe-core";

const GRAPHQL_QUERY = `
  query GrievanceHouseholdComplainants($benefitPlanId: String!, $search: String) {
    grievanceHouseholdComplainants(benefitPlanId: $benefitPlanId, search: $search) {
      id
      hhid
      representative
      head
    }
  }
`;

export const householdLabel = (household) => {
  if (!household) return "";
  const name = household.representative || household.head;
  return [household.hhid, name].filter(Boolean).join(" — ");
};

export default function HouseholdComplainantPicker({
  label,
  benefitPlan,
  value = null,
  onChange,
  readOnly = false,
  required = false,
}) {
  const [search, setSearch] = useState("");
  const { formatMessage } = useTranslations("ticket");
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { benefitPlanId: benefitPlan?.id, search: search || null },
    { skip: !benefitPlan?.id, keepStale: false },
  );

  return (
    <Autocomplete
      multiple={false}
      required={required}
      error={error}
      label={label}
      placeholder={formatMessage("HouseholdComplainantPicker.placeholder")}
      withLabel
      withPlaceholder
      readOnly={readOnly}
      options={data?.grievanceHouseholdComplainants ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={householdLabel}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      filterOptions={(options) => options}
      onInputChange={setSearch}
      onChange={(option) => onChange(option ?? null)}
    />
  );
}
