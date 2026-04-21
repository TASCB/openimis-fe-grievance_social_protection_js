import React, { useMemo, useCallback } from "react";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";
import { withModulesManager, ControlledField, TextInput } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
});

function GrievanceCategoryFilter({ classes, filters, onChangeFilters, modulesManager }) {
  const debouncedOnChangeFilter = useMemo(
    () =>
      _debounce(
        (filtersArray) => onChangeFilters(filtersArray),
        modulesManager.getConf("fe-grievance_social_protection", "debounceTime", 800),
      ),
    [onChangeFilters, modulesManager],
  );

  const filterValue = useCallback(
    (key) => (filters?.[key]?.value ? filters[key].value : ""),
    [filters],
  );

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="grievanceCategoryFilter.name"
        field={
          <Grid item xs={12} sm={12} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceCategory.name"
              name="name"
              value={filterValue("name")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  { id: "name", value: v, filter: `name_Icontains: "${v}"` },
                ])
              }
            />
          </Grid>
        }
      />
    </Grid>
  );
}

export default withModulesManager(withTheme(withStyles(styles)(GrievanceCategoryFilter)));
