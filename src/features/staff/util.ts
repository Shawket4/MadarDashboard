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

/** Attendance status → badge colour. Mirrors the five values the backend's
 *  CHECK constraint allows. */
export const ATTENDANCE_STATUS_CLASS: Record<string, string> = {
  present: "bg-success/15 text-success",
  late: "bg-warning/15 text-warning",
  half_day: "bg-warning/15 text-warning",
  absent: "bg-destructive/15 text-destructive",
  on_leave: "bg-info/15 text-info",
};

/** Request status (leave, late passes, missions, advances) → badge colour. */
export const REQUEST_STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  settled: "bg-muted text-muted-foreground",
};

/** Payroll period status → badge colour. */
export const PERIOD_STATUS_CLASS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generated: "bg-info/15 text-info",
  paid: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};

export const EMPLOYMENT_STATUS_CLASS: Record<string, string> = {
  active: "bg-success/15 text-success",
  suspended: "bg-warning/15 text-warning",
  terminated: "bg-muted text-muted-foreground",
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
  if (minutes === 0) return "0m";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${sign}${h}h ${m}m` : `${sign}${m}m`;
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
