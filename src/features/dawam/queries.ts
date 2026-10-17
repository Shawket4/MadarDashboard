import { quickRange } from "@/components/inputs";
import type { Authz } from "@/data/authz/use-authz";
import type { ListValues } from "@/data/scope/list-search";
import { Cap } from "@/generated/capabilities";
import { isoDaysFromToday, todayIso } from "@/features/staff/util";
import { scheduleSearch, staffReportsSearch } from "./search";
import { addDays, weekDays, weekStartOf } from "./week";

/**
 * The Dawam pages' requests, built in ONE place: the page reads them and the
 * sidebar prefetch (lib/prefetch/staff.ts) warms them from the list's entry
 * values, so both always ask for the same cache key.
 */

/** Absent week = this week. */
export const scheduleWeek = (f: ListValues<typeof scheduleSearch.spec>): string =>
  weekStartOf(f.week || todayIso());

export function scheduleParams(branchId: string, week: string) {
  const today = todayIso();
  return {
    roster: { branch_id: branchId, from: week, to: weekDays(week)[6] },
    suggestions: { branch_id: branchId, week_start: week },
    upcoming: { branch_id: branchId, from: today, to: addDays(today, 45) },
    fairness: { month: `${week.slice(0, 8)}01` },
  };
}

/** The expense advances tab: one branch's, or every branch's. */
export const expenseAdvancesParams = (branchId: string | null) => (branchId ? { branch_id: branchId } : {});

/** Which Approvals sections this person decides; each list is read only for those. */
export const approvalsCan = (authz: Authz) => ({
  requests: authz.canAny(Cap.hrLeaveEdit, Cap.hrAttendanceEdit),
  advances: authz.can(Cap.hrAdvancesDecide),
  roster: authz.can(Cap.hrScheduleEdit),
  covers: authz.can(Cap.hrShiftCoverConfirm),
  overtime: authz.can(Cap.hrOvertimeApprove),
  payLines: authz.can(Cap.hrPayrollRun),
});

export const approvalsParams = () => ({
  requests: { status: "pending" },
  advances: {},
  swaps: { status: "pending" },
  // A claim can sit on any published week, however far ahead (O-8), and one
  // left undecided past its day stays in the queue too (a -35-day window lost it).
  claims: { from: isoDaysFromToday(-366), to: isoDaysFromToday(366) },
  // Every pending cover and overtime, however old (H2-B5): a 35-day window
  // dropped older ones out of every queue.
  covers: { cover_status: "pending" },
  overtime: { overtime_status: "pending" },
  payLines: { status: "pending" },
});

/** The report tabs this person may open, and the one shown: the picked one, else the first. */
export function staffReportsTabs(picked: string, may: { attendance: boolean; pay: boolean; pos: boolean }) {
  const tabs = [
    may.attendance && "attendance",
    may.pay && may.pos && "labour",
    may.pay && "payroll",
    may.pay && "advances",
  ].filter(Boolean) as string[];
  return { tabs, tab: picked && tabs.includes(picked) ? picked : tabs[0] };
}

/** Absent from/to = this pay period. */
export function staffReportsParams(branchId: string | null, f: ListValues<typeof staffReportsSearch.spec>, periodStartDay: number) {
  const range = f.from && f.to ? { from: f.from, to: f.to } : quickRange("this_period", { periodStartDay });
  return { from: range.from, to: range.to, branch_id: branchId ?? undefined };
}
