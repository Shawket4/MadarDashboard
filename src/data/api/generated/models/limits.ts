/* eslint-disable */
// @ts-nocheck

/**
 * The limits, for the composer to show.
 */
export interface Limits {
  /** @minimum 0 */
  daily_limit: number;
  /** @minimum 0 */
  line_max: number;
  /** @minimum 0 */
  member_gap_hours: number;
  /** @minimum 0 */
  schedule_max_days: number;
  /** @minimum 0 */
  schedule_min_minutes: number;
}
