import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const PAGE_SIZE = 100;

const GRAPHQL_QUERY = `
  query GetGrievanceCategories($first: Int) {
    grievanceCategories(first: $first, isActive: true) {
      edges {
        node {
          id
          code
          name
          isActive
        }
      }
    }
  }
`;

export default function GrievanceCategoryPicker({ onChange, value, readOnly, required, ...props }) {
  const [searchString, setSearchString] = useState(null);
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { first: PAGE_SIZE, searchString },
    { skip: true, keepStale: true },
  );

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required={required}
      error={error}
      placeholder="Select grievance category..."
      label="Category"
      withLabel
      withPlaceholder
      readOnly={readOnly}
      onInputChange={setSearchString}
      options={data?.grievanceCategories?.edges?.map(({ node }) => node) ?? []}
      isLoading={isLoading}
      value={value ?? null}
      getOptionLabel={(option) => option?.name || ""}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      filterOptions={(options) => options}
      onChange={(option) => onChange(option, option?.name ?? null)}
    />
  );
}
