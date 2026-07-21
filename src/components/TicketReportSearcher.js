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
import TableChartIcon from "@material-ui/icons/TableChart";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { ProgressOrError, decodeId, formatMessage, withModulesManager } from "@openimis/fe-core";
import {
  GRIEVANCE_REPORT_OPTIONS,
  GRIEVANCE_REPORT_STATUS_ORDER,
  GRIEVANCE_REPORT_TYPES,
  MODULE_NAME,
  PAA_GRIEVANCE_FILTER_TYPES,
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
      minWidth: 900,
    },
    tableContainer: {
      overflowX: "auto",
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
    value: GRIEVANCE_REPORT_TYPES.PAA_SUMMARY,
  },
  paaGrievanceFilter: {
    id: "paaGrievanceFilter",
    value: PAA_GRIEVANCE_FILTER_TYPES.WITHOUT_GRIEVANCE,
  },
  grievanceCount: {
    id: "grievanceCount",
    value: 1,
  },
};

const REPORT_STATUS_ALIASES = {
  RECEIVED: "RECEIVED",
  Received: "RECEIVED",
  UNRESOLVED: "UNRESOLVED",
  Unresolved: "UNRESOLVED",
  CLOSED: "CLOSED",
  Closed: "CLOSED",
};

function orderReportRows(report, rows) {
  if (report !== GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS || !Array.isArray(rows)) {
    return rows || [];
  }

  const statusRanks = new Map(
    GRIEVANCE_REPORT_STATUS_ORDER.map((status, index) => [status, index]),
  );
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftStatus = REPORT_STATUS_ALIASES[left.row.status || left.row.label];
      const rightStatus = REPORT_STATUS_ALIASES[right.row.status || right.row.label];
      const leftRank = statusRanks.has(leftStatus) ? statusRanks.get(leftStatus) : Number.MAX_VALUE;
      const rightRank = statusRanks.has(rightStatus)
        ? statusRanks.get(rightStatus)
        : Number.MAX_VALUE;
      return leftRank - rightRank || left.index - right.index;
    })
    .map(({ row }) => row);
}

function resolveReportType(report) {
  return Object.values(GRIEVANCE_REPORT_TYPES).includes(report)
    ? report
    : GRIEVANCE_REPORT_TYPES.PAA_SUMMARY;
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
    values.find(
      ({ id, value }) =>
        id?.toLowerCase().includes("paa") && !id.toLowerCase().includes("grievance") && value,
    ) ||
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
  return value?.value || value || GRIEVANCE_REPORT_TYPES.PAA_SUMMARY;
}

function normalizeNonNegativeInteger(value) {
  const normalizedValue = value?.value ?? value;
  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === "") {
    return 0;
  }
  const parsedValue = Number.parseInt(normalizedValue, 10);
  return Number.isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
}

function reportLabel(report, intl) {
  const reportOption = GRIEVANCE_REPORT_OPTIONS.find((option) => option.value === report);
  return reportOption ? formatMessage(intl, MODULE_NAME, reportOption.label) : report;
}

function reportHeading(report, intl, filters) {
  const headingIds = {
    [GRIEVANCE_REPORT_TYPES.PAA_SUMMARY]: "grievanceReport.title.paaSummary",
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA]: "grievanceReport.title.statusByPaa",
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY]: "grievanceReport.title.statusByCategory",
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL]: "grievanceReport.title.statusByChannel",
    [GRIEVANCE_REPORT_TYPES.CUSTOM]: "grievanceReport.title.custom",
  };
  const headingId = headingIds[report];
  let heading = headingId ? formatMessage(intl, MODULE_NAME, headingId) : reportLabel(report, intl);

  if (report === GRIEVANCE_REPORT_TYPES.CUSTOM) {
    const dateFrom = normalizeDate(filters.dateFrom?.value);
    const dateTo = normalizeDate(filters.dateTo?.value);
    if (dateFrom && dateTo) heading = `${heading} between ${dateFrom} and ${dateTo}`;
  }
  return heading;
}

function reportColumns(report, intl) {
  const t = (id) => formatMessage(intl, MODULE_NAME, id);
  const serialColumn = {
    label: t("grievanceReport.serialNumber"),
    render: (row, rowIndex) => rowIndex + 1,
  };
  const statusColumns = [
    { label: t("grievanceReport.grievancesFiled"), render: (row) => row.grievancesFiled },
    { label: t("grievanceReport.open"), render: (row) => row.openCount },
    { label: t("grievanceReport.assigned"), render: (row) => row.assignedCount },
    { label: t("grievanceReport.reassigned"), render: (row) => row.reassignedCount },
    { label: t("grievanceReport.inProgress"), render: (row) => row.inProgressCount },
    { label: t("grievanceReport.closed"), render: (row) => row.closedCount },
    { label: t("grievanceReport.escalated"), render: (row) => row.escalatedCount },
  ];

  const aggregateColumns = {
    [GRIEVANCE_REPORT_TYPES.PAA_SUMMARY]: [
      serialColumn,
      { label: t("grievanceReport.regionName"), render: (row) => row.regionName },
      {
        label: t("grievanceReport.districtName"),
        render: (row) => row.districtName || row.paaName,
      },
      {
        label: t("grievanceReport.numberOfGrievances"),
        render: (row) => row.grievancesFiled ?? row.count,
      },
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA]: [
      serialColumn,
      {
        label: t("grievanceReport.paa"),
        render: (row) => row.districtName || row.paaName,
      },
      { label: t("grievanceReport.category"), render: (row) => row.category },
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY]: [
      serialColumn,
      { label: t("grievanceReport.category"), render: (row) => row.category },
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL]: [
      serialColumn,
      { label: t("grievanceReport.channel"), render: (row) => row.channel },
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.CUSTOM]: [
      serialColumn,
      {
        label: t("grievanceReport.districtName"),
        render: (row) => row.districtName || row.paaName,
      },
      { label: t("grievanceReport.category"), render: (row) => row.category },
      { label: t("grievanceReport.grievancesTitle"), render: (row) => row.ticketTitle },
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.CATEGORY]: [
      serialColumn,
      { label: t("grievanceReport.category"), render: (row) => row.category || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES]: [
      serialColumn,
      {
        label: t("grievanceReport.paa"),
        render: (row) => row.districtName || row.paaName || row.label,
      },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.CHANNEL]: [
      serialColumn,
      { label: t("grievanceReport.channel"), render: (row) => row.channel || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS]: [
      serialColumn,
      { label: t("grievanceReport.status"), render: (row) => row.status || row.label },
      { label: t("grievanceReport.count"), render: (row) => row.count },
    ],
    [GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA]: [
      serialColumn,
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
    serialColumn,
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
  const [loadedReports, setLoadedReports] = useState(null);

  const selectedReport = normalizeReport(filters.report?.value);

  useEffect(() => {
    setLoadedReports(null);
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
    const paaGrievanceFilter =
      filters.paaGrievanceFilter?.value?.value ||
      filters.paaGrievanceFilter?.value ||
      PAA_GRIEVANCE_FILTER_TYPES.WITHOUT_GRIEVANCE;
    const grievanceCount = normalizeNonNegativeInteger(filters.grievanceCount?.value);

    if (dateFrom) params.push(`dateFrom: "${dateFrom}"`);
    if (dateTo) params.push(`dateTo: "${dateTo}"`);
    if (agentId) params.push(`agentId: "${agentId}"`);
    if (paaId) params.push(`paaId: "${paaId}"`);
    if (selectedReport === GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES) {
      params.push(`paaGrievanceFilter: "${paaGrievanceFilter}"`);
      if (
        paaGrievanceFilter === PAA_GRIEVANCE_FILTER_TYPES.LESS_THAN ||
        paaGrievanceFilter === PAA_GRIEVANCE_FILTER_TYPES.MORE_THAN
      ) {
        params.push(`grievanceCount: ${grievanceCount}`);
      }
    }
    return params;
  }, [filters, selectedReport]);

  const fetchReports = useCallback(async () => {
    const response = await dispatch(fetchGrievanceReports(modulesManager, queryParams));
    const responseRows = response?.payload?.data?.grievanceReports;
    if (Array.isArray(responseRows)) setLoadedReports(responseRows);
  }, [dispatch, modulesManager, queryParams]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const columns = useMemo(() => reportColumns(selectedReport, intl), [intl, selectedReport]);
  const orderedReports = useMemo(
    () => orderReportRows(selectedReport, loadedReports ?? reports),
    [loadedReports, reports, selectedReport],
  );
  const reportTitle = useMemo(
    () => reportHeading(selectedReport, intl, filters),
    [filters, intl, selectedReport],
  );
  const handleExport = useCallback(
    async (format) => {
      if (orderedReports.length === 0) {
        setExportError(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
        return;
      }

      try {
        setIsExporting(true);

        const response = await dispatch(
          fetchGrievanceReportsForExport(modulesManager, queryParams),
        );
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
        const exportRows = orderReportRows(
          selectedReport,
          Array.isArray(responseRows) ? responseRows : orderedReports,
        );

        if (!exportRows || exportRows.length === 0) {
          throw new Error(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
        }

        await exportReport(format, reportTitle, selectedReport, columns, exportRows);
        setExportError(null);
        setIsExporting(false);
      } catch (error) {
        setExportError(
          error.message || formatMessage(intl, MODULE_NAME, "grievanceReport.exportError"),
        );
        setIsExporting(false);
      }
    },
    [
      columns,
      dispatch,
      intl,
      modulesManager,
      orderedReports,
      queryParams,
      reportTitle,
      selectedReport,
    ],
  );

  const exportDisabled =
    fetchingReports ||
    isExporting ||
    orderedReports.length === 0 ||
    !rights.includes(RIGHT_TICKET_SEARCH);

  return (
    <Paper className={classes.paper}>
      <Grid container className={classes.paperHeader}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">{reportTitle}</Typography>
        </Grid>
        <Grid item xs={12} md={8} className={classes.actions}>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => handleExport(EXPORT_FORMATS.CSV)}
            disabled={exportDisabled}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.exportCsv")}
          </Button>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() => handleExport(EXPORT_FORMATS.EXCEL)}
            disabled={exportDisabled}
          >
            {formatMessage(intl, MODULE_NAME, "grievanceReport.exportExcel")}
          </Button>
          <Button
            className={classes.exportButton}
            color="primary"
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleExport(EXPORT_FORMATS.PDF)}
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

      <div className={classes.tableContainer}>
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
            {orderedReports.length === 0 && !fetchingReports ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={`${classes.reportCell} ${classes.emptyRow}`}
                >
                  {formatMessage(intl, MODULE_NAME, "grievanceReport.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              orderedReports.map((row, rowIndex) => (
                <TableRow key={`${row.report}-${row.ticketId || row.label || "row"}-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell key={column.label} className={classes.reportCell}>
                      {column.render(row, rowIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
