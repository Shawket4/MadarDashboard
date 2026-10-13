import { defineListSearch, param } from "@/data/scope/list-search";

/** Dawam page state, in the URL (see data/scope/list-search.ts). */

/** Absent week = this week; `branch` is the hand-picked one when the top bar says "All branches". */
export const scheduleSearch = defineListSearch("/staff/schedule", {
  week: param.date(),
  coverage: param.bool(false, { keepsPage: true }),
  branch: param.string(),
});

/** `month` = an older payroll period opened from its banner or History; absent = the current one. */
export const payrollSearch = defineListSearch("/staff/payroll", {
  tab: param.enum(["payslips", "lines", "advances", "expenses", "history"], "payslips", { keepsPage: true }),
  month: param.string(),
});

/** Absent from/to = this pay period; absent tab = the first one this person may see. */
export const staffReportsSearch = defineListSearch("/staff/reports", {
  from: param.date(),
  to: param.date(),
  tab: param.enum(["attendance", "labour", "payroll", "advances", ""], "", { keepsPage: true }),
});

export const approvalsSearch = defineListSearch("/staff/approvals", {
  section: param.enum(["all", "requests", "money", "shifts"], "all", { keepsPage: true }),
});
