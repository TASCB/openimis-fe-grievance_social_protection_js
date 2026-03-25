import React, { useState } from "react";
import { useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const GRAPHQL_QUERY = `
  query GetGrievancesCategories($typeId: ID) {
    grievanceCategories(typeId: $typeId) {
      edges {
        node {id name}
      }
    }
  }
`;

export default function TicketCategoryPicker({ type, onChange, value, readOnly, ...props }) {
  const [searchString, setSearchString] = useState(null);

  const typeId = type?.id ?? null;

  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    { searchString, first: 20, typeId },
    { skip: true },
  );

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required={true}
      error={error}
      placeholder={"Select grievance category..."}
      label={"Category"}
      withLabel={true}
      withPlaceholder={"Select category..."}
      readOnly={readOnly}
      options={data?.grievanceCategories?.edges.map(({ node }) => node.name) ?? []}
      isLoading={isLoading}
      value={value ?? null}
      getOptionLabel={(option) => `${option}`}
      onChange={(option) => onChange(option, option ? `${option}` : null)}
      onInputChange={setSearchString}
    />
  );
}
