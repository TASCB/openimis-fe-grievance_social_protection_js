import React from "react";
import { Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const PAGE_SIZE = 100;

const GRAPHQL_QUERY = `
  query GetGrievanceTypes($first: Int) {
    grievanceTypes(isActive: true, first: $first) {
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

export default function GrievanceTypePicker({ onChange, value, readOnly, ...props }) {
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { first: PAGE_SIZE },
    { skip: false },
  );

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required
      error={error}
      placeholder="Select grievance type..."
      label="Type"
      withLabel
      withPlaceholder
      readOnly={readOnly}
      onInputChange={() => {}}
      options={data?.grievanceTypes?.edges?.map(({ node }) => node) ?? []}
      isLoading={isLoading}
      value={value ?? null}
      getOptionLabel={(option) => option?.name || ""}
      onChange={(option) => onChange(option, option?.name ?? null)}
    />
  );
}
