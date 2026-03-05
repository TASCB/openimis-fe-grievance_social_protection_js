# How PublishedComponent Works

PublishedComponent is imported from @openimis/fe-core and dynamically renders registered components using a string reference (pubRef).

To create a new published component:

## 1. Create the picker component (e.g., src/pickers/MyPicker.js):

Option A: Using ConstantBasedPicker for static options

```js
import React from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { MY_CONSTANTS } from "../constants";
function MyPicker(props) {
  return (
    <ConstantBasedPicker
      module="grievanceSocialProtection"
      label="my.label"
      constants={MY_CONSTANTS}
      {...props}
    />
  );
}
export default MyPicker;
```

Option B: Using Autocomplete for dynamic/GQL-based options

```js
import React, { useState } from "react";
import { useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";
function MyPicker(props) {
  const { onChange, value, readOnly, ...other } = props;
  const [searchString, setSearchString] = useState(null);
  const { formatMessage } = useTranslations("grievanceSocialProtection");
  const { isLoading, data } = useGraphqlQuery(
    `query MyQuery { ... }`,
    { searchString },
    { skip: true },
  );
  return (
    <Autocomplete
      label={formatMessage("MyPicker.label")}
      options={data?.someData ?? []}
      isLoading={isLoading}
      value={value}
      onChange={(option) => onChange(option, option?.id ?? null)}
      onInputChange={setSearchString}
      readOnly={readOnly}
      {...other}
    />
  );
}
export default MyPicker;
```

## 2. Register in src/index.js:

```js
import MyPicker from "./pickers/MyPicker";
const DEFAULT_CONFIG = {
  refs: [{ key: "grievanceSocialProtection.MyPicker", ref: MyPicker }],
};
```

## 3. Use it with PublishedComponent:

```js
import { PublishedComponent } from "@openimis/fe-core";
<PublishedComponent
  pubRef="grievanceSocialProtection.MyPicker"
  value={someValue}
  onChange={(v) => updateValue(v)}
/>;
```
