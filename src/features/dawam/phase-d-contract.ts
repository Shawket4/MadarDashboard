/**
 * The fields the owner's Phase D decisions (24 Sep 2026) add to the API, as
 * the backend's "Contract as built" names them. Every screen reads them
 * through these types, so the generated client can take over in one place.
 */
import type { AttendanceSettings, PutAttendanceSettingsRequest } from "@/data/api/generated/models";

/** How a confirmed cover is paid (D5): the coverer's plain minute rate, or the covered block as a full day. */
export type CoverPayMode = "minute_rate" | "full_block";
export const COVER_PAY_MODES: readonly CoverPayMode[] = ["minute_rate", "full_block"];

/** Rules as read: the business's `cover_pay_mode`, or a branch's effective one (listed in `overridden` when it sets its own). */
export type SettingsD = AttendanceSettings & { cover_pay_mode?: string | null };
/** Rules as saved: `cover_pay_mode` like any other branch-overridable rule; `inherit: ["cover_pay_mode"]` drops a branch's. */
export type SettingsPutD = PutAttendanceSettingsRequest & { cover_pay_mode?: CoverPayMode };

export const coverPayOf = (s: SettingsD): CoverPayMode => (s.cover_pay_mode === "full_block" ? "full_block" : "minute_rate");
