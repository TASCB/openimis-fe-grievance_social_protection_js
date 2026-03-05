# How PublishedComponent Works

PublishedComponent is imported from @openimis/fe-core and dynamically renders registered components using a string reference (pubRef).

To create a new published component:

## 1. Create the picker component (e.g., src/pickers/MyPicker.js):

Option A: Using ConstantBasedPicker for static options

js```
import React from 'react';
import { ConstantBasedPicker } from '@openimis/fe-core';
import { MY_CONSTANTS } from '../constants';
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


```
