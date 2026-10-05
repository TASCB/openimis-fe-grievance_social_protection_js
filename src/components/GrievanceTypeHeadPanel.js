import React from "react";
import { injectIntl } from "react-intl";
import {
  Checkbox, Divider, FormControlLabel, Grid, Paper, Typography,
} from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import {
  FormattedMessage, FormPanel, PublishedComponent, TextInput, formatMessage, withModulesManager,
} from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
});

class GrievanceTypeHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly, intl } = this.props;
    const type = { ...edited };
    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Typography>
              <FormattedMessage module={MODULE_NAME} id="grievanceType.headPanel.title" />
            </Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceType.code"
              value={type.code ?? ""}
              readOnly={readOnly}
              onChange={(code) => this.updateAttribute("code", code)}
            />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceType.name"
              value={type.name ?? ""}
              required
              readOnly={readOnly}
              onChange={(name) => this.updateAttribute("name", name)}
            />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent
              pubRef="grievanceSocialProtection.GrievanceCategoryPicker"
              value={type.category}
              readOnly={readOnly}
              required
              onChange={(category) => this.updateAttribute("category", category)}
            />
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={!!type.isActive}
                  disabled={readOnly}
                  onChange={(event) => this.updateAttribute("isActive", event.target.checked)}
                />
              }
              label={formatMessage(intl, MODULE_NAME, "grievanceType.active")}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(GrievanceTypeHeadPanel))),
);
