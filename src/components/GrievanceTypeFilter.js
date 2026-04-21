import React, { useMemo, useCallback } from "react";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";
import { withModulesManager, ControlledField, PublishedComponent, TextInput } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
});

function GrievanceTypeFilter({ classes, filters, onChangeFilters, modulesManager }) {
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
        id="grievanceTypeFilter.name"
        field={
          <Grid item xs={12} sm={6} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceType.name"
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
      <ControlledField
        module={MODULE_NAME}
        id="grievanceTypeFilter.category"
        field={
          <Grid item xs={12} sm={6} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.GrievanceCategoryPicker"
              value={filterValue("category") || null}
              withNull
              onChange={(category) =>
                debouncedOnChangeFilter([
                  {
                    id: "category",
                    value: category || null,
                    filter: category?.id ? `category_Id: "${category.id}"` : null,
                  },
                ])
              }
            />
          </Grid>
        }
      />
    </Grid>
  );
}

export default withModulesManager(withTheme(withStyles(styles)(GrievanceTypeFilter)));
