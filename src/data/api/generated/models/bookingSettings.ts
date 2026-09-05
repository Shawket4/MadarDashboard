/* eslint-disable */
// @ts-nocheck
import type { HoursEntry } from './hoursEntry';

export interface BookingSettings {
  /**
     * Unseated this long after `starts_at` → `no_show` automatically. `null`
     * = only when the window ends.
     * @nullable
     */
  auto_no_show_minutes?: number | null;
  /** ISO dates (`YYYY-MM-DD`) with no online slots. */
  blackout_dates: string[];
  branch_id: string;
  default_duration_minutes: number;
  /** Online (public) booking switch. Host bookings work regardless. */
  enabled: boolean;
  /** The floor shows the table as held from `starts_at - hold_minutes`. */
  hold_minutes: number;
  horizon_days: number;
  hours: HoursEntry[];
  lead_time_minutes: number;
  /**
     * Optional ceiling on guests whose bookings start in one slot.
     * @nullable
     */
  max_covers_per_slot?: number | null;
  max_party: number;
  min_party: number;
  /**
     * WhatsApp reminder lead. `null` = no reminder.
     * @nullable
     */
  reminder_lead_minutes?: number | null;
  /** Online guests must verify their phone by WhatsApp code. */
  require_otp: boolean;
  slot_minutes: number;
}
