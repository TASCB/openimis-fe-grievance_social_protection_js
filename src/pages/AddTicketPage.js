/* eslint-disable max-len */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Grid, Paper, Typography, Divider, IconButton } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import { TextInput, journalize, PublishedComponent, FormattedMessage, SelectInput } from "@openimis/fe-core";
import { createTicket } from "../actions";
import { EMPTY_STRING, MODULE_NAME } from "../constants";
import GrievantTypePicker from "../pickers/GrievantTypePicker";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: { height: "100%" },
});

class AddTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaved: false,
      grievantType: null,
      benefitPlan: null,
      selectedCategory: null,
      selectedType: null,
      stateEdited: {
        flags: "Investigation", // ['Investigation', 'Risk', 'Administrative', 'Priority', 'Social Protection Context']
        channel: "Web",
        priority: "Low",
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevPops, prevState, snapshort) {
    if (prevPops.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
    }
  }

  isPaymentCategory = () => {
    const name = this.state.selectedCategory?.name ?? this.state.stateEdited?.category ?? "";
    return /malipo|payment/i.test(name);
  };

  buildTicketPayload = () => {
    const { stateEdited, paymentWindow, paymentYear } = this.state;
    if (!this.isPaymentCategory()) return stateEdited;
    const extras = { paymentWindow, paymentYear };
    return { ...stateEdited, jsonExt: JSON.stringify(extras) };
  };

  save = () => {
    const payload = this.buildTicketPayload();
    this.props.createTicket(
      payload,
      this.props.grievanceConfig,
      `Created Ticket ${payload.title}`,
    );
    this.setState({ isSaved: true });
  };

  updateAttribute = (k, v) => {
    this.setState((state) => {
      const updatedState = { ...state.stateEdited, [k]: v };
      return { isSaved: false, stateEdited: updatedState };
    });
  };

  updateTicketCategory = (categoryName, category) => {
    this.setState((state) => ({
      isSaved: false,
      selectedCategory: category ?? null,
      selectedType: null,
      stateEdited: {
        ...state.stateEdited,
        category: categoryName,
        title: null,
      },
    }));
  };

  updateTicketType = (typeName, type) => {
    this.setState((state) => ({
      isSaved: false,
      selectedType: type ?? null,
      stateEdited: {
        ...state.stateEdited,
        title: typeName,
      },
    }));
  };

  // eslint-disable-next-line class-methods-use-this
  extractFieldFromJsonExt = (stateEdited, field) => {
    if (stateEdited && stateEdited.reporter && stateEdited.reporter.jsonExt) {
      const jsonExt = JSON.parse(stateEdited.reporter.jsonExt || "{}");
      return jsonExt[field] || "";
    }
    return "";
  };

  updateTypeOfGrievant = (field, value) => {
    this.updateAttribute("reporter", null);
    this.updateAttribute("reporterType", value);
    this.setState((state) => ({ grievantType: value }));
  };

  updateBenefitPlan = (field, value) => {
    this.updateAttribute("reporter", null);
    this.setState((state) => ({ benefitPlan: value }));
  };

  render() {
    const {
      classes,
      titleone = " Ticket.ComplainantInformation",
      titletwo = " Ticket.DescriptionOfEvents",
      titleParams = { label: EMPTY_STRING },
    } = this.props;

    const {
      stateEdited,
      grievantType,
      benefitPlan,
      isSaved,
      selectedCategory,
      selectedType,
    } = this.state;

    return (
      <div className={classes.page}>
        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={8} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titleone} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Grid container className={classes.item}>
                <Grid item xs={3} className={classes.item}>
                  <GrievantTypePicker
                    module={MODULE_NAME}
                    label="type"
                    readOnly={!!stateEdited.id || isSaved}
                    withNull
                    value={grievantType?.replace(/\s+/g, "") ?? ""}
                    onChange={(v) => this.updateTypeOfGrievant("grievantType", v)}
                    withLabel
                  />
                </Grid>
                {grievantType === "individual" && (
                  <>
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="socialProtection.BenefitPlanPicker"
                        withNull
                        label="socialProtection.benefitPlan"
                        value={benefitPlan}
                        onChange={(v) => this.updateBenefitPlan("benefitPlan", v)}
                        readOnly={isSaved}
                      />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="individual.IndividualPicker"
                        value={stateEdited.reporter}
                        label="Complainant"
                        onChange={(v) => this.updateAttribute("reporter", v)}
                        benefitPlan={benefitPlan}
                        readOnly={isSaved}
                      />
                    </Grid>
                  </>
                )}
                {grievantType === "beneficiary" && (
                  <>
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="socialProtection.BenefitPlanPicker"
                        withNull
                        label="socialProtection.benefitPlan"
                        value={benefitPlan}
                        onChange={(v) => this.updateBenefitPlan("benefitPlan", v)}
                        readOnly={isSaved}
                      />
                    </Grid>
                    {benefitPlan && (
                      <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                          pubRef="socialProtection.BeneficiaryPicker"
                          value={stateEdited.reporter}
                          label="Complainant"
                          onChange={(v) => this.updateAttribute("reporter", v)}
                          benefitPlan={benefitPlan}
                          readOnly={isSaved}
                        />
                      </Grid>
                    )}
                  </>
                )}
                {grievantType === "user" && (
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="admin.UserPicker"
                      value={stateEdited.reporter}
                      label="Complainant"
                      onChange={(v) => this.updateAttribute("reporter", v)}
                      benefitPlan={benefitPlan}
                      readOnly={isSaved}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider />

              <Grid container className={classes.item}>
                {grievantType === "individual" && (
                  <>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.name"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? // eslint-disable-next-line max-len
                              `${stateEdited.reporter.firstName} ${stateEdited.reporter.lastName} ${stateEdited.reporter.dob}`
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("name", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.phone"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? this.extractFieldFromJsonExt(stateEdited, "phone")
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("phone", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.email"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? this.extractFieldFromJsonExt(stateEdited, "email")
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("email", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                  </>
                )}
                {grievantType === "beneficiary" && (
                  <>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.name"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? // eslint-disable-next-line max-len
                              `${stateEdited.reporter.individual.firstName} ${stateEdited.reporter.individual.lastName} ${stateEdited.reporter.individual.dob}`
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("name", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.phone"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? this.extractFieldFromJsonExt(stateEdited, "phone")
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("phone", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                    <Grid item xs={4} className={classes.item}>
                      <TextInput
                        module={MODULE_NAME}
                        label="ticket.email"
                        value={
                          !!stateEdited && !!stateEdited.reporter
                            ? this.extractFieldFromJsonExt(stateEdited, "email")
                            : EMPTY_STRING
                        }
                        onChange={(v) => this.updateAttribute("email", v)}
                        required={false}
                        readOnly
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container className={classes.tableTitle}>
                <Grid item xs={12} className={classes.tableTitle}>
                  <Typography>
                    <FormattedMessage module={MODULE_NAME} id={titletwo} values={titleParams} />
                  </Typography>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className={classes.item}>
                {/* <Grid item xs={6} className={classes.item}>
                  <TextInput
                    label="ticket.title"
                    value={stateEdited.title}
                    onChange={(v) => this.updateAttribute("title", v)}
                    required
                    readOnly={isSaved}
                  />
                </Grid> */}

                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketCategoryPicker"
                    label="ticket.category"
                    value={selectedCategory ?? stateEdited.category ?? null}
                    onChange={this.updateTicketCategory}
                  />
                </Grid>

                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketTypePicker"
                    label="ticket.title"
                    value={selectedType ?? stateEdited.title ?? null}
                    onChange={this.updateTicketType}
                    category={selectedCategory}
                    restrictToCategory
                  />
                </Grid>

                {this.isPaymentCategory() && (
                  <>
                    <Grid item xs={6} className={classes.item}>
                      <SelectInput
                        module={MODULE_NAME}
                        label="ticket.paymentWindow"
                        value={this.state.paymentWindow ?? null}
                        onChange={(v) => this.setState({ paymentWindow: v, isSaved: false })}
                        options={[
                          { value: null, label: "-" },
                          { value: "JAN_FEB", label: "Jan - Feb" },
                          { value: "MAR_APR", label: "Mar - Apr" },
                          { value: "MAY_JUN", label: "May - Jun" },
                          { value: "JUL_AUG", label: "Jul - Aug" },
                          { value: "SEP_OCT", label: "Sep - Oct" },
                          { value: "NOV_DEC", label: "Nov - Dec" },
                        ]}
                        readOnly={isSaved}
                      />
                    </Grid>
                    <Grid item xs={6} className={classes.item}>
                      <SelectInput
                        module={MODULE_NAME}
                        label="ticket.paymentYear"
                        value={this.state.paymentYear ?? null}
                        onChange={(v) => this.setState({ paymentYear: v, isSaved: false })}
                        options={[
                          { value: null, label: "-" },
                          ...Array.from({ length: 6 }, (_, i) => {
                            const y = new Date().getFullYear() + i;
                            return { value: y, label: String(y) };
                          }),
                        ]}
                        readOnly={isSaved}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    label="ticket.dateOfIncident"
                    value={stateEdited.dateOfIncident}
                    required={false}
                    onChange={(v) => this.updateAttribute("dateOfIncident", v)}
                    readOnly={isSaved}
                    maxDate={new Date()}
                  />
                </Grid>

                {/* <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.DropDownCategoryPicker"
                    value={stateEdited.category}
                    onChange={(v) => this.updateAttribute("category", v)}
                    required
                    readOnly={isSaved}
                  />
                </Grid> */}

                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.ChannelPicker"
                    value={stateEdited.channel}
                    onChange={(v) => this.updateAttribute("channel", v)}
                    required
                    readOnly
                  />
                </Grid>

                {/* <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="grievanceSocialProtection.TicketPriorityPicker"
                    value={stateEdited.priority}
                    onChange={(v) => this.updateAttribute("priority", v)}
                    required={false}
                    readOnly={isSaved}
                  />
                </Grid> */}

                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="admin.UserPicker"
                    value={stateEdited.attendingStaff}
                    module="core"
                    onChange={(v) => this.updateAttribute("attendingStaff", v)}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.ticketDescription"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute("description", v)}
                    required={false}
                    readOnly={isSaved}
                  />
                </Grid>
                <Grid item xs={11} className={classes.item} />
                <Grid item xs={1} className={classes.item}>
                  <IconButton
                    variant="contained"
                    component="label"
                    color="primary"
                    onClick={this.save}
                    disabled={
                      !stateEdited.category ||
                      !stateEdited.channel ||
                      !stateEdited.title ||
                      (this.isPaymentCategory() &&
                        (!this.state.paymentWindow || !this.state.paymentYear)) ||
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
}

// eslint-disable-next-line no-unused-vars
function mapStateToProps(state, props) {
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
  withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(AddTicketPage)),
);
