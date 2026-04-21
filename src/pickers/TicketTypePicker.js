import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const PAGE_SIZE = 100;

const GRAPHQL_QUERY = `
  query GetGrievanceTypes($first: Int, $categoryId: ID) {
    grievanceTypes(first: $first, isActive: true, categoryId: $categoryId) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

function getOptionLabel(option) {
  if (typeof option === "string") return option;
  return option?.name || "";
}

function getSelectedValue(options, value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  return options.find((option) => option.name === value) ?? { id: value, name: value };
}

export default function TicketTypePicker({
  category,
  onChange,
  value,
  readOnly,
  restrictToCategory = false,
  ...props
}) {
  const [searchString, setSearchString] = useState(null);
  const categoryId = category?.id ?? null;
  const shouldFetch = !restrictToCategory || !!categoryId;
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { first: PAGE_SIZE, categoryId, searchString },
    { skip: !shouldFetch },
  );

  const options = shouldFetch ? data?.grievanceTypes?.edges?.map(({ node }) => node) ?? [] : [];

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required
      error={error}
      placeholder={restrictToCategory && !categoryId ? "Select category first..." : "Select grievance type..."}
      label="Type"
      withLabel
      withPlaceholder
      readOnly={readOnly || (restrictToCategory && !categoryId)}
      options={options}
      isLoading={isLoading}
      value={getSelectedValue(options, value)}
      getOptionLabel={getOptionLabel}
      getOptionSelected={(option, selected) => option?.id === selected?.id || option?.name === selected?.name}
      onChange={(option) => onChange(option?.name ?? null, option ?? null)}
      onInputChange={setSearchString}
    />
  );
}
