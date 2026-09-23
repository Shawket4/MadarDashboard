/* eslint-disable */
// @ts-nocheck

/**
 * A block's own start/end on one weekday, on top of its default times.
 */
export interface DayTime {
  /** 0 = Sunday … 6 = Saturday. */
  day_of_week: number;
  /** At or before the start = ends the next day. */
  end_time: string;
  start_time: string;
}
