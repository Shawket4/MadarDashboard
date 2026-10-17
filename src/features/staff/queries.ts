import type { AttendanceSummaryParams, GetAttendanceSettingsParams, ListEmployeesParams, ListRequestsParams } from "@/data/api/generated/models";
import type { ListValues } from "@/data/scope/list-search";
import { attendanceSearch, employeesSearch, requestsSearch, rulesSearch } from "./search";
import { isoDaysFromToday, todayIso } from "./util";

/**
 * The staff pages' requests, built in ONE place: the page reads them and the
 * sidebar prefetch (lib/prefetch/staff.ts) warms them from the list's entry
 * values, so both always ask for the same cache key.
 */

export const employeesListParams = (f: ListValues<typeof employeesSearch.spec>): ListEmployeesParams => ({
  employment_status: f.status || undefined,
  department_id: f.dept || undefined,
});

/** Absent from/to = the last seven days. The summary cards read the same window. */
export const attendanceParams = (branchId: string | null, f: ListValues<typeof attendanceSearch.spec>): AttendanceSummaryParams => ({
  from: f.from || isoDaysFromToday(-6),
  to: f.to || todayIso(),
  branch_id: branchId ?? undefined,
  status: f.status || undefined,
  employee_id: f.person || undefined,
});

export const requestsListParams = (f: ListValues<typeof requestsSearch.spec>): ListRequestsParams => ({
  status: f.status === "all" ? undefined : f.status,
  kind: f.kind || undefined,
});

/** "" = the business's own rules, else that branch's. */
export const rulesSettingsParams = (f: ListValues<typeof rulesSearch.spec>): GetAttendanceSettingsParams =>
  f.for ? { branch_id: f.for } : {};
