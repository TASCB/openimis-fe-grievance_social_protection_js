import { formatMessage, formatMessageWithValues } from "@openimis/fe-core";
import { MODULE_NAME } from "../constants";

const TIMELINE_STATUS_LABELS = {
  OVERDUE: "tickets.timelineStatus.overdue",
  ON_TIME: "tickets.timelineStatus.onTime",
  RESOLVED_LATE: "tickets.timelineStatus.resolvedLate",
  N_A: "tickets.timelineStatus.notApplicable",
};

export function formatTimelineStatus(intl, status) {
  const messageId = TIMELINE_STATUS_LABELS[status] || TIMELINE_STATUS_LABELS.N_A;
  return formatMessage(intl, MODULE_NAME, messageId);
}

function formatUnit(intl, value, singularId, pluralId) {
  return formatMessageWithValues(intl, MODULE_NAME, value === 1 ? singularId : pluralId, { value });
}

export function formatTimeTaken(intl, seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) {
    return formatMessage(intl, MODULE_NAME, "tickets.timelineStatus.notApplicable");
  }

  const totalSeconds = Math.max(Math.floor(Number(seconds)), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0 && hours > 0) {
    return `${formatUnit(intl, days, "duration.day", "duration.days")} ${formatUnit(
      intl,
      hours,
      "duration.hour",
      "duration.hours",
    )}`;
  }
  if (days > 0) return formatUnit(intl, days, "duration.day", "duration.days");
  if (hours > 0) return formatUnit(intl, hours, "duration.hour", "duration.hours");
  return formatUnit(intl, minutes, "duration.minute", "duration.minutes");
}
