import React from "react";
import { injectIntl } from "react-intl";
import {
  Checkbox, Divider, FormControlLabel, Grid, Paper, Typography,
} from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import {
  FormattedMessage, FormPanel, TextInput, formatMessage, withModulesManager,
} from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
});

class GrievanceCategoryHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly, intl } = this.props;
    const category = { ...edited };
    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Typography>
              <FormattedMessage module={MODULE_NAME} id="grievanceCategory.headPanel.title" />
            </Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceCategory.code"
              value={category.code ?? ""}
              readOnly={readOnly}
              onChange={(code) => this.updateAttribute("code", code)}
            />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceCategory.name"
              value={category.name ?? ""}
              required
              readOnly={readOnly}
              onChange={(name) => this.updateAttribute("name", name)}
            />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput
              module={MODULE_NAME}
              label="grievanceCategory.timeline"
              value={category.timeline ?? ""}
              required
              readOnly={readOnly}
              type="number"
              inputProps={{ min: 0 }}
              onChange={(timeline) => this.updateAttribute("timeline", timeline)}
            />
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={!!category.isActive}
                  disabled={readOnly}
                  onChange={(event) => this.updateAttribute("isActive", event.target.checked)}
                />
              }
              label={formatMessage(intl, MODULE_NAME, "grievanceCategory.active")}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(GrievanceCategoryHeadPanel))),
);
