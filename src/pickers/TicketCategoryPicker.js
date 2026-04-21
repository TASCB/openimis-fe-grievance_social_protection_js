import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const PAGE_SIZE = 100;

const GRAPHQL_QUERY = `
  query GetGrievanceCategories($first: Int) {
    grievanceCategories(first: $first, isActive: true) {
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

export default function TicketCategoryPicker({ onChange, value, readOnly, ...props }) {
  const [searchString, setSearchString] = useState(null);
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { first: PAGE_SIZE, searchString },
    { skip: false },
  );

  const options = data?.grievanceCategories?.edges?.map(({ node }) => node) ?? [];

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required
      error={error}
      placeholder="Select grievance category..."
      label="Category"
      withLabel
      withPlaceholder
      readOnly={readOnly}
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
