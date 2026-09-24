/**
 * The fields the owner's Phase D decisions (24 Sep 2026) add to the API, as
 * the backend's "Contract as built" names them. Every screen reads them
 * through these types, so the generated client can take over in one place.
 */
import { customInstance } from "@/data/api/custom-instance";
import type {
  Adjustment, AttendanceSettings, AuditReport, ComputedPayslip, CurrentPayroll, Decide, Employee, LabourWarning, PresenceRow,
  PutAttendanceSettingsRequest, ReviewAdvance, SalaryAdvance,
} from "@/data/api/generated/models";

/** How a confirmed cover is paid (D5): the coverer's plain minute rate, or the covered block as a full day. */
export type CoverPayMode = "minute_rate" | "full_block";
export const COVER_PAY_MODES: readonly CoverPayMode[] = ["minute_rate", "full_block"];

/** Rules as read: the business's `cover_pay_mode`, or a branch's effective one (listed in `overridden` when it sets its own). */
export type SettingsD = AttendanceSettings & { cover_pay_mode?: string | null };
/** Rules as saved: `cover_pay_mode` like any other branch-overridable rule; `inherit: ["cover_pay_mode"]` drops a branch's. */
export type SettingsPutD = PutAttendanceSettingsRequest & { cover_pay_mode?: CoverPayMode };

export const coverPayOf = (s: SettingsD): CoverPayMode => (s.cover_pay_mode === "full_block" ? "full_block" : "minute_rate");

/**
 * A salary advance (D7): `cap_piastres` is null for someone who may not read
 * the person's salary (the cap is half of it); `within_cap` (outstanding,
 * pending ones included, ≤ cap) is for everyone.
 */
export type AdvanceD = Omit<SalaryAdvance, "cap_piastres"> & { cap_piastres?: number | null; within_cap?: boolean };

/** Where an advance stands against the cap: within/over for everyone, the figures only when the server sends the cap. */
export function capView(a: AdvanceD): { within: boolean | null; owed: number; cap: number | null } {
  const cap = a.cap_piastres ?? null;
  const within = typeof a.within_cap === "boolean" ? a.within_cap : cap != null ? a.outstanding_piastres <= cap : null;
  return { within, owed: a.outstanding_piastres, cap };
}

/** Deciding a pay line (D8): a rejection carries why (else 400 REASON_REQUIRED). */
export type DecideD = Decide & { reason?: string | null };
/** Deciding an advance (D8): `reason` (or `note`) says why a rejection was made. */
export type ReviewAdvanceD = ReviewAdvance & { reason?: string | null };
/** A pay line with the reason it was approved or rejected with (D8). */
export type AdjustmentD = Adjustment & { decision_note?: string | null };

/** One waive, undo or override of a rule-made deduction, newest first (D8, Legal ▸ Deduction overrides). */
export interface DeductionOverrideEvent {
  deduction_id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  action: "waive" | "unwaive" | "override" | string;
  actor_id?: string | null;
  actor_name?: string | null;
  at: string;
  reason?: string | null;
  amount_before_piastres?: number | null;
  amount_after_piastres?: number | null;
  effective_date?: string | null;
  source?: string | null;
  reason_code?: string | null;
}
/** A Legal audit report; only Deduction overrides carries `history`. */
export type AuditReportD = AuditReport & { history?: DeductionOverrideEvent[] | null };

/**
 * An employee (D7, D9): `salary_set` is always sent; false means nobody set
 * a salary (shown "Not set"), true with a null salary means it is hidden from
 * this caller. `advance_within_cap` is for everyone who sees the person.
 */
export type EmployeeD = Employee & { salary_set?: boolean; advance_within_cap?: boolean };

/** How a salary reads to this caller. */
export function salaryState(e: EmployeeD): "set" | "not_set" | "hidden" {
  if (e.salary_set === false) return "not_set";
  return e.base_salary_piastres == null ? "hidden" : "set";
}

/** A preview row (D9): on payroll with no salary, so approval is refused (409 SALARY_MISSING). */
export type PayslipD = ComputedPayslip & { salary_missing?: boolean };
/** The current run (D9): how many on-payroll people have no salary. */
export type CurrentPayrollD = CurrentPayroll & { missing_salary_count?: number; totals: CurrentPayroll["totals"] & { missing_salary_count?: number } };

/** A presence row (M15): when this person's check-in window opens today (shift start − the window); absent from an older server. */
export type PresenceRowD = PresenceRow & { punch_opens_at?: string | null };

/** Rostered today, not in yet, and the check-in window is open: a manager may punch them in, as the app would (CL-3). */
export const punchWindowOpen = (r: PresenceRowD, now = Date.now()): boolean =>
  r.state === "off" && r.scheduled_minutes > 0 && !r.check_in_at && !!r.punch_opens_at && Date.parse(r.punch_opens_at) <= now;

/** A decision that may pass a labour limit (M26: an approved open-shift claim): the server's warnings, which never block (RU-13). */
export const warningsOf = (out: unknown): LabourWarning[] => {
  const w = (out as { warnings?: unknown } | null | undefined)?.warnings;
  return Array.isArray(w) ? (w as LabourWarning[]) : [];
};

/**
 * Correcting a till-tagged expense advance (owner decision 39): the owner
 * clears the tag or moves it to someone else, with a reason; the cash that
 * left the till stays as it is. Through the Orval mutator until the client is
 * regenerated with these endpoints.
 */
export const clearExpenseAdvance = (id: string, body: { reason: string }) =>
  customInstance<unknown>({ url: `/staff/expense-advances/${id}`, method: "DELETE", headers: { "Content-Type": "application/json" }, data: body });
export const reassignExpenseAdvance = (id: string, body: { employee_id: string; reason: string }) =>
  customInstance<unknown>({ url: `/staff/expense-advances/${id}`, method: "PATCH", headers: { "Content-Type": "application/json" }, data: body });

