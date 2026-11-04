import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Button, FormControlLabel, Grid, MenuItem, Switch, TextField, Typography } from "@material-ui/core";
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
import { normalizeDate, normalizeId, parseLocationId } from "../TicketReportSearcher";
import {
  closureByPaaData,
  dimensionData,
  paaLeagueData,
  paaWithoutGrievancesData,
  sectionRows,
  statusByDimensionData,
  summaryKpis,
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
  TrendChart,
  WidgetCard,
  formatNumber,
} from "./DashboardWidgets";

const EMPTY_SECTIONS = [];

const useStyles = makeStyles((theme) => ({
  root: { padding: theme.spacing(2) },
  heading: { fontWeight: 700, marginBottom: theme.spacing(0.5) },
  intro: { color: theme.palette.text.secondary, marginBottom: theme.spacing(2) },
  filters: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
  },
  filterItem: { padding: theme.spacing(1) },
  applyItem: { padding: theme.spacing(1), display: "flex", alignItems: "flex-end" },
}));

// Grid width of each widget at md and up; every widget is full width on phones.
const WIDGET_WIDTH = {
  kpis: 12,
  trend: 8,
  resolutionStatus: 4,
  category: 6,
  channel: 6,
  paaLeague: 12,
  closureByPaa: 8,
  coverageGap: 4,
};

// Display order (the filter bar is shared by all of them).
const WIDGET_ORDER = ["kpis", "trend", "resolutionStatus", "category", "channel", "paaLeague", "closureByPaa", "coverageGap"];

const toISODate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const defaultFilters = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  return {
    dateFrom: { id: "dateFrom", value: toISODate(from) },
    dateTo: { id: "dateTo", value: toISODate(today) },
    period: { id: "period", value: "MONTH" },
  };
};

// Same filter semantics as the report pages: date range, agent and PAA.
const buildParams = (filters) => {
  const params = [`reports: [${GRIEVANCE_DASHBOARD_REPORTS.map((report) => `"${report}"`).join(", ")}]`];
  const dateFrom = normalizeDate(filters.dateFrom?.value);
  const dateTo = normalizeDate(filters.dateTo?.value);
  const agentId = normalizeId(filters.agent?.value);
  const paaId = parseLocationId(filters);
  const period = filters.period?.value;
  if (dateFrom) params.push(`dateFrom: "${dateFrom}"`);
  if (dateTo) params.push(`dateTo: "${dateTo}"`);
  if (agentId) params.push(`agentId: "${agentId}"`);
  if (paaId) params.push(`paaId: "${paaId}"`);
  if (period) params.push(`period: "${period}"`);
  return params;
};

const OPEN_KEYS = ["openCount", "assignedCount", "reassignedCount", "inProgressCount", "escalatedCount"];

function GrievanceDashboard() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage: t } = useTranslations(MODULE_NAME, modulesManager);

  const { fetching, error, sections } = useSelector(
    (state) => ({
      fetching: state.grievanceSocialProtection?.fetchingGrievanceDashboard,
      error: state.grievanceSocialProtection?.errorGrievanceDashboard,
      sections: state.grievanceSocialProtection?.grievanceDashboard || EMPTY_SECTIONS,
    }),
    shallowEqual,
  );

  const [filters, setFilters] = useState(defaultFilters);
  const [stacked, setStacked] = useState({ category: false, channel: false });

  const onChangeFilters = useCallback((updates) => {
    setFilters((previous) => {
      const next = { ...previous };
      updates.forEach(({ id, value, filter }) => {
        if (!id) return;
        if (value === null || value === undefined || value === "") delete next[id];
        else next[id] = { id, value, filter };
      });
      return next;
    });
  }, []);
  const setFilter = (id) => (value) => onChangeFilters([{ id, value }]);

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

  const toggle = (id) => (
    <FormControlLabel
      control={
        <Switch
          size="small"
          color="primary"
          checked={stacked[id]}
          onChange={(event) => setStacked((current) => ({ ...current, [id]: event.target.checked }))}
        />
      }
      label={<Typography variant="caption">{t("grievanceDashboard.byStatus")}</Typography>}
    />
  );

  const widgets = useMemo(() => {
    const rows = (report) => sectionRows(sections, report);
    const summary = summaryKpis(rows("SUMMARY"));
    const openTotal = summary ? OPEN_KEYS.reduce((total, key) => total + (summary[key] || 0), 0) : null;
    const resolvedWithTimeline = summary ? (summary.resolvedOnTimeCount || 0) + (summary.resolvedLateCount || 0) : 0;
    const statusLabel = (key) => t(key);

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
              {
                id: "overdue",
                label: t("grievanceDashboard.kpi.overdue"),
                value: formatNumber(summary.overdueCount),
                color: STATUS_COLORS.escalatedCount,
                caption: t("grievanceDashboard.kpi.overdueCaption"),
              },
              {
                id: "avgDays",
                label: t("grievanceDashboard.kpi.averageClosureDays"),
                value: formatNumber(summary.averageClosureDays),
                color: "#9A60B4",
              },
              {
                id: "onTime",
                label: t("grievanceDashboard.kpi.onTimeRate"),
                value:
                  summary.onTimeRate === null || summary.onTimeRate === undefined
                    ? "—"
                    : `${formatNumber(summary.onTimeRate)}%`,
                color: STATUS_COLORS.closedCount,
                caption: `${formatNumber(summary.resolvedOnTimeCount)} / ${formatNumber(resolvedWithTimeline)}`,
              },
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
      category: stacked.category
        ? {
            data: statusByDimensionData(rows("STATUS_BY_CATEGORY"), "category"),
            render: (data) => <StackedStatusChart data={data} statusLabel={statusLabel} />,
          }
        : {
            data: dimensionData(rows("CATEGORY"), "category"),
            render: (data) => <HorizontalBarChart data={data} valueLabel={t("grievanceDashboard.series.grievances")} />,
          },
      channel: stacked.channel
        ? {
            data: statusByDimensionData(rows("STATUS_BY_CHANNEL"), "channel"),
            render: (data) => <StackedStatusChart data={data} statusLabel={statusLabel} />,
          }
        : {
            data: dimensionData(rows("CHANNEL"), "channel", { dropEmpty: true }),
            render: (data) => <DonutChart data={data} />,
          },
      resolutionStatus: {
        data: dimensionData(rows("RESOLUTION_STATUS"), "status"),
        render: (data) => (
          <HorizontalBarChart data={data} valueLabel={t("grievanceDashboard.series.grievances")} nameWidth={100} />
        ),
      },
      paaLeague: {
        data: paaLeagueData(rows("STATUS_BY_PAA"), rows("OVERDUE_BY_PAA")),
        render: (data) => (
          <SimpleTable
            maxHeight={420}
            columns={[
              { key: "region", label: t("grievanceDashboard.column.region") },
              { key: "district", label: t("grievanceDashboard.column.district") },
              { key: "filed", label: t("grievanceDashboard.column.filed"), numeric: true },
              { key: "open", label: t("grievanceDashboard.column.open"), numeric: true },
              { key: "overdue", label: t("grievanceDashboard.column.overdue"), numeric: true },
              { key: "maxOverdueDays", label: t("grievanceDashboard.column.maxOverdueDays"), numeric: true },
            ]}
            rows={data}
          />
        ),
      },
      closureByPaa: {
        data: closureByPaaData(rows("CLOSURE_TIMELINE_BY_PAA")),
        render: (data) => (
          <HorizontalBarChart
            data={data}
            dataKey="averageDays"
            valueLabel={t("grievanceDashboard.series.averageDays")}
            color={CATEGORICAL_COLORS[3]}
          />
        ),
      },
      coverageGap: {
        data: paaWithoutGrievancesData(rows("PAA_WITHOUT_GRIEVANCES")),
        isEmpty: !sections.length,
        render: (data) => (
          <NameList
            total={data.length}
            totalLabel={t("grievanceDashboard.coverageGap.caption")}
            namesLabel={t("grievanceDashboard.coverageGap.names")}
            names={data}
          />
        ),
      },
    };
    // `t` is stable for a given locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, stacked]);

  const widgetById = Object.fromEntries(GRIEVANCE_DASHBOARD_WIDGETS.map((widget) => [widget.id, widget]));

  return (
    <div className={classes.root}>
      <Typography variant="h5" className={classes.heading}>
        {t("grievanceDashboard.title")}
      </Typography>
      <Typography className={classes.intro}>{t("grievanceDashboard.intro")}</Typography>

      <Grid container className={classes.filters}>
        <Grid item xs={12} sm={6} md={3} className={classes.filterItem}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module={MODULE_NAME}
            label="grievanceReport.dateFrom"
            value={filters.dateFrom?.value ?? null}
            onChange={setFilter("dateFrom")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.filterItem}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module={MODULE_NAME}
            label="grievanceReport.dateTo"
            value={filters.dateTo?.value ?? null}
            onChange={setFilter("dateTo")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.filterItem}>
          <PublishedComponent
            pubRef="admin.UserPicker"
            module={MODULE_NAME}
            label={t("grievanceReport.agent")}
            value={filters.agent?.value ?? null}
            withNull
            onChange={setFilter("agent")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.filterItem}>
          <TextField
            select
            fullWidth
            label={t("grievanceDashboard.period")}
            value={filters.period?.value || "MONTH"}
            onChange={(event) => setFilter("period")(event.target.value)}
          >
            {GRIEVANCE_DASHBOARD_PERIODS.map((period) => (
              <MenuItem key={period} value={period}>
                {t(`grievanceDashboard.period.${period}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={10} className={classes.filterItem}>
          <PublishedComponent
            pubRef="location.DetailedLocationFilter"
            withNull
            filters={filters}
            onChangeFilters={onChangeFilters}
            anchor="paa"
          />
        </Grid>
        <Grid item xs={12} md={2} className={classes.applyItem}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={!!fetching}
          >
            {t("grievanceDashboard.apply")}
          </Button>
        </Grid>
      </Grid>

      <ProgressOrError progress={fetching} error={error} />

      {!fetching && !error && (
        <Grid container spacing={2}>
          {WIDGET_ORDER.map((id) => {
            const widget = widgetById[id];
            const config = widgets[id];
            const { data } = config;
            const isEmpty = config.isEmpty ?? (Array.isArray(data) ? data.length === 0 : !data);
            const canStack = Boolean(widget.stackedLinkReport);
            const linkReport = canStack && stacked[id] ? widget.stackedLinkReport : widget.linkReport;
            return (
              <Grid item xs={12} md={WIDGET_WIDTH[id] || 6} key={id}>
                <WidgetCard
                  title={t(`grievanceDashboard.widget.${id}`)}
                  subtitle={t(`grievanceDashboard.widget.${id}.subtitle${canStack && stacked[id] ? ".stacked" : ""}`)}
                  actions={canStack ? toggle(id) : null}
                  onOpenReport={linkReport ? openReport(linkReport) : null}
                  openReportLabel={t("grievanceDashboard.openReport")}
                  isEmpty={isEmpty}
                  emptyLabel={t("grievanceDashboard.empty")}
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
