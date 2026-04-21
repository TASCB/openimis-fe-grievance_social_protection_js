import React, { useCallback, useMemo } from "react";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { Grid, Checkbox, FormControlLabel } from "@material-ui/core";
import {
  withModulesManager,
  Contributions,
  ControlledField,
  TextInput,
  PublishedComponent,
  decodeId,
  formatMessage,
} from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: { padding: 0 },
  item: { padding: theme.spacing(1) },
  paperDivider: theme.paper.divider,
});

const TICKET_FILTER_CONTRIBUTION_KEY = "ticket.Filter";

const TicketReportFilter = (props) => {
  const { classes, filters, onChangeFilters, modulesManager, intl, setShowHistoryFilter } = props;

  // Debounced handler (memoized)
  const debouncedOnChangeFilter = useMemo(
    () =>
      _debounce(
        onChangeFilters,
        modulesManager.getConf("fe-grievance_social_protection", "debounceTime", 800),
      ),
    [onChangeFilters, modulesManager],
  );

  // Helpers
  const filterValue = useCallback(
    (k) => {
      return filters && filters[k] ? filters[k].value : null;
    },
    [filters],
  );

  const onChangeReporter = useCallback(
    (k, v) => {
      onChangeFilters([
        {
          id: k,
          value: v,
          filter: `${k}: "${decodeId(v?.id)}"`,
        },
      ]);
    },
    [onChangeFilters],
  );

  const onChangeCheckbox = useCallback(
    (key, value) => {
      const newFilters = [
        {
          id: key,
          value,
          filter: `${key}: ${value}`,
        },
      ];
      onChangeFilters(newFilters);
      setShowHistoryFilter(value);
    },
    [onChangeFilters, setShowHistoryFilter],
  );

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="ticket.category"
        field={
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketCategoryPicker"
              withNull
              value={filterValue("category")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  {
                    id: "category",
                    value: v,
                    filter: `category_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="ticket.type"
        field={
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketTypePicker"
              withNull
              value={filterValue("type")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  {
                    id: "type",
                    value: v,
                    filter: `category_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="ticketFilter.priority"
        field={
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketPriorityPicker"
              withNull
              label="ticket.ticketPriority"
              value={filterValue("priority")}
              onChange={(v) =>
                debouncedOnChangeFilter([
                  {
                    id: "priority",
                    value: v,
                    filter: `priority_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="ticket.status"
        field={
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.TicketStatusPicker"
              label="ticket.ticketStatus"
              value={filterValue("status")}
              withNull
              onChange={(v) =>
                debouncedOnChangeFilter([
                  {
                    id: "status",
                    value: v,
                    filter: `status_Icontains: ${v}`,
                  },
                ])
              }
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="ticket.channel"
        field={
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.ChannelPicker"
              label="ticket.channel"
              value={filterValue("channel")}
              withNull
              onChange={(v) =>
                debouncedOnChangeFilter([
                  {
                    id: "channel",
                    value: v,
                    filter: `channel_Icontains: "${v}"`,
                  },
                ])
              }
            />
          </Grid>
        }
      />

      <Grid item xs={3} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module="socialProtection"
          label="beneficiary.dateFrom"
          value={filterValue("individual_Dob")}
          onChange={(v) =>
            onChangeFilters([
              {
                id: "individual_Dob",
                value: v,
                filter: `individual_Dob: "${v}"`,
              },
            ])
          }
        />
      </Grid>

      <Grid item xs={3} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module="socialProtection"
          label="beneficiary.dateTo"
          value={filterValue("individual_Dob")}
          onChange={(v) =>
            onChangeFilters([
              {
                id: "individual_Dob",
                value: v,
                filter: `individual_Dob: "${v}"`,
              },
            ])
          }
        />
      </Grid>

      <Grid item xs={12}>
        <PublishedComponent
          pubRef="location.DetailedLocationFilter"
          withNull
          filters={filters}
          onChangeFilters={onChangeFilters}
          anchor="parentLocation"
        />
      </Grid>

      <Grid item xs={3}>
        <ControlledField
          module={MODULE_NAME}
          id="TicketFilter.showHistory"
          field={
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!filterValue("showHistory")}
                    onChange={(event) => onChangeCheckbox("showHistory", event.target.checked)}
                  />
                }
                label={formatMessage(intl, MODULE_NAME, "isPaaWithoutGrievances")}
              />
            </Grid>
          }
        />
      </Grid>

      <Grid item xs={3}>
        <ControlledField
          module={MODULE_NAME}
          id="TicketFilter.showHistory"
          field={
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!filterValue("showHistory")}
                    onChange={(event) => onChangeCheckbox("showHistory", event.target.checked)}
                  />
                }
                label={formatMessage(intl, MODULE_NAME, "isPaaHasOverdue")}
              />
            </Grid>
          }
        />
      </Grid>

      <Grid item xs={3}>
        <ControlledField
          module={MODULE_NAME}
          id="TicketFilter.showHistory"
          field={
            <Grid item xs={12} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!filterValue("showHistory")}
                    onChange={(event) => onChangeCheckbox("showHistory", event.target.checked)}
                  />
                }
                label={formatMessage(intl, MODULE_NAME, "showHistory")}
              />
            </Grid>
          }
        />
      </Grid>

      <Contributions
        filters={filters}
        onChangeFilters={onChangeFilters}
        contributionKey={TICKET_FILTER_CONTRIBUTION_KEY}
      />
    </Grid>
  );
};

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(TicketReportFilter))));
