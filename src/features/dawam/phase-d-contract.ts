/**
 * The fields the owner's Phase D decisions (24 Sep 2026) add to the API, as
 * the backend's "Contract as built" names them. Every screen reads them
 * through these types, so the generated client can take over in one place.
 */
import type { AttendanceSettings, PutAttendanceSettingsRequest, SalaryAdvance } from "@/data/api/generated/models";

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

