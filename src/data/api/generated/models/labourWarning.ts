/* eslint-disable */
// @ts-nocheck

/**
 * A roster past a labour limit. Warns, never blocks (RU-13).
 */
export interface LabourWarning {
  /** The day (or, for a week's limit, the Saturday it starts). */
  date: string;
  /** `day_hours` · `week_hours` · `presence` · `rest` · `weekly_rest` · `overtime_day` */
  kind: string;
  limit_minutes: number;
  minutes: number;
  user_id: string;
}
