import React, { useState } from "react";
import { useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

export default function TicketType({ onChange, value, readOnly, ...props }) {
  const [searchString, setSearchString] = useState(null);
  const [isLoading, setIsLoading] = useState(null);

  return (
    <Autocomplete
      {...props}
      multiple={false}
      required={true}
      placeholder={"Placeholder"}
      label={"Grievance Type"}
      withLabel={true}
      withPlaceholder={undefined}
      readOnly={false}
      options={[]}
      isLoading={false}
      value={value}
      getOptionLabel={(option) => `${option}`}
      onChange={(option) => onChange(option, option ? `${option}` : null)}
      onInputChange={setSearchString}
    />
  );
}
