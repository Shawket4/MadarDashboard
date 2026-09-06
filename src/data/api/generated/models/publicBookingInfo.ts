/* eslint-disable */
// @ts-nocheck
import type { HoursEntry } from './hoursEntry';

export interface PublicBookingInfo {
  blackout_dates: string[];
  branch_id: string;
  branch_name: string;
  default_duration_minutes: number;
  enabled: boolean;
  horizon_days: number;
  hours: HoursEntry[];
  lead_time_minutes: number;
  max_party: number;
  min_party: number;
  org_name: string;
  require_otp: boolean;
  slot_minutes: number;
  timezone: string;
  /** Today's service date in the branch zone (the picker's floor). */
  today: string;
}
