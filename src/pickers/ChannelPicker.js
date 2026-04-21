import React from "react";
import { useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const PAGE_SIZE = 100;

const CHANNELS_QUERY = `
  query GetGrievanceChannels($first: Int) {
    grievanceChannels(first: $first, isActive: true) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const FALLBACK_QUERY = `
  query GetGrievanceChannelFallback {
    grievanceConfig {
      grievanceChannels
    }
  }
`;

function ChannelPicker(props) {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    filterOptions,
    filterSelectedOptions,
    placeholder,
    multiple,
  } = props;
  const { formatMessage } = useTranslations("ticket");

  const { isLoading, data, error } = useGraphqlQuery(
    CHANNELS_QUERY,
    { first: PAGE_SIZE },
    { skip: false },
  );
  const {
    isLoading: isFallbackLoading,
    data: fallbackData,
    error: fallbackError,
  } = useGraphqlQuery(
    FALLBACK_QUERY,
    {},
    { skip: false },
  );
  const channelOptions = data?.grievanceChannels?.edges?.map(({ node }) => node.name) ?? [];
  const fallbackOptions = fallbackData?.grievanceConfig?.grievanceChannels ?? [];
  const options = channelOptions.length ? channelOptions : fallbackOptions;

  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      placeholder={placeholder ?? formatMessage("ChannelPicker.placeholder")}
      label={label ?? formatMessage("ChannelPicker.label")}
      error={error ?? fallbackError}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading || isFallbackLoading}
      value={value}
      getOptionLabel={(option) => `${option}`}
      onChange={(option) => onChange(option, option ? `${option}` : null)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={() => {}}
    />
  );
}

export default ChannelPicker;
