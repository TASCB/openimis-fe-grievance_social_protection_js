import React from "react";
import { injectIntl } from "react-intl";
import { Checkbox, FormControlLabel, Grid } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { FormPanel, TextInput, formatMessage, withModulesManager } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
});

class GrievanceChannelHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly, intl } = this.props;
    const channel = { ...edited };
    return (
      <Grid container className={classes.tableTitle}>
        <Grid item xs={6} className={classes.item}>
          <TextInput
            module={MODULE_NAME}
            label="grievanceChannel.code"
            value={channel.code ?? ""}
            readOnly={readOnly}
            onChange={(code) => this.updateAttribute("code", code)}
          />
        </Grid>
        <Grid item xs={6} className={classes.item}>
          <TextInput
            module={MODULE_NAME}
            label="grievanceChannel.name"
            value={channel.name ?? ""}
            required
            readOnly={readOnly}
            onChange={(name) => this.updateAttribute("name", name)}
          />
        </Grid>
        <Grid item xs={12} className={classes.item}>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={!!channel.isActive}
                disabled={readOnly}
                onChange={(event) => this.updateAttribute("isActive", event.target.checked)}
              />
            }
            label={formatMessage(intl, MODULE_NAME, "grievanceChannel.active")}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(GrievanceChannelHeadPanel))),
);
