/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Grid, Paper, Typography, Divider, IconButton } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import { TextInput, journalize, PublishedComponent, FormattedMessage } from "@openimis/fe-core";
import { createTicket } from "../actions";
import { EMPTY_STRING, MODULE_NAME } from "../constants";
import GrievantTypePicker from "../pickers/GrievantTypePicker";

function styles(theme) {
  return {
    paper: theme.paper.paper,
    tableTitle: theme.table.title,
    item: theme.paper.item,
    fullHeight: { height: "100%" },
  };
}

function CreateTicketPage({
  classes,
  submittingMutation,
  mutation,
  grievanceConfig,
  createTicket,
  journalize,
}) {
  const [stateEdited, setStateEdited] = useState({ channel: "Web", priority: "Low" });
  const [grievantType, setGrievantType] = useState(null);
  const [benefitPlan, setBenefitPlan] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [prevSubmitting, setPrevSubmitting] = useState(submittingMutation);

  useEffect(() => {
    if (prevSubmitting && !submittingMutation) {
      journalize(mutation);
    }
    setPrevSubmitting(submittingMutation);
  }, [submittingMutation]);

  const save = () => {
    createTicket(stateEdited, grievanceConfig, `Created Ticket ${stateEdited.title}`);
    setIsSaved(true);
  };

  function updateAttribute(k, v) {
    setStateEdited((prev) => ({ ...prev, [k]: v }));
    setIsSaved(false);
  }

  function updateTicketCategory(categoryName, category) {
    setSelectedCategory(category ?? null);
    setSelectedType(null);
    setStateEdited((prev) => ({
      ...prev,
      category: categoryName,
      title: null,
    }));
    setIsSaved(false);
  }

  function updateTicketType(typeName, type) {
    setSelectedType(type ?? null);
    setStateEdited((prev) => ({ ...prev, title: typeName }));
    setIsSaved(false);
  }

  function extractFieldFromJsonExt(stateEdited, field) {
    if (stateEdited?.reporter?.jsonExt) {
      const jsonExt = JSON.parse(stateEdited.reporter.jsonExt || "{}");
      return jsonExt[field] || "";
    }
    return "";
  }

  function updateTypeOfGrievant(field, value) {
    updateAttribute("reporter", null);
    updateAttribute("reporterType", value);
    setGrievantType(value);
  }

  function updateBenefitPlan(field, value) {
    updateAttribute("reporter", null);
    setBenefitPlan(value);
  }

  return (
    <div className={classes.page}>
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={8}>
                <Typography>
                  <FormattedMessage
                    module={MODULE_NAME}
                    id={"Ticket.ComplainantInformation"}
                    values={{ label: EMPTY_STRING }}
                  />
                </Typography>
              </Grid>
            </Grid>

            <Grid container className={classes.item}>
              <Grid item xs={3}>
                <GrievantTypePicker
                  module={MODULE_NAME}
                  label="type"
                  readOnly={!!stateEdited.id || isSaved}
                  withNull
                  value={grievantType?.replace(/\s+/g, "") ?? ""}
                  onChange={(v) => updateTypeOfGrievant("grievantType", v)}
                  withLabel
                />
              </Grid>

              {grievantType === "individual" && (
                <>
                  <Grid item xs={3}>
                    <PublishedComponent
                      pubRef="socialProtection.BenefitPlanPicker"
                      withNull
                      label="socialProtection.benefitPlan"
                      value={benefitPlan}
                      onChange={(v) => updateBenefitPlan("benefitPlan", v)}
                      readOnly={isSaved}
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <PublishedComponent
                      pubRef="individual.IndividualPicker"
                      value={stateEdited.reporter}
                      label="Complainant"
                      onChange={(v) => updateAttribute("reporter", v)}
                      benefitPlan={benefitPlan}
                      readOnly={isSaved}
                    />
                  </Grid>
                </>
              )}

              {grievantType === "beneficiary" && (
                <>
                  <Grid item xs={3}>
                    <PublishedComponent
                      pubRef="socialProtection.BenefitPlanPicker"
                      withNull
                      label="socialProtection.benefitPlan"
                      value={benefitPlan}
                      onChange={(v) => updateBenefitPlan("benefitPlan", v)}
                      readOnly={isSaved}
                    />
                  </Grid>

                  {benefitPlan && (
                    <Grid item xs={3}>
                      <PublishedComponent
                        pubRef="socialProtection.BeneficiaryPicker"
                        value={stateEdited.reporter}
                        label="Complainant"
                        onChange={(v) => updateAttribute("reporter", v)}
                        benefitPlan={benefitPlan}
                        readOnly={isSaved}
                      />
                    </Grid>
                  )}
                </>
              )}

              {grievantType === "user" && (
                <Grid item xs={6}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={stateEdited.reporter}
                    label="Complainant"
                    onChange={(v) => updateAttribute("reporter", v)}
                    readOnly={isSaved}
                  />
                </Grid>
              )}
            </Grid>

            <Divider />

            <Grid container className={classes.item}>
              {grievantType === "individual" && (
                <>
                  <Grid item xs={4}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.name"
                      value={
                        stateEdited?.reporter
                          ? `${stateEdited.reporter.firstName} ${stateEdited.reporter.lastName} ${stateEdited.reporter.dob}`
                          : EMPTY_STRING
                      }
                      readOnly
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.phone"
                      value={
                        stateEdited?.reporter
                          ? extractFieldFromJsonExt(stateEdited, "phone")
                          : EMPTY_STRING
                      }
                      readOnly
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.email"
                      value={
                        stateEdited?.reporter
                          ? extractFieldFromJsonExt(stateEdited, "email")
                          : EMPTY_STRING
                      }
                      readOnly
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* SECOND SECTION */}

      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={12}>
                <Typography>
                  <FormattedMessage
                    module={MODULE_NAME}
                    id={"Ticket.DescriptionOfEvents"}
                    values={{ label: EMPTY_STRING }}
                  />
                </Typography>
              </Grid>
            </Grid>

            <Divider />

            <Grid container className={classes.item}>
              <Grid item xs={6}>
                <PublishedComponent
                  label="ticket.category"
                  pubRef="grievanceSocialProtection.TicketCategoryPicker"
                  value={selectedCategory ?? stateEdited.category ?? null}
                  onChange={updateTicketCategory}
                />
              </Grid>

              <Grid item xs={6}>
                <PublishedComponent
                  label="ticket.title"
                  value={selectedType ?? stateEdited.title ?? null}
                  pubRef="grievanceSocialProtection.TicketTypePicker"
                  onChange={updateTicketType}
                  category={selectedCategory}
                  restrictToCategory
                />
              </Grid>

              <Grid item xs={6}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  label="ticket.dateOfIncident"
                  value={stateEdited.dateOfIncident}
                  onChange={(v) => updateAttribute("dateOfIncident", v)}
                  readOnly={isSaved}
                  maxDate={new Date()}
                />
              </Grid>

              <Grid item xs={6}>
                <PublishedComponent
                  pubRef="grievanceSocialProtection.ChannelPicker"
                  value={stateEdited.channel}
                  onChange={(v) => updateAttribute("channel", v)}
                  readOnly
                />
              </Grid>

              <Grid item xs={6}>
                <PublishedComponent
                  pubRef="admin.UserPicker"
                  value={stateEdited.attendingStaff}
                  module="core"
                  onChange={(v) => updateAttribute("attendingStaff", v)}
                  readOnly={isSaved}
                />
              </Grid>

              <Grid item xs={12}>
                <TextInput
                  label="ticket.ticketDescription"
                  value={stateEdited.description}
                  onChange={(v) => updateAttribute("description", v)}
                  readOnly={isSaved}
                />
              </Grid>

              <Grid item xs={11} />

              <Grid item xs={1}>
                <IconButton
                  color="primary"
                  onClick={save}
                  disabled={
                    !stateEdited.category ||
                    !stateEdited.channel ||
                    !stateEdited.title ||
                    isSaved ||
                    ((stateEdited.reporterType === "individual" ||
                      stateEdited.reporterType === "beneficiary" ||
                      stateEdited.reporterType === "user") &&
                      stateEdited.reporter === null)
                  }
                >
                  <Save />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

function mapStateToProps(state) {
  return {
    submittingMutation: state.grievanceSocialProtection.submittingMutation,
    mutation: state.grievanceSocialProtection.mutation,
    grievanceConfig: state.grievanceSocialProtection.grievanceConfig,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ createTicket, journalize }, dispatch);
}

export default withTheme(
  withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(CreateTicketPage)),
);
