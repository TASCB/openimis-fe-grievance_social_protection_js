import React, { useState } from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const GRAPHQL_QUERY = `
  query GetGrievanceCategories($first: Int) {
    grievanceCategories(isActive: true, first: $first) {
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
    { first: 200, searchString },
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
      onChange={(option) => onChange(option, option?.name ?? null)}
    />
  );
}
