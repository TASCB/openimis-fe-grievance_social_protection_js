import React from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const GRAPHQL_QUERY = `
  query GetGrievanceCategories($first: Int) {
    grievanceCategories(first: $first) {
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
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { first: 200 },
    { skip: false },
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
      onInputChange={() => {}}
      options={data?.grievanceCategories?.edges?.map(({ node }) => node) ?? []}
      isLoading={isLoading}
      value={value ?? null}
      getOptionLabel={(option) => option?.name || ""}
      onChange={(option) => onChange(option, option?.name ?? null)}
    />
  );
}
