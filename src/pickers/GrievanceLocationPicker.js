import React, { useState } from "react";
import { Autocomplete, decodeId, useGraphqlQuery } from "@openimis/fe-core";

const GRAPHQL_QUERY = `
  query GetGrievanceLocations(
    $locationType: String!
    $parentId: Int
    $search: String
  ) {
    grievanceLocations(
      locationType: $locationType
      parentId: $parentId
      search: $search
    ) {
      id
      uuid
      code
      name
      type
    }
  }
`;

const numericId = (location) => {
  if (!location?.id) return null;
  const decoded = decodeId(location.id);
  const id = Number.parseInt(decoded || location.id, 10);
  return Number.isNaN(id) ? null : id;
};

export default function GrievanceLocationPicker({
  label,
  locationType,
  parentLocation = null,
  value = null,
  onChange,
  readOnly = false,
  required = false,
}) {
  const [search, setSearch] = useState("");
  const requiresParent = locationType !== "R";
  const parentId = numericId(parentLocation);
  const { isLoading, data, error } = useGraphqlQuery(
    GRAPHQL_QUERY,
    {
      locationType,
      parentId,
      search: search || null,
    },
    {
      skip: requiresParent && !parentId,
      keepStale: false,
    },
  );

  return (
    <Autocomplete
      multiple={false}
      required={required}
      error={error}
      label={label}
      placeholder={label}
      withLabel
      withPlaceholder
      readOnly={readOnly}
      options={data?.grievanceLocations ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => option?.name || option?.code || ""}
      getOptionSelected={(option, selected) => option?.id === selected?.id}
      filterOptions={(options) => options}
      onInputChange={setSearch}
      onChange={(option) => onChange(option ?? null)}
    />
  );
}
