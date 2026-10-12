import { defineListSearch, param } from "@/data/scope/list-search";

/**
 * Staff list state, in the URL (see data/scope/list-search.ts): filters,
 * search, sort and page survive leaving the page and coming back.
 */

export const employeesSearch = defineListSearch("/staff/employees", {
  status: param.enum(["active", "suspended", "terminated", ""], ""),
  dept: param.string(),
  q: param.string(),
  sort: param.sort(),
  page: param.page(),
});

/** Absent from/to = the last seven days, as the page always opened. */
export const attendanceSearch = defineListSearch("/staff/attendance", {
  from: param.date(),
  to: param.date(),
  status: param.enum(["present", "late", "half_day", "absent", "on_leave", ""], ""),
  person: param.string(),
  q: param.string(),
  sort: param.sort(),
  page: param.page(),
});

/** The queue opens on Pending; `all` is every status. */
export const requestsSearch = defineListSearch("/staff/requests", {
  status: param.enum(["pending", "approved", "rejected", "cancelled", "all"], "pending"),
  kind: param.enum(["leave", "late_arrival", "early_departure", "excuse", "mission", "correction", ""], ""),
});

/** Whose rules are open: "" = the business, else a branch id. */
export const rulesSearch = defineListSearch("/staff/rules", {
  for: param.string(),
});
