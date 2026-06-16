import React from "react";
import { injectIntl } from "react-intl";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  ControlledField,
  PublishedComponent,
  SelectInput,
  TextInput,
  formatMessage,
} from "@openimis/fe-core";
import {
  GRIEVANCE_REPORT_OPTIONS,
  GRIEVANCE_REPORT_TYPES,
  MODULE_NAME,
  PAA_GRIEVANCE_FILTER_OPTIONS,
  PAA_GRIEVANCE_FILTER_TYPES,
} from "../constants";

const styles = (theme) => ({
  form: { padding: 0 },
  item: { padding: theme.spacing(1) },
});

const TicketReportFilter = ({ classes, filters, onChangeFilters, intl }) => {
  const filterValue = (key) => filters?.[key]?.value ?? null;

  const updateFilter = (id, value) => {
    onChangeFilters([{ id, value }]);
  };

  const reportOptions = GRIEVANCE_REPORT_OPTIONS.map((option) => ({
    value: option.value,
    label: formatMessage(intl, MODULE_NAME, option.label),
  }));
  const paaGrievanceFilterOptions = PAA_GRIEVANCE_FILTER_OPTIONS.map((option) => ({
    value: option.value,
    label: formatMessage(intl, MODULE_NAME, option.label),
  }));
  const selectedReport = filterValue("report")?.value || filterValue("report");
  const selectedPaaGrievanceFilter =
    filterValue("paaGrievanceFilter")?.value || filterValue("paaGrievanceFilter");
  const showGrievanceCount =
    selectedPaaGrievanceFilter === PAA_GRIEVANCE_FILTER_TYPES.LESS_THAN ||
    selectedPaaGrievanceFilter === PAA_GRIEVANCE_FILTER_TYPES.MORE_THAN;

  return (
    <Grid container className={classes.form}>
      <ControlledField
        module={MODULE_NAME}
        id="grievanceReport.report"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <SelectInput
              module={MODULE_NAME}
              label="grievanceReport.report"
              value={filterValue("report")}
              onChange={(value) => updateFilter("report", value)}
              options={reportOptions}
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="grievanceReport.dateFrom"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label="grievanceReport.dateFrom"
              value={filterValue("dateFrom")}
              onChange={(value) => updateFilter("dateFrom", value)}
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="grievanceReport.dateTo"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module={MODULE_NAME}
              label="grievanceReport.dateTo"
              value={filterValue("dateTo")}
              onChange={(value) => updateFilter("dateTo", value)}
            />
          </Grid>
        }
      />

      <ControlledField
        module={MODULE_NAME}
        id="grievanceReport.agent"
        field={
          <Grid item xs={12} sm={6} md={3} className={classes.item}>
            <PublishedComponent
              pubRef="admin.UserPicker"
              module={MODULE_NAME}
              label={formatMessage(intl, MODULE_NAME, "grievanceReport.agent")}
              value={filterValue("agent")}
              withNull
              onChange={(value) => updateFilter("agent", value)}
            />
          </Grid>
        }
      />

      {selectedReport === GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES && (
        <>
          <ControlledField
            module={MODULE_NAME}
            id="grievanceReport.paaGrievanceFilter"
            field={
              <Grid item xs={12} sm={6} md={3} className={classes.item}>
                <SelectInput
                  module={MODULE_NAME}
                  label="grievanceReport.paaGrievanceFilter"
                  value={filterValue("paaGrievanceFilter")}
                  onChange={(value) => updateFilter("paaGrievanceFilter", value)}
                  options={paaGrievanceFilterOptions}
                />
              </Grid>
            }
          />

          {showGrievanceCount && (
            <ControlledField
              module={MODULE_NAME}
              id="grievanceReport.grievanceCount"
              field={
                <Grid item xs={12} sm={6} md={3} className={classes.item}>
                  <TextInput
                    module={MODULE_NAME}
                    label="grievanceReport.grievanceCount"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    value={filterValue("grievanceCount") ?? ""}
                    onChange={(value) => updateFilter("grievanceCount", value)}
                  />
                </Grid>
              }
            />
          )}
        </>
      )}

      <Grid item xs={12}>
        <PublishedComponent
          pubRef="location.DetailedLocationFilter"
          withNull
          filters={filters}
          onChangeFilters={onChangeFilters}
          anchor="paa"
        />
      </Grid>
    </Grid>
  );
};

export default injectIntl(withTheme(withStyles(styles)(TicketReportFilter)));
