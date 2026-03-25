import React, { useState } from "react";
import { useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

export default function TicketTypePicker({ onChange, value, readOnly, ...props }) {
  const [searchString, setSearchString] = useState(null);

  const { isLoading, data, error } = useGraphqlQuery(
    `query GetGrievancesTypes {
      grievanceTypes {
        edges {
          node {id, name}
        }
      }
    }`,
    { searchString, first: 20 },
    { skip: true },
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
      options={data?.grievanceTypes?.edges.map(({ node }) => node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => option.name}
      onChange={(option) => onChange(option?.name ?? null)}
      onInputChange={setSearchString}
    />
  );
}
