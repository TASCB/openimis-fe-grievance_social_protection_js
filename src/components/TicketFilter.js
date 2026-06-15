/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-underscore-dangle */
import React, { Component } from "react";
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
import GrievanceLocationPicker from "../pickers/GrievanceLocationPicker";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: { padding: 0 },
  item: { padding: theme.spacing(1) },
  paperDivider: theme.paper.divider,
});

const TICKET_FILTER_CONTRIBUTION_KEY = "ticket.Filter";
const LOCATION_FILTERS = [
  { id: "locationRegion", type: "R", label: "ticket.location.region" },
  { id: "locationDistrict", type: "D", label: "ticket.location.district" },
  { id: "locationWard", type: "W", label: "ticket.location.ward" },
  { id: "locationVillage", type: "V", label: "ticket.location.village" },
];

class TicketFilter extends Component {
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-grievance_social_protection", "debounceTime", 800),
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _onChangeReporter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: `${k}: "${decodeId(v?.id)}"`,
      },
    ]);
  };

  _onChangeCheckbox = (key, value) => {
    const filters = [
      {
        id: key,
        value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
    this.props.setShowHistoryFilter(value);
  };

  _onChangeOverdue = (value) => {
    this.props.onChangeFilters([
      {
        id: "overdue",
        value: value ? true : null,
        filter: value ? "overdue: true" : null,
      },
    ]);
  };

  _onChangeLocation = (index, value) => {
    const locations = LOCATION_FILTERS.map(({ id }) => this._filterValue(id));
    locations[index] = value;
    for (let i = index + 1; i < locations.length; i += 1) locations[i] = null;
    const selected = [...locations].reverse().find(Boolean);
    const filters = LOCATION_FILTERS.map(({ id }, locationIndex) => ({
      id,
      value: locations[locationIndex],
      filter: null,
    }));
    filters.push({
      id: "eventLocation",
      value: selected,
      filter: selected ? `locationId: ${decodeId(selected.id)}` : null,
    });
    this.props.onChangeFilters(filters);
  };

  render() {
    const { classes, filters, onChangeFilters } = this.props;
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
                value={this._filterValue("code")}
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "code",
                      value: v,
                      filter: `code_Icontains: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />

        <ControlledField
          module={MODULE_NAME}
          id="ticket.reporter"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="individual.IndividualPicker"
                withNull
                label="Individual"
                value={this._filterValue("reporterId")}
                onChange={(v) => this._onChangeReporter("reporterId", v || null)}
              />
            </Grid>
          }
        />
        <ControlledField
          module={MODULE_NAME}
          id="ticket.category"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="grievanceSocialProtection.TicketCategoryPicker"
                withNull
                label="ticket.category"
                value={this._filterValue("category")}
                onChange={(categoryName) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "category",
                      value: categoryName,
                      filter: categoryName ? `category_Icontains: "${categoryName}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module={MODULE_NAME}
          id="ticketFilter.type"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="grievanceSocialProtection.TicketTypePicker"
                withNull
                label="ticket.title"
                value={this._filterValue("title")}
                onChange={(typeName) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "title",
                      value: typeName,
                      filter: typeName ? `title_Icontains: "${typeName}"` : null,
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
                value={this._filterValue("status")}
                withNull
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
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
          id="ticketFilter.channel"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="grievanceSocialProtection.ChannelPicker"
                withNull
                value={this._filterValue("channel")}
                onChange={(channelName) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "channel",
                      value: channelName,
                      filter: channelName ? `channel_Icontains: "${channelName}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {LOCATION_FILTERS.map(({ id, type, label }, index) => (
          <ControlledField
            module={MODULE_NAME}
            id={`ticketFilter.${id}`}
            key={id}
            field={
              <Grid item xs={3} className={classes.item}>
                <GrievanceLocationPicker
                  locationType={type}
                  label={formatMessage(this.props.intl, MODULE_NAME, label)}
                  value={this._filterValue(id)}
                  parentLocation={
                    index > 0 ? this._filterValue(LOCATION_FILTERS[index - 1].id) : null
                  }
                  onChange={(location) => this._onChangeLocation(index, location)}
                />
              </Grid>
            }
          />
        ))}
        <ControlledField
          module={MODULE_NAME}
          id="ticketFilter.dateOfIncidentFrom"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                module={MODULE_NAME}
                label="ticketFilter.dateOfIncidentFrom"
                value={this._filterValue("dateOfIncidentFrom")}
                onChange={(v) =>
                  this.props.onChangeFilters([
                    {
                      id: "dateOfIncidentFrom",
                      value: v,
                      filter: v ? `dateOfIncident_Gte: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module={MODULE_NAME}
          id="ticketFilter.dateOfIncidentTo"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                module={MODULE_NAME}
                label="ticketFilter.dateOfIncidentTo"
                value={this._filterValue("dateOfIncidentTo")}
                onChange={(v) =>
                  this.props.onChangeFilters([
                    {
                      id: "dateOfIncidentTo",
                      value: v,
                      filter: v ? `dateOfIncident_Lte: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <Grid>
          <ControlledField
            module={MODULE_NAME}
            id="TicketFilter.overdue"
            field={
              <Grid item xs={12} className={classes.item}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={!!this._filterValue("overdue")}
                      onChange={(event) => this._onChangeOverdue(event.target.checked)}
                    />
                  }
                  label={formatMessage(this.props.intl, MODULE_NAME, "ticketFilter.overdueOnly")}
                />
              </Grid>
            }
          />
          <ControlledField
            module={MODULE_NAME}
            id="TicketFilter.showHistory"
            field={
              <Grid item xs={12} className={classes.item}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={!!this._filterValue("showHistory")}
                      onChange={(event) =>
                        this._onChangeCheckbox("showHistory", event.target.checked)
                      }
                    />
                  }
                  label={formatMessage(this.props.intl, MODULE_NAME, "showHistory")}
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
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(TicketFilter))));
