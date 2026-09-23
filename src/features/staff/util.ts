import { fmtElapsedMs, ltr } from "@/lib/format";
import i18n from "@/i18n";
import type { StatusTone } from "@/components/app/status-pill";
import { queryClient } from "@/data/api/query";

/**
 * Orval derives query keys from the ENDPOINT PATH, not the resource name, so an
 * invalidation predicate has to match `/staff/...` — matching on "employees" or
 * "attendance" alone silently misses and leaves the list stale after a mutation.
 * One prefix helper per sub-tree keeps that in a single place.
 */
const invalidatePrefix = (prefix: string) =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith(prefix),
  });

/** Everything under the staff module. Used after a write that crosses sub-trees
 *  (e.g. generating payroll, which also settles salary advances). */
export const invalidateStaff = () => invalidatePrefix("/staff");

export const invalidateEmployees = () => invalidatePrefix("/staff/employees");
export const invalidateDepartments = () => invalidatePrefix("/staff/departments");
export const invalidateWorkShifts = () => invalidatePrefix("/staff/work-shifts");
export const invalidateSchedules = () => invalidatePrefix("/staff/schedules");
export const invalidateAttendance = () => invalidatePrefix("/staff/attendance");
export const invalidateLeave = () => invalidatePrefix("/staff/leave");
/** Requests live under `/staff/requests`; leave BALANCES still under `/staff/leave`,
 *  so a decision that spends leave has to touch both. */
export const invalidateRequests = () => {
  void invalidatePrefix("/staff/requests");
  return invalidatePrefix("/staff/leave");
};
export const invalidatePayroll = () => invalidatePrefix("/staff/payroll");

/** Attendance status → StatusPill tone. Mirrors the five values the backend's
 *  CHECK constraint allows. */
export const ATTENDANCE_STATUS_TONE: Record<string, StatusTone> = {
  present: "success",
  late: "warning",
  half_day: "warning",
  absent: "danger",
  on_leave: "info",
};

/** Request status (leave, late passes, missions, advances) → StatusPill tone. */
export const REQUEST_STATUS_TONE: Record<string, StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  settled: "neutral",
};

/** Payroll period status → StatusPill tone. */
export const PERIOD_STATUS_TONE: Record<string, StatusTone> = {
  draft: "neutral",
  generated: "info",
  paid: "success",
  closed: "neutral",
};

export const EMPLOYMENT_STATUS_TONE: Record<string, StatusTone> = {
  active: "success",
  suspended: "warning",
  terminated: "neutral",
};

/**
 * Weekday indices follow Postgres `EXTRACT(DOW)`: 0 = Sunday … 6 = Saturday.
 * The backend stores that number verbatim, so the UI must not renumber it to
 * something Monday-first.
 */
export const WEEKDAYS: { value: number; labelKey: string; fallback: string }[] = [
  { value: 0, labelKey: "staff.sun", fallback: "Sun" },
  { value: 1, labelKey: "staff.mon", fallback: "Mon" },
  { value: 2, labelKey: "staff.tue", fallback: "Tue" },
  { value: 3, labelKey: "staff.wed", fallback: "Wed" },
  { value: 4, labelKey: "staff.thu", fallback: "Thu" },
  { value: 5, labelKey: "staff.fri", fallback: "Fri" },
  { value: 6, labelKey: "staff.sat", fallback: "Sat" },
];

/** "7h 25m" from a minute count. Attendance is reported in minutes everywhere;
 *  hours only exist for display. */
export const fmtMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return "—";
  const sign = minutes < 0 ? "\u2212" : "";
  const out = fmtElapsedMs(Math.abs(minutes) * 60_000);
  // fmtElapsedMs isolates Arabic figures; keep the sign inside the isolate.
  return sign ? out.replace(/^(\u2066?)/, `$1${sign}`) : out;
};

/**
 * A span of work in hours and minutes, never days: labour limits are hours
 * (a week is "56h of 48h", not "2d 08h of 2d 00h").
 */
export const fmtHours = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return "—";
  const ar = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const [h, m, sep] = ar ? ["س", "د", " "] : ["h", "m", ""];
  const total = Math.round(Math.abs(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const out = hours === 0 ? `${rest}${sep}${m}` : rest === 0 ? `${hours}${sep}${h}` : `${hours}${sep}${h} ${rest}${sep}${m}`;
  const signed = minutes < 0 ? `\u2212${out}` : out;
  return ar ? ltr(signed) : signed;
};

/** ISO date (yyyy-mm-dd) `n` days from today, for default report ranges. */
export const isoDaysFromToday = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** First and last day of the current month, the default payroll period. */
export const currentMonthRange = (): { start: string; end: string; name: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    start: iso(start),
    end: iso(end),
    name: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
};
