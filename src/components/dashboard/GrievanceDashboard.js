import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Button, Grid, MenuItem, TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import RefreshIcon from "@material-ui/icons/Refresh";
import {
  ProgressOrError,
  PublishedComponent,
  historyPush,
  useHistory,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";
import { fetchGrievanceDashboard } from "../../actions";
import {
  GRIEVANCE_DASHBOARD_PERIODS,
  GRIEVANCE_DASHBOARD_REPORTS,
  GRIEVANCE_DASHBOARD_WIDGETS,
  MODULE_NAME,
} from "../../constants";
import {
  closureByPaaData,
  closureTimelinessData,
  dimensionData,
  overdueByPaaData,
  paaSummaryData,
  paaWithoutGrievancesData,
  sectionRows,
  statusByDimensionData,
  statusByPaaData,
  summaryKpis,
  topIssuesData,
  trendData,
} from "./dashboardData";
import {
  CATEGORICAL_COLORS,
  DonutChart,
  HorizontalBarChart,
  KpiTiles,
  NameList,
  SimpleTable,
  STATUS_COLORS,
  StackedStatusChart,
  TIMELINE_COLORS,
  TrendChart,
  WidgetCard,
  formatNumber,
} from "./DashboardWidgets";

const EMPTY_SECTIONS = [];

const useStyles = makeStyles((theme) => ({
  root: { padding: theme.spacing(2) },
  heading: { fontWeight: 700, marginBottom: theme.spacing(0.5) },
  intro: { color: theme.palette.text.secondary, marginBottom: theme.spacing(2) },
  filters: { marginBottom: theme.spacing(2), alignItems: "flex-end" },
}));

// Grid width of each widget at md and up; all widgets are full width on phones.
const WIDGET_WIDTH = {
  kpis: 12,
  trend: 8,
  resolutionStatus: 4,
  category: 6,
  statusByCategory: 6,
  channel: 6,
  statusByChannel: 6,
  closureTimeliness: 4,
  closureByPaa: 8,
  paaSummary: 6,
  overdueByPaa: 6,
  statusByPaa: 8,
  paaWithoutGrievances: 4,
  topIssues: 12,
};

const toISODate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const defaultFilters = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  return { dateFrom: toISODate(from), dateTo: toISODate(today), period: "MONTH" };
};

const buildParams = ({ dateFrom, dateTo, period }) => {
  const params = [`reports: [${GRIEVANCE_DASHBOARD_REPORTS.map((report) => `"${report}"`).join(", ")}]`];
  if (dateFrom) params.push(`dateFrom: "${String(dateFrom).slice(0, 10)}"`);
  if (dateTo) params.push(`dateTo: "${String(dateTo).slice(0, 10)}"`);
  if (period) params.push(`period: "${period}"`);
  return params;
};

function GrievanceDashboard() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const t = formatMessage;

  const { fetching, error, sections } = useSelector((state) => ({
    fetching: state.grievanceSocialProtection?.fetchingGrievanceDashboard,
    error: state.grievanceSocialProtection?.errorGrievanceDashboard,
    sections: state.grievanceSocialProtection?.grievanceDashboard || EMPTY_SECTIONS,
  }), shallowEqual);

  const [filters, setFilters] = useState(defaultFilters);
  const updateFilter = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));

  const load = useCallback(() => {
    dispatch(fetchGrievanceDashboard(modulesManager, buildParams(filters)));
  }, [dispatch, modulesManager, filters]);

  useEffect(() => {
    load();
    // Initial load only; later loads come from the Apply button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openReport = (report) => () =>
    historyPush(modulesManager, history, "grievanceSocialProtection.route.ticketReports", [report]);

  const rows = useCallback((report) => sectionRows(sections, report), [sections]);
  const emptyLabel = t("grievanceDashboard.empty");
  const statusLabel = (key) => t(key);

  const widgets = useMemo(() => {
    const summary = summaryKpis(rows("SUMMARY"));
    const openTotal = summary
      ? ["openCount", "assignedCount", "reassignedCount", "inProgressCount"].reduce(
          (total, key) => total + (summary[key] || 0),
          0,
        )
      : null;
    const closure = rows("CLOSURE_TIMELINE_BY_PAA");
    const paaWithout = paaWithoutGrievancesData(rows("PAA_WITHOUT_GRIEVANCES"));
    const timeliness = closureTimelinessData(closure).map((item) => ({ ...item, name: t(item.label) }));

    return {
      kpis: {
        isEmpty: !summary,
        render: () => (
          <KpiTiles
            tiles={[
              { id: "filed", label: t("grievanceDashboard.kpi.filed"), value: formatNumber(summary.grievancesFiled), color: "#3F6FD8" },
              { id: "open", label: t("grievanceDashboard.kpi.open"), value: formatNumber(openTotal), color: STATUS_COLORS.inProgressCount },
              { id: "closed", label: t("grievanceDashboard.kpi.closed"), value: formatNumber(summary.closedCount), color: STATUS_COLORS.closedCount },
              { id: "escalated", label: t("grievanceDashboard.kpi.escalated"), value: formatNumber(summary.escalatedCount), color: STATUS_COLORS.escalatedCount },
              { id: "overdue", label: t("grievanceDashboard.kpi.overdue"), value: formatNumber(summary.overdueCount), color: STATUS_COLORS.escalatedCount, caption: t("grievanceDashboard.kpi.overdueCaption") },
              {
                id: "onTime",
                label: t("grievanceDashboard.kpi.onTimeRate"),
                value: summary.onTimeRate === null || summary.onTimeRate === undefined ? "—" : `${formatNumber(summary.onTimeRate)}%`,
                color: STATUS_COLORS.closedCount,
                caption: `${formatNumber(summary.resolvedOnTimeCount)} / ${formatNumber((summary.resolvedOnTimeCount || 0) + (summary.resolvedLateCount || 0))}`,
              },
              { id: "avgDays", label: t("grievanceDashboard.kpi.averageClosureDays"), value: formatNumber(summary.averageClosureDays), color: "#9A60B4" },
              { id: "paaWithout", label: t("grievanceDashboard.kpi.paaWithoutGrievances"), value: formatNumber(summary.paaWithoutGrievancesCount), color: "#8C8C8C" },
            ]}
          />
        ),
      },
      trend: {
        data: trendData(rows("TREND")),
        render: (data) => (
          <TrendChart
            data={data}
            receivedLabel={t("grievanceDashboard.series.received")}
            resolvedLabel={t("grievanceDashboard.series.resolved")}
          />
        ),
      },
      resolutionStatus: {
        data: dimensionData(rows("RESOLUTION_STATUS"), "status"),
        render: (data) => (
          <HorizontalBarChart data={data} valueLabel={t("grievanceDashboard.series.grievances")} nameWidth={100} />
        ),
      },
      category: {
        data: dimensionData(rows("CATEGORY"), "category"),
        render: (data) => <HorizontalBarChart data={data} valueLabel={t("grievanceDashboard.series.grievances")} />,
      },
      statusByCategory: {
        data: statusByDimensionData(rows("STATUS_BY_CATEGORY"), "category"),
        render: (data) => <StackedStatusChart data={data} statusLabel={statusLabel} />,
      },
      channel: {
        data: dimensionData(rows("CHANNEL"), "channel", { dropEmpty: true }),
        render: (data) => <DonutChart data={data} />,
      },
      statusByChannel: {
        data: statusByDimensionData(rows("STATUS_BY_CHANNEL"), "channel"),
        render: (data) => <StackedStatusChart data={data} statusLabel={statusLabel} />,
      },
      closureTimeliness: {
        data: timeliness,
        render: (data) => <DonutChart data={data} colorFor={(entry) => TIMELINE_COLORS[entry.key]} />,
      },
      closureByPaa: {
        data: closureByPaaData(closure),
        render: (data) => (
          <HorizontalBarChart
            data={data}
            dataKey="averageDays"
            valueLabel={t("grievanceDashboard.series.averageDays")}
            color={CATEGORICAL_COLORS[3]}
          />
        ),
      },
      paaSummary: {
        data: paaSummaryData(rows("PAA_SUMMARY")),
        render: (data) => <HorizontalBarChart data={data} valueLabel={t("grievanceDashboard.series.grievances")} />,
      },
      overdueByPaa: {
        data: overdueByPaaData(rows("OVERDUE_BY_PAA")),
        render: (data) => (
          <HorizontalBarChart
            data={data}
            valueLabel={t("grievanceDashboard.series.overdue")}
            color={STATUS_COLORS.escalatedCount}
          />
        ),
      },
      statusByPaa: {
        data: statusByPaaData(rows("STATUS_BY_PAA")),
        render: (data) => (
          <SimpleTable
            columns={[
              { key: "name", label: t("grievanceDashboard.column.paa") },
              { key: "region", label: t("grievanceDashboard.column.region") },
              { key: "total", label: t("grievanceDashboard.column.filed"), numeric: true },
              { key: "openCount", label: t("grievanceDashboard.status.open"), numeric: true },
              { key: "inProgressCount", label: t("grievanceDashboard.status.inProgress"), numeric: true },
              { key: "escalatedCount", label: t("grievanceDashboard.status.escalated"), numeric: true },
              { key: "closedCount", label: t("grievanceDashboard.status.closed"), numeric: true },
            ]}
            rows={data}
          />
        ),
      },
      paaWithoutGrievances: {
        data: paaWithout,
        isEmpty: !sections.length,
        render: (data) => (
          <NameList total={data.length} totalLabel={t("grievanceDashboard.paaWithoutGrievances.caption")} names={data} />
        ),
      },
      topIssues: {
        data: topIssuesData(rows("CUSTOM")),
        render: (data) => (
          <SimpleTable
            columns={[
              { key: "title", label: t("grievanceDashboard.column.issue") },
              { key: "category", label: t("grievanceDashboard.column.category") },
              { key: "filed", label: t("grievanceDashboard.column.filed"), numeric: true },
              { key: "closed", label: t("grievanceDashboard.status.closed"), numeric: true },
              { key: "paaCount", label: t("grievanceDashboard.column.paas"), numeric: true },
            ]}
            rows={data}
          />
        ),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, rows]);

  return (
    <div className={classes.root}>
      <Typography variant="h5" className={classes.heading}>
        {t("grievanceDashboard.title")}
      </Typography>
      <Typography className={classes.intro}>{t("grievanceDashboard.intro")}</Typography>

      <Grid container spacing={2} className={classes.filters}>
        <Grid item xs={12} sm={4} md={3}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module={MODULE_NAME}
            label="grievanceReport.dateFrom"
            value={filters.dateFrom}
            onChange={updateFilter("dateFrom")}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module={MODULE_NAME}
            label="grievanceReport.dateTo"
            value={filters.dateTo}
            onChange={updateFilter("dateTo")}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <TextField
            select
            fullWidth
            label={t("grievanceDashboard.period")}
            value={filters.period}
            onChange={(event) => updateFilter("period")(event.target.value)}
          >
            {GRIEVANCE_DASHBOARD_PERIODS.map((period) => (
              <MenuItem key={period} value={period}>
                {t(`grievanceDashboard.period.${period}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button variant="contained" color="primary" startIcon={<RefreshIcon />} onClick={load} disabled={!!fetching}>
            {t("grievanceDashboard.apply")}
          </Button>
        </Grid>
      </Grid>

      <ProgressOrError progress={fetching} error={error} />

      {!fetching && !error && (
        <Grid container spacing={2}>
          {GRIEVANCE_DASHBOARD_WIDGETS.map((widget) => {
            const config = widgets[widget.id];
            const data = config.data;
            const isEmpty = config.isEmpty ?? (Array.isArray(data) ? data.length === 0 : !data);
            return (
              <Grid item xs={12} md={WIDGET_WIDTH[widget.id] || 6} key={widget.id}>
                <WidgetCard
                  title={t(`grievanceDashboard.widget.${widget.id}`)}
                  subtitle={t(`grievanceDashboard.widget.${widget.id}.subtitle`)}
                  onOpenReport={widget.linkReport ? openReport(widget.linkReport) : null}
                  openReportLabel={t("grievanceDashboard.openReport")}
                  isEmpty={isEmpty}
                  emptyLabel={emptyLabel}
                >
                  {!isEmpty && config.render(data)}
                </WidgetCard>
              </Grid>
            );
          })}
        </Grid>
      )}
    </div>
  );
}

export default GrievanceDashboard;
