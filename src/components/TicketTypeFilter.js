import React, { useMemo, useCallback } from "react";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
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

const TicketTypeFilter = ({ classes, filters, onChangeFilters, modulesManager }) => {
  // Wrap onChangeFilters in a function to ensure debounce receives a function
  const debouncedOnChangeFilter = useMemo(
    () =>
      _debounce(
        (filtersArray) => onChangeFilters(filtersArray),
        modulesManager.getConf("fe-grievance_social_protection", "debounceTime", 800),
      ),
    [onChangeFilters, modulesManager],
  );

  const filterValue = useCallback(
    (key) => (!!filters && !!filters[key] ? filters[key].value : ""),
    [filters],
  );

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.ticketCode"
        field={
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="ticket.ticketCode"
              name="code"
              value={filterValue("code")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  { id: "code", value: v, filter: `code_Icontains: "${v}"` },
                ])
              }
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.ticketTitle"
        field={
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="ticket.ticketTitle"
              name="title"
              value={filterValue("title")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  { id: "title", value: v, filter: `title_Icontains: "${v}"` },
                ])
              }
            />
          </Grid>
        }
      />
    </Grid>
  );
};

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(TicketTypeFilter))));
