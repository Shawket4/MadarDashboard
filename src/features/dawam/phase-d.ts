/**
 * How the dashboard reads the owner's Phase D decisions (24 Sep 2026): the
 * same reading on every screen. Pure helpers over the generated types.
 */
import type { AttendanceSettings, Employee, LabourWarning, PresenceRow, SalaryAdvance } from "@/data/api/generated/models";

/** How a confirmed cover is paid (D5): the coverer's plain minute rate, or the covered block as a full day. */
export type CoverPayMode = "minute_rate" | "full_block";

/** The business's (or a branch's effective) cover pay; the minute rate unless it says the block. */
export const coverPayOf = (s: Pick<AttendanceSettings, "cover_pay_mode"> | { cover_pay_mode?: string | null }): CoverPayMode =>
  s.cover_pay_mode === "full_block" ? "full_block" : "minute_rate";

/**
 * Where an advance stands against the owner's cap (D7): within/over for
 * everyone; the figures only when the server sends the cap (null for someone
 * who may not read the salary it reveals). An older server sent no
 * `within_cap`: it is worked out from the cap then.
 */
export function capView(a: Pick<SalaryAdvance, "cap_piastres" | "outstanding_piastres"> & { within_cap?: boolean }): {
  within: boolean | null; owed: number; cap: number | null;
} {
  const cap = a.cap_piastres ?? null;
  const within = typeof a.within_cap === "boolean" ? a.within_cap : cap != null ? a.outstanding_piastres <= cap : null;
  return { within, owed: a.outstanding_piastres, cap };
}

/**
 * How a salary reads to this caller (D9): `salary_set` false means nobody
 * set one ("Not set"); true with a null salary means it is hidden from you.
 */
export function salaryState(e: Pick<Employee, "base_salary_piastres"> & { salary_set?: boolean }): "set" | "not_set" | "hidden" {
  if (e.salary_set === false) return "not_set";
  return e.base_salary_piastres == null ? "hidden" : "set";
}

/**
 * Rostered today, not in yet, and the check-in window is open (M15:
 * `punch_opens_at`, shift start − the window): a manager may punch them in,
 * as the app would (CL-3). Without the field (an older server), never.
 */
export const punchWindowOpen = (r: PresenceRow & { punch_opens_at?: string | null }, now = Date.now()): boolean =>
  r.state === "off" && r.scheduled_minutes > 0 && !r.check_in_at && !!r.punch_opens_at && Date.parse(r.punch_opens_at) <= now;

/** A decision that may pass a labour limit (M26: an approved open-shift claim): the server's warnings, which never block (RU-13). */
export const warningsOf = (out: unknown): LabourWarning[] => {
  const w = (out as { warnings?: unknown } | null | undefined)?.warnings;
  return Array.isArray(w) ? (w as LabourWarning[]) : [];
};
