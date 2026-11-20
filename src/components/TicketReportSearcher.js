import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { injectIntl } from "react-intl";
import { Button, Divider, Grid, Menu, MenuItem, Paper, Typography } from "@material-ui/core";
import { withStyles, withTheme } from "@material-ui/core/styles";
import {
  ProgressOrError,
  SearcherPane,
  Table,
  coreAlert,
  decodeId,
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
} from "@openimis/fe-core";
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
    paper: theme.paper.paper,
    paperHeader: theme.paper.header,
    paperHeaderTitle: theme.paper.title,
    paperHeaderAction: { ...theme.paper.action, display: "flex", justifyContent: "flex-end", alignItems: "center" },
    tableContainer: { overflowX: "auto" },
    empty: { padding: theme.spacing(3), textAlign: "center" },
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

export function normalizeId(value) {
  if (!value) return null;
  return safeDecodeId(value.id || value.uuid || value);
}

export function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function parseLocationId(filters) {
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
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_TYPE]: "grievanceReport.title.statusByType",
    [GRIEVANCE_REPORT_TYPES.CUSTOM]: "grievanceReport.title.custom",
  };
  const headingId = headingIds[report];
  let heading = headingId ? formatMessage(intl, MODULE_NAME, headingId) : reportLabel(report, intl);

  if (report === GRIEVANCE_REPORT_TYPES.CUSTOM) {
    const from = normalizeDate(filters.dateFrom?.value);
    const to = normalizeDate(filters.dateTo?.value);
    if (from && to) {
      heading = formatMessageWithValues(intl, MODULE_NAME, "grievanceReport.title.customBetween", { from, to });
    }
  }
  return heading;
}

function reportColumns(report, intl) {
  const col = (id, render, numeric = false) => ({ id, label: formatMessage(intl, MODULE_NAME, id), render, numeric });
  const statusColumns = [
    col("grievanceReport.grievancesFiled", (row) => row.grievancesFiled, true),
    col("grievanceReport.open", (row) => row.openCount, true),
    col("grievanceReport.assigned", (row) => row.assignedCount, true),
    col("grievanceReport.reassigned", (row) => row.reassignedCount, true),
    col("grievanceReport.inProgress", (row) => row.inProgressCount, true),
    col("grievanceReport.closed", (row) => row.closedCount, true),
    col("grievanceReport.escalated", (row) => row.escalatedCount, true),
  ];
  const paaName = (row) => row.districtName || row.paaName;

  const aggregateColumns = {
    [GRIEVANCE_REPORT_TYPES.PAA_SUMMARY]: [
      col("grievanceReport.regionName", (row) => row.regionName),
      col("grievanceReport.districtName", paaName),
      col("grievanceReport.numberOfGrievances", (row) => row.grievancesFiled ?? row.count, true),
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_PAA]: [
      col("grievanceReport.paa", paaName),
      col("grievanceReport.category", (row) => row.category),
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CATEGORY]: [
      col("grievanceReport.category", (row) => row.category),
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_CHANNEL]: [
      col("grievanceReport.channel", (row) => row.channel),
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.STATUS_BY_TYPE]: [
      col("grievanceReport.category", (row) => row.category),
      col("grievanceReport.grievanceType", (row) => row.ticketTitle || row.label),
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.CUSTOM]: [
      col("grievanceReport.districtName", paaName),
      col("grievanceReport.category", (row) => row.category),
      col("grievanceReport.grievancesTitle", (row) => row.ticketTitle),
      ...statusColumns,
    ],
    [GRIEVANCE_REPORT_TYPES.CATEGORY]: [
      col("grievanceReport.category", (row) => row.category || row.label),
      col("grievanceReport.count", (row) => row.count, true),
    ],
    [GRIEVANCE_REPORT_TYPES.PAA_WITHOUT_GRIEVANCES]: [
      col("grievanceReport.paa", (row) => row.districtName || row.paaName || row.label),
      col("grievanceReport.count", (row) => row.count, true),
    ],
    [GRIEVANCE_REPORT_TYPES.CHANNEL]: [
      col("grievanceReport.channel", (row) => row.channel || row.label),
      col("grievanceReport.count", (row) => row.count, true),
    ],
    [GRIEVANCE_REPORT_TYPES.RESOLUTION_STATUS]: [
      col("grievanceReport.status", (row) => row.status || row.label),
      col("grievanceReport.count", (row) => row.count, true),
    ],
    [GRIEVANCE_REPORT_TYPES.OVERDUE_BY_PAA]: [
      col("grievanceReport.paa", (row) => row.paaName || row.label),
      col("grievanceReport.count", (row) => row.count, true),
      col("grievanceReport.maxOverdueDays", (row) => formatNumber(row.overdueDays), true),
    ],
  };

  if (aggregateColumns[report]) return aggregateColumns[report];

  return [
    col("tickets.code", (row) => row.ticketCode),
    col("tickets.title", (row) => row.ticketTitle),
    col("grievanceReport.category", (row) => row.category),
    col("grievanceReport.paa", (row) => row.paaName),
    col("grievanceReport.agent", (row) => row.agentName),
    col("grievanceReport.dateReceived", (row) => formatDate(row.dateReceived)),
    col("grievanceReport.dateClosed", (row) => formatDate(row.dateClosed)),
    col("tickets.dueDate", (row) => formatDate(row.dueDate)),
    col("tickets.overdue", (row) => formatTimelineStatus(intl, row.timelineStatus)),
    col("tickets.timeTaken", (row) => formatTimeTaken(intl, row.timeTakenSeconds)),
    col("grievanceReport.closureDays", (row) => formatNumber(row.closureDays), true),
    col("grievanceReport.overdueDays", (row) => formatNumber(row.overdueDays), true),
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
  const initialFilters = useCallback(
    () => ({ ...DEFAULT_FILTERS, report: { id: "report", value: resolveReportType(initialReport) } }),
    [initialReport],
  );
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenu, setExportMenu] = useState(null);
  const [loadedReports, setLoadedReports] = useState(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const shownReport = useRef(initialReport);
  useEffect(() => {
    if (shownReport.current === initialReport) return;
    shownReport.current = initialReport;
    const next = initialFilters();
    setLoadedReports(null);
    setFilters(next);
    setApplied(next);
  }, [initialReport, initialFilters]);

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

  const refresh = useCallback(() => setApplied({ ...filtersRef.current }), []);
  const reset = useCallback(() => {
    const next = initialFilters();
    setFilters(next);
    setApplied(next);
  }, [initialFilters]);

  const selectedReport = normalizeReport(applied.report?.value);

  const queryParams = useMemo(() => {
    const params = [`report: "${selectedReport}"`];
    const dateFrom = normalizeDate(applied.dateFrom?.value);
    const dateTo = normalizeDate(applied.dateTo?.value);
    const agentId = normalizeId(applied.agent?.value);
    const paaId = parseLocationId(applied);
    const paaGrievanceFilter =
      applied.paaGrievanceFilter?.value?.value ||
      applied.paaGrievanceFilter?.value ||
      PAA_GRIEVANCE_FILTER_TYPES.WITHOUT_GRIEVANCE;
    const grievanceCount = normalizeNonNegativeInteger(applied.grievanceCount?.value);

    if (dateFrom) params.push(`dateFrom: "${dateFrom}"`);
    if (dateTo) params.push(`dateTo: "${dateTo}"`);
    if (agentId) params.push(`agentId: "${agentId}"`);
    if (paaId) params.push(`paaId: "${paaId}"`);
    const reporterKind = applied.reporterKind?.value;
    if (reporterKind) params.push(`reporterKind: "${reporterKind}"`);
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
  }, [applied, selectedReport]);

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
    () => reportHeading(selectedReport, intl, applied),
    [applied, intl, selectedReport],
  );

  const showError = useCallback(
    (message) =>
      dispatch(coreAlert(formatMessage(intl, MODULE_NAME, "grievanceReport.error"), message)),
    [dispatch, intl],
  );

  const handleExport = useCallback(
    async (format) => {
      setExportMenu(null);
      if (orderedReports.length === 0) {
        showError(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
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
        const exportRows = orderReportRows(
          selectedReport,
          Array.isArray(responseRows) ? responseRows : orderedReports,
        );
        if (!exportRows || exportRows.length === 0) {
          throw new Error(formatMessage(intl, MODULE_NAME, "grievanceReport.noResults"));
        }
        await exportReport(format, reportTitle, selectedReport, columns, exportRows);
      } catch (error) {
        showError(error.message || formatMessage(intl, MODULE_NAME, "grievanceReport.exportError"));
      } finally {
        setIsExporting(false);
      }
    },
    [columns, dispatch, intl, modulesManager, orderedReports, queryParams, reportTitle, selectedReport, showError],
  );

  const exportDisabled =
    fetchingReports ||
    isExporting ||
    orderedReports.length === 0 ||
    !rights.includes(RIGHT_TICKET_SEARCH);

  const exportFormats = [
    [EXPORT_FORMATS.CSV, "grievanceReport.exportCsv"],
    [EXPORT_FORMATS.EXCEL, "grievanceReport.exportExcel"],
    [EXPORT_FORMATS.PDF, "grievanceReport.exportPdf"],
  ];

  return (
    <>
      <SearcherPane
        module={MODULE_NAME}
        filterPane={<TicketReportFilter filters={filters} onChangeFilters={onChangeFilters} />}
        reset={reset}
        refresh={refresh}
      />
      <Paper className={classes.paper}>
        <Grid container alignItems="center" className={classes.paperHeader}>
          <Grid item xs={8} className={classes.paperHeaderTitle}>
            {formatMessageWithValues(intl, MODULE_NAME, "grievanceReport.resultsTitle", {
              title: reportTitle,
              count: fetchingReports ? "…" : orderedReports.length,
            })}
          </Grid>
          <Grid item xs={4} className={classes.paperHeaderAction}>
            <Button
              color="primary"
              disabled={exportDisabled}
              onClick={(event) => setExportMenu(event.currentTarget)}
            >
              {formatMessage(intl, MODULE_NAME, "grievanceReport.export")}
            </Button>
            <Menu anchorEl={exportMenu} keepMounted open={!!exportMenu} onClose={() => setExportMenu(null)}>
              {exportFormats.map(([format, label]) => (
                <MenuItem key={format} onClick={() => handleExport(format)}>
                  {formatMessage(intl, MODULE_NAME, label)}
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>
        <Divider />
        <ProgressOrError progress={fetchingReports} error={errorReports} />
        {!fetchingReports && orderedReports.length === 0 ? (
          <Typography className={classes.empty} color="textSecondary">
            {formatMessage(intl, MODULE_NAME, "grievanceReport.noResults")}
          </Typography>
        ) : (
          <div className={classes.tableContainer}>
            <Table
              module={MODULE_NAME}
              headers={columns.map((column) => column.id)}
              aligns={columns.map((column) => (column.numeric ? "right" : "left"))}
              itemFormatters={columns.map((column) => (row, rowIndex) => column.render(row, rowIndex))}
              items={orderedReports}
              withPagination={false}
            />
          </div>
        )}
      </Paper>
    </>
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
