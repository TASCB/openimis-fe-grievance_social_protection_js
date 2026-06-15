import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import DescriptionIcon from "@material-ui/icons/Description";
import GetAppIcon from "@material-ui/icons/GetApp";
import SearchIcon from "@material-ui/icons/Search";
import TableChartIcon from "@material-ui/icons/TableChart";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { ProgressOrError, decodeId, formatMessage, withModulesManager } from "@openimis/fe-core";
import {
  GRIEVANCE_REPORT_OPTIONS,
  GRIEVANCE_REPORT_TYPES,
  MODULE_NAME,
  RIGHT_TICKET_SEARCH,
} from "../constants";
import { fetchGrievanceReports, fetchGrievanceReportsForExport } from "../actions";
import TicketReportFilter from "./TicketReportFilter";
import { EXPORT_FORMATS, exportReport } from "../utils/reportExport";
import { formatTimelineStatus, formatTimeTaken } from "../utils/grievanceMetrics";

function styles(theme) {
  return {
    paper: { ...theme.paper.paper, margin: 0 },
    paperHeader: { ...theme.paper.header, padding: theme.spacing(1) },
    item: { padding: theme.spacing(1) },
    table: {
      tableLayout: "fixed",
    },
    reportCell: {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
    },
    emptyRow: {
      textAlign: "center",
      padding: theme.spacing(3),
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      flexWrap: "wrap",
      paddingTop: theme.spacing(0.5),
    },
    exportButton: {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
    },
  };
}

const DEFAULT_FILTERS = {
  report: {
    id: "report",
    value: GRIEVANCE_REPORT_TYPES.CATEGORY,
  },
};

function resolveReportType(report) {
  return Object.values(GRIEVANCE_REPORT_TYPES).includes(report)
    ? report
    : GRIEVANCE_REPORT_TYPES.CATEGORY;
}

function safeDecodeId(id) {
  if (!id) return null;
  try {
    return decodeId(id);
  } catch (e) {
    return id;
  }
}

function normalizeId(value) {
  if (!value) return null;
  return safeDecodeId(value.id || value.uuid || value);
}

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseLocationId(filters) {
  const values = Object.values(filters || {});
  const locationFilter =
    values.find(({ id, value }) => id === "paa" && value) ||
    values.find(({ id, value }) => id === "parentLocation" && value) ||
    values.find(({ id, value }) => id?.toLowerCase().includes("paa") && value) ||
    values.find(({ filter }) => /(?:paa|parentLocation)\s*:/i.test(filter || ""));

  if (!locationFilter) return null;
  if (locationFilter.value) return normalizeId(locationFilter.value);

  const match = (locationFilter.filter || "").match(
    /(?:paa|parentLocation)\s*:\s*"?([^",\s)]+)"?/i,
  );
  return match ? safeDecodeId(match[1]) : null;
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatNumber(value) {
  if (value === null || value === undefined) return "";
  return value;
}

function normalizeReport(value) {
  return value?.value || value || GRIEVANCE_REPORT_TYPES.CATEGORY;
}

function reportLabel(report, intl) {
  const reportOption = GRIEVANCE_REPORT_OPTIONS.find((option) => option.value === report);
  return reportOption ? formatMessage(intl, MODULE_NAME, reportOption.label) : report;
}

function reportColumns(report, intl) {
  const t = (id) => formatMessage(intl, MODULE_NAME, id);

  const aggregateColumns = {
    [GRIEVANCE_REPORT_TYPES.CATEGORY]: [
      { label: t("grievanceReport.category"), render: (row) => row.category || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES]: [
      { label: t("grievanceReport.paa"), render: (row) => row.paaName || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.CHANNEL]: [
      { label: t("grievanceReport.channel"), render: (row) => row.channel || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS]: [
      { label: t("grievanceReport.status"), render: (row) => row.status || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA]: [
      { label: t("grievanceReport.paa"), render: (row) => row.paaName || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
      {
        label: t("grievanceReport.maxOverdueDays"),
        render: (row) => formatNumber(row.overdueDays),
      },
    ],
  };

  if (aggregateColumns[report]) return aggregateColumns[report];

  return [
    { label: t("tickets.code"), render: (row) => row.ticketCode },
    { label: t("tickets.title"), render: (row) => row.ticketTitle },
    { label: t("grievanceReport.category"), render: (row) => row.category },
    { label: t("grievanceReport.paa"), render: (row) => row.paaName },
    { label: t("grievanceReport.agent"), render: (row) => row.agentName },
    { label: t("grievanceReport.dateReceived"), render: (row) => formatDate(row.dateReceived) },
    { label: t("grievanceReport.dateClosed"), render: (row) => formatDate(row.dateClosed) },
    { label: t("tickets.dueDate"), render: (row) => formatDate(row.dueDate) },
    {
      label: t("tickets.overdue"),
      render: (row) => formatTimelineStatus(intl, row.timelineStatus),
    },
    {
      label: t("tickets.timeTaken"),
      render: (row) => formatTimeTaken(intl, row.timeTakenSeconds),
    },
    {
      label: t("grievanceReport.closureDays"),
      render: (row) => formatNumber(row.closureDays),
    },
    {
      label: t("grievanceReport.overdueDays"),
      render: (row) => formatNumber(row.overdueDays),
    },
  ];
}

function TicketReportSearcher({
  classes,
  intl,
  modulesManager,
  reports,
  fetchingReports,
  errorReports,
  initialReport,
  rights,
}) {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    report: { id: "report", value: resolveReportType(initialReport) },
  }));
  const [exportError, setExportError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const selectedReport = normalizeReport(filters.report?.value);

  useEffect(() => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      report: { id: "report", value: resolveReportType(initialReport) },
    }));
  }, [initialReport]);

  const onChangeFilters = useCallback((updates) => {
    setFilters((previousFilters) => {
      const nextFilters = { ...previousFilters };
      updates.forEach(({ id, value, filter }) => {
        if (!id) return;
        if (value === null || value === undefined || value === "") {
          delete nextFilters[id];
        } else {
          nextFilters[id] = { id, value, filter };
        }
      });
      if (!nextFilters.report) {
        nextFilters.report = DEFAULT_FILTERS.report;
      }
      return nextFilters;
    });
  }, []);

  const queryParams = useMemo(() => {
    const params = [`report: "${selectedReport}"`];
    const dateFrom = normalizeDate(filters.dateFrom?.value);
    const dateTo = normalizeDate(filters.dateTo?.value);
    const agentId = normalizeId(filters.agent?.value);
    const paaId = parseLocationId(filters);

    if (dateFrom) params.push(`dateFrom: "${dateFrom}"`);
    if (dateTo) params.push(`dateTo: "${dateTo}"`);
    if (agentId) params.push(`agentId: "${agentId}"`);
    if (paaId) params.push(`paaId: "${paaId}"`);
    return params;
  }, [filters, selectedReport]);

  const fetchReports = useCallback(() => {
    dispatch(fetchGrievanceReports(modulesManager, queryParams));
  }, [dispatch, modulesManager, queryParams]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const columns = useMemo(() => reportColumns(selectedReport, intl), [intl, selectedReport]);
  const reportTitle = useMemo(
    () =>
      `${formatMessage(intl, MODULE_NAME, "grievanceReport.title")} - ${reportLabel(
        selectedReport,
        intl,
      )}`,
    [intl, selectedReport],
  );
  const handlePdfExport = useCallback(async () => {
    if (!reports || reports.length === 0) {
      setExportError(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
      return;
    }

    try {
      setIsExporting(true);

      const response = await dispatch(fetchGrievanceReportsForExport(modulesManager, queryParams));
      const graphQLErrors = response?.payload?.errors;
      if (graphQLErrors?.length) {
        throw new Error(
          graphQLErrors
            .map((error) => error.message)
            .filter(Boolean)
            .join(", "),
        );
      }

      const responseRows = response?.payload?.data?.grievanceReports;
      const exportRows = Array.isArray(responseRows) ? responseRows : reports;

      if (!exportRows || exportRows.length === 0) {
        throw new Error(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
      }

      await exportReport(EXPORT_FORMATS.PDF, reportTitle, selectedReport, columns, exportRows);
      setExportError(null);
      setIsExporting(false);
    } catch (error) {
      setExportError(
        error.message || formatMessage(intl, MODULE_NAME, "grievanceReport.exportError"),
      );
      setIsExporting(false);
    }
  }, [columns, dispatch, intl, modulesManager, queryParams, reportTitle, reports, selectedReport]);

  const exportDisabled =
    fetchingReports || isExporting || reports.length === 0 || !rights.includes(RIGHT_TICKET_SEARCH);

  return (
    <Paper className={classes.paper}>
      <Grid container className={classes.paperHeader}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">
            {formatMessage(intl, MODULE_NAME, "grievanceReport.title")}
          </Typography>
        </Grid>
        <Grid item xs={12} md={8} className={classes.actions}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={fetchReports}
            disabled={fetchingReports}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.run")}
          </Button>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() =>
              exportReport(EXPORT_FORMATS.CSV, reportTitle, selectedReport, columns, reports)
            }
            disabled={exportDisabled}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.exportCsv")}
          </Button>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() =>
              exportReport(EXPORT_FORMATS.EXCEL, reportTitle, selectedReport, columns, reports)
            }
            disabled={exportDisabled}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.exportExcel")}
          </Button>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handlePdfExport}
            disabled={exportDisabled}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.downloadPdf")}
          </Button>
        </Grid>
      </Grid>

      <Grid container className={classes.item}>
        <TicketReportFilter filters={filters} onChangeFilters={onChangeFilters} />
      </Grid>

      <ProgressOrError progress={fetchingReports} error={errorReports} />

      <Table size="small" className={classes.table}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.label} className={classes.reportCell}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.length === 0 && !fetchingReports ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={`${classes.reportCell} ${classes.emptyRow}`}
              >
                {formatMessage(intl, MODULE_NAME, "grievanceReport.noResults")}
              </TableCell>
            </TableRow>
          ) : (
            reports.map((row, rowIndex) => (
              <TableRow key={`${row.report}-${row.ticketId || row.label || rowIndex}`}>
                {columns.map((column) => (
                  <TableCell key={column.label} className={classes.reportCell}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {exportError && (
        <Dialog open={!!exportError} fullWidth maxWidth="sm">
          <DialogTitle>{formatMessage(intl, MODULE_NAME, "grievanceReport.error")}</DialogTitle>
          <DialogContent>{exportError}</DialogContent>
          <DialogActions>
            <Button onClick={() => setExportError(null)} color="primary" variant="contained">
              {formatMessage(intl, MODULE_NAME, "grievanceReport.ok")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}

const mapStateToProps = (state) => ({
  reports: state.grievanceSocialProtection.grievanceReports || [],
  fetchingReports: state.grievanceSocialProtection.fetchingGrievanceReports,
  errorReports: state.grievanceSocialProtection.errorGrievanceReports,
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(TicketReportSearcher)))),
);
