import React from "react";
import {
  Button,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_SERIES } from "./dashboardData";

export const CATEGORICAL_COLORS = [
  "#3F6FD8",
  "#E8913A",
  "#3BA272",
  "#9A60B4",
  "#D9534F",
  "#2BA6C4",
  "#C8A415",
  "#8C8C8C",
];

export const STATUS_COLORS = {
  openCount: "#3F6FD8",
  assignedCount: "#9A60B4",
  reassignedCount: "#C77DBA",
  inProgressCount: "#E8913A",
  escalatedCount: "#D9534F",
  closedCount: "#3BA272",
};

const useStyles = makeStyles((theme) => ({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  headerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  title: { fontWeight: 600, fontSize: "1rem" },
  subtitle: { color: theme.palette.text.secondary, fontSize: "0.8rem" },
  body: { flex: 1, minHeight: 0 },
  empty: {
    height: "100%",
    minHeight: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.secondary,
  },
  kpi: {
    padding: theme.spacing(2),
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    height: "100%",
    borderLeft: "4px solid",
  },
  kpiLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
  kpiValue: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.1, marginTop: theme.spacing(0.5) },
  kpiCaption: { fontSize: "0.75rem", color: theme.palette.text.secondary },
  chips: { display: "flex", flexWrap: "wrap", gap: theme.spacing(0.5), maxHeight: 240, overflowY: "auto" },
  bigNumber: { fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 },
  tableWrap: { overflow: "auto" },
  numberCell: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
}));

const formatNumber = (value) =>
  typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—";

export function WidgetCard({
  title,
  subtitle,
  actions,
  onOpenReport,
  openReportLabel,
  isEmpty,
  emptyLabel,
  children,
}) {
  const classes = useStyles();
  return (
    <Paper className={classes.card}>
      <div className={classes.header}>
        <div>
          <Typography className={classes.title}>{title}</Typography>
          {subtitle && <Typography className={classes.subtitle}>{subtitle}</Typography>}
        </div>
        <div className={classes.headerActions}>
          {actions}
          {onOpenReport && (
            <Button size="small" color="primary" endIcon={<OpenInNewIcon fontSize="small" />} onClick={onOpenReport}>
              {openReportLabel}
            </Button>
          )}
        </div>
      </div>
      <div className={classes.body}>{isEmpty ? <div className={classes.empty}>{emptyLabel}</div> : children}</div>
    </Paper>
  );
}

export function KpiTiles({ tiles }) {
  const classes = useStyles();
  return (
    <Grid container spacing={2}>
      {tiles.map((tile) => (
        <Grid item xs={6} sm={4} md={3} key={tile.id}>
          <Paper className={classes.kpi} style={{ borderLeftColor: tile.color }}>
            <Typography className={classes.kpiLabel}>{tile.label}</Typography>
            <Typography className={classes.kpiValue}>{tile.value}</Typography>
            {tile.caption && <Typography className={classes.kpiCaption}>{tile.caption}</Typography>}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export function TrendChart({ data, receivedLabel, resolvedLabel }) {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="received" name={receivedLabel} fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="resolved"
          name={resolvedLabel}
          stroke={STATUS_COLORS.closedCount}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({ data, dataKey = "value", valueLabel, color, nameWidth = 150 }) {
  const theme = useTheme();
  const height = Math.max(160, data.length * 34 + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={nameWidth} tick={{ fontSize: 12 }} interval={0} />
        <Tooltip />
        <Bar
          dataKey={dataKey}
          name={valueLabel}
          fill={color || theme.palette.primary.main}
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedStatusChart({ data, statusLabel, nameWidth = 150 }) {
  const height = Math.max(180, data.length * 34 + 60);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={nameWidth} tick={{ fontSize: 12 }} interval={0} />
        <Tooltip />
        <Legend />
        {STATUS_SERIES.map(({ key, label }) => (
          <Bar key={key} dataKey={key} name={statusLabel(label)} stackId="status" fill={STATUS_COLORS[key]} barSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, colorFor }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorFor ? colorFor(entry, index) : CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleTable({ columns, rows, maxHeight }) {
  const classes = useStyles();
  return (
    <div className={classes.tableWrap} style={maxHeight ? { maxHeight } : undefined}>
      <Table size="small" stickyHeader={!!maxHeight}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} className={column.numeric ? classes.numberCell : undefined}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key || index}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.numeric ? classes.numberCell : undefined}>
                  {column.numeric ? formatNumber(row[column.key]) : row[column.key] ?? "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function NameList({ total, totalLabel, names, namesLabel }) {
  const classes = useStyles();
  return (
    <div>
      <Typography className={classes.bigNumber}>{formatNumber(total)}</Typography>
      <Typography className={classes.kpiCaption} gutterBottom>
        {totalLabel}
      </Typography>
      {names.length > 0 && namesLabel && (
        <Typography className={classes.kpiCaption} gutterBottom>
          {namesLabel}
        </Typography>
      )}
      <div className={classes.chips}>
        {names.map((name) => (
          <Chip key={name} label={name} size="small" variant="outlined" />
        ))}
      </div>
    </div>
  );
}

export { formatNumber };
