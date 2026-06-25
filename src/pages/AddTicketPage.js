/* eslint-disable max-len */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import { Save, CloudUpload } from "@material-ui/icons";
import { TextInput, PublishedComponent, FormattedMessage, SelectInput } from "@openimis/fe-core";
import {
  createTicket, fetchGrievanceLocationScope, setPendingAttachments,
} from "../actions";
import { EMPTY_STRING, MODULE_NAME } from "../constants";
import GrievantTypePicker from "../pickers/GrievantTypePicker";
import ExternalReporterFields from "../components/ExternalReporterFields";
import TicketLocationFields from "../components/TicketLocationFields";
import {
  clearExternalReporterFields,
  externalReporterValidationErrorIds,
  isExternalReporterType,
  isKnownRegistryReporterType,
} from "../utils/externalReporter";
import { descriptionValidationErrorId } from "../utils/descriptionValidation";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: { height: "100%" },
  pendingAttachments: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 8,
  },
  pendingAttachment: {
    display: "flex",
    alignItems: "center",
    maxWidth: "100%",
    margin: 4,
  },
  pendingThumbnail: {
    width: 56,
    height: 56,
    objectFit: "cover",
    borderRadius: 4,
    border: `1px solid ${theme.palette.divider}`,
    marginRight: 8,
  },
  descriptionHelperAlert: {
    marginTop: theme.spacing(1),
  },
});

const assignedLocationsOf = (scope) => scope?.assignedLocations ?? [];

// When a location-restricted user is assigned to exactly one location, derive
// the grievance location (and its Region/District/Ward/Village chain) from it.
const singleAssignedLocationState = (scope) => {
  if (!scope?.restricted) return null;
  const locations = assignedLocationsOf(scope);
  if (locations.length !== 1) return null;
  return {
    region: scope.region ?? null,
    district: scope.district ?? null,
    ward: scope.ward ?? null,
    village: scope.village ?? null,
    eventLocation: scope.assignedLocation ?? locations[0],
  };
};

const sameLocation = (left, right) => (left?.id ?? null) === (right?.id ?? null);

const sameLocationState = (ticket, next) => (
  sameLocation(ticket.region, next.region)
  && sameLocation(ticket.district, next.district)
  && sameLocation(ticket.ward, next.ward)
  && sameLocation(ticket.village, next.village)
  && sameLocation(ticket.eventLocation, next.eventLocation)
);

const locationOptionLabel = (location) => location?.name
  ?? location?.code
  ?? "";

class AddTicketPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaved: false,
      grievantType: null,
      benefitPlan: null,
      selectedCategory: null,
      selectedType: null,
      attachmentErrors: [],
      validationErrors: [],
      descriptionValidationError: null,
      stateEdited: {
        flags: "Investigation", // ['Investigation', 'Risk', 'Administrative', 'Priority', 'Social Protection Context']
        channel: "Web",
        priority: "Low",
        consentGiven: false,
      },
    };
    this.previewUrls = new Map();
  }

  componentDidMount() {
    this.props.fetchGrievanceLocationScope();
    this.syncPreviewUrls(this.props.pendingAttachments);
    this.applyAutoLocation(this.props.grievanceLocationScope);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pendingAttachments !== this.props.pendingAttachments) {
      this.syncPreviewUrls(this.props.pendingAttachments);
    }
    if (prevProps.grievanceLocationScope !== this.props.grievanceLocationScope) {
      this.applyAutoLocation(this.props.grievanceLocationScope);
    }
  }

  componentWillUnmount() {
    this.previewUrls.forEach((url) => window.URL.revokeObjectURL(url));
    this.previewUrls.clear();
  }

  syncPreviewUrls = (files = []) => {
    const currentFiles = new Set(files || []);
    (files || []).forEach((file) => this.ensurePreviewUrl(file));
    this.previewUrls.forEach((url, file) => {
      if (!currentFiles.has(file)) {
        window.URL.revokeObjectURL(url);
        this.previewUrls.delete(file);
      }
    });
  };

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
    const validationErrors = isExternalReporterType(payload.reporterType)
      ? externalReporterValidationErrorIds(payload)
      : [];
    const descriptionValidationError = descriptionValidationErrorId(payload.description);
    if (validationErrors.length > 0 || descriptionValidationError) {
      this.setState({ validationErrors, descriptionValidationError });
      return;
    }
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
      return {
        isSaved: false,
        validationErrors: [],
        descriptionValidationError: k === "description" ? null : state.descriptionValidationError,
        stateEdited: updatedState,
      };
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
    this.setState((state) => {
      const reporterType = value || null;
      const nextTicket = {
        ...state.stateEdited,
        reporter: null,
        reporterType,
      };
      return {
        isSaved: false,
        validationErrors: [],
        benefitPlan: null,
        grievantType: reporterType,
        stateEdited: isExternalReporterType(reporterType)
          ? nextTicket
          : clearExternalReporterFields(nextTicket),
      };
    });
  };

  updateBenefitPlan = (field, value) => {
    this.updateAttribute("reporter", null);
    this.setState((state) => ({ benefitPlan: value }));
  };

  updateExternalReporter = (ticket) => {
    this.setState({
      isSaved: false,
      validationErrors: [],
      stateEdited: ticket,
    });
  };

  // Auto-fill the grievance location from the creator's assigned location when
  // they are assigned to exactly one.
  applyAutoLocation = (scope) => {
    const locationState = singleAssignedLocationState(scope);
    if (!locationState) return;
    this.setState((state) => {
      if (sameLocationState(state.stateEdited, locationState)) return null;
      return { stateEdited: { ...state.stateEdited, ...locationState } };
    });
  };

  // Used when the creator has several assigned locations and must pick one.
  updateAssignedLocationChoice = (locationGqlId) => {
    const selected = assignedLocationsOf(this.props.grievanceLocationScope)
      .find((location) => location.id === locationGqlId) ?? null;
    this.setState((state) => ({
      isSaved: false,
      stateEdited: {
        ...state.stateEdited,
        region: null,
        district: null,
        ward: null,
        village: null,
        eventLocation: selected,
      },
    }));
  };

  // Used when the creator has no assigned location and optionally picks one.
  updateLocation = (location) => {
    this.setState((state) => ({
      isSaved: false,
      stateEdited: { ...state.stateEdited, ...location },
    }));
  };

  handleSelectFiles = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (picked.length === 0) return;
    const ALLOWED = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm",
      "audio/mpeg", "audio/wav", "audio/ogg",
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const MAX = 25 * 1024 * 1024;
    const errors = [];
    const existing = this.props.pendingAttachments || [];
    const next = [...existing];
    for (const f of picked) {
      if (next.length >= 5) { errors.push(`${f.name}: max 5 files`); continue; }
      if (f.size > MAX) { errors.push(`${f.name}: exceeds 25MB`); continue; }
      if (!ALLOWED.includes((f.type || "").toLowerCase())) {
        errors.push(`${f.name}: type not allowed`); continue;
      }
      this.ensurePreviewUrl(f);
      next.push(f);
    }
    this.props.setPendingAttachments(next);
    this.setState({ attachmentErrors: errors });
  };

  removePending = (idx) => {
    const next = [...(this.props.pendingAttachments || [])];
    const removed = next.splice(idx, 1);
    removed.forEach((file) => this.revokePreviewUrl(file));
    this.props.setPendingAttachments(next);
  };

  isImageFile = (file) => (file?.type || "").toLowerCase().startsWith("image/");

  ensurePreviewUrl = (file) => {
    if (!this.isImageFile(file) || this.previewUrls.has(file)) return;
    this.previewUrls.set(file, window.URL.createObjectURL(file));
  };

  revokePreviewUrl = (file) => {
    const previewUrl = this.previewUrls.get(file);
    if (!previewUrl) return;
    window.URL.revokeObjectURL(previewUrl);
    this.previewUrls.delete(file);
  };

  render() {
    const {
      classes,
      pendingAttachments = [],
      titleone = " Ticket.ComplainantInformation",
      titletwo = " Ticket.DescriptionOfEvents",
      titleParams = { label: EMPTY_STRING },
      grievanceLocationScope,
    } = this.props;

    const {
      stateEdited,
      grievantType,
      benefitPlan,
      isSaved,
      selectedCategory,
      selectedType,
      validationErrors,
      descriptionValidationError,
    } = this.state;
    pendingAttachments.forEach((file) => this.ensurePreviewUrl(file));
    // Only location-restricted users are constrained to their assigned locations.
    // Unrestricted users (e.g. superusers) may optionally pick any location.
    const locationRestricted = !!grievanceLocationScope?.restricted;
    const assignedLocations = locationRestricted ? assignedLocationsOf(grievanceLocationScope) : [];
    const mustChooseLocation = assignedLocations.length > 1;
    const hasSingleAssignedLocation = assignedLocations.length === 1;
    const hasNoAssignedLocation = assignedLocations.length === 0;
    const locationChoiceMissing = mustChooseLocation && !stateEdited.eventLocation;

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
                {isExternalReporterType(grievantType) && (
                  <ExternalReporterFields
                    value={stateEdited}
                    onChange={this.updateExternalReporter}
                    readOnly={isSaved}
                    errors={validationErrors}
                  />
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
                          { value: new Date().getFullYear(), label: String(new Date().getFullYear()) },
                          { value: new Date().getFullYear() - 1, label: String(new Date().getFullYear() - 1) },
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
                    minDate={new Date(new Date().getFullYear() - 1, 0, 1)}
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
                    readOnly={isSaved}
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
                    label="Assigned To/Attending Staff"
                    onChange={(v) => this.updateAttribute("attendingStaff", v)}
                    readOnly={isSaved}
                  />
                </Grid>

                {hasSingleAssignedLocation && (
                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module={MODULE_NAME}
                      label="ticket.location.assigned"
                      value={locationOptionLabel(stateEdited.eventLocation)}
                      onChange={() => {}}
                      readOnly
                    />
                  </Grid>
                )}

                {mustChooseLocation && (
                  <Grid item xs={6} className={classes.item}>
                    <SelectInput
                      module={MODULE_NAME}
                      label="ticket.location.choose"
                      value={stateEdited.eventLocation?.id ?? null}
                      onChange={this.updateAssignedLocationChoice}
                      options={[
                        { value: null, label: "-" },
                        ...assignedLocations.map((location) => ({
                          value: location.id,
                          label: locationOptionLabel(location),
                        })),
                      ]}
                      required
                      readOnly={isSaved}
                    />
                    {locationChoiceMissing && (
                      <Alert severity="info" className={classes.descriptionHelperAlert}>
                        <FormattedMessage module={MODULE_NAME} id="ticket.location.choose.help" />
                      </Alert>
                    )}
                  </Grid>
                )}

                {hasNoAssignedLocation && (
                  <>
                    <TicketLocationFields
                      value={stateEdited}
                      onChange={this.updateLocation}
                      readOnly={isSaved}
                      required={false}
                      gridItemClassName={classes.item}
                    />
                    <Grid item xs={12} className={classes.item}>
                      <Alert severity="info" className={classes.descriptionHelperAlert}>
                        <FormattedMessage module={MODULE_NAME} id="ticket.location.optionalHelp" />
                      </Alert>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} className={classes.item}>
                  <TextInput
                    label="ticket.ticketDescription"
                    value={stateEdited.description}
                    onChange={(v) => this.updateAttribute("description", v)}
                    required={false}
                    readOnly={isSaved}
                  />
                  <Alert severity="info" className={classes.descriptionHelperAlert}>
                    <FormattedMessage module={MODULE_NAME} id="ticket.description.helperText" />
                  </Alert>
                  {descriptionValidationError && (
                    <Alert severity="error" className={classes.descriptionHelperAlert}>
                      <FormattedMessage module={MODULE_NAME} id={descriptionValidationError} />
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} className={classes.item}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={!!stateEdited.consentGiven}
                        disabled={isSaved}
                        onChange={(event) =>
                          this.updateAttribute("consentGiven", event.target.checked)
                        }
                      />
                    }
                    label={<FormattedMessage module={MODULE_NAME} id="ticket.consent.label" />}
                  />
                  <Typography variant="body2" color="textSecondary">
                    <FormattedMessage module={MODULE_NAME} id="ticket.consent.message" />
                  </Typography>
                </Grid>

                <Grid item xs={12} className={classes.item}>
                  <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
                    <FormattedMessage module={MODULE_NAME} id="ticket.attachments.optional" />
                  </Typography>
                  <input
                    id="ticket-attachments-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: "none" }}
                    onChange={this.handleSelectFiles}
                    disabled={isSaved}
                  />
                  <label htmlFor="ticket-attachments-input">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      disabled={isSaved || pendingAttachments.length >= 5}
                    >
                      <FormattedMessage module={MODULE_NAME} id="ticket.attachments.selectFiles" />
                    </Button>
                  </label>
                  <div className={classes.pendingAttachments}>
                    {pendingAttachments.map((f, i) => (
                      <div className={classes.pendingAttachment} key={`${f.name}-${f.size}-${i}`}>
                        {this.isImageFile(f) && (
                          <img
                            className={classes.pendingThumbnail}
                            src={this.previewUrls.get(f)}
                            alt={f.name}
                          />
                        )}
                        <Chip
                          label={`${f.name} (${Math.round(f.size / 1024)}KB)`}
                          onDelete={isSaved ? undefined : () => this.removePending(i)}
                          style={{ margin: 4 }}
                        />
                      </div>
                    ))}
                  </div>
                  {(this.state.attachmentErrors || []).map((e) => (
                    <Typography key={e} color="error" variant="caption" display="block">{e}</Typography>
                  ))}
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
                      locationChoiceMissing ||
                      isSaved ||
                      (isKnownRegistryReporterType(stateEdited.reporterType) &&
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
    grievanceLocationScope: state.grievanceSocialProtection.grievanceLocationScope,
    pendingAttachments: state.grievanceSocialProtection.pendingAttachments,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      createTicket,
      fetchGrievanceLocationScope,
      setPendingAttachments,
    },
    dispatch,
  );
}

export default withTheme(
  withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(AddTicketPage)),
);
