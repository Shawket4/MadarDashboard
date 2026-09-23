/* eslint-disable */
// @ts-nocheck
import type { DayTime } from './dayTime';

export interface WorkShiftBrief {
  /** @nullable */
  branch_id?: string | null;
  /**
     * How long before its start a check-in opens — the window the server
     * enforces (CL-3), so the app says "opens at" the same time.
     */
  checkin_window_minutes: number;
  crosses_midnight: boolean;
  /** Its own times on some weekdays; show that day's times. */
  day_times: DayTime[];
  end_time: string;
  grace_minutes: number;
  id: string;
  name: string;
  start_time: string;
  /**
     * Weekdays it may be rostered on (0 = Sunday … 6 = Saturday): offer it
     * only on those.
     */
  valid_days: number[];
}
