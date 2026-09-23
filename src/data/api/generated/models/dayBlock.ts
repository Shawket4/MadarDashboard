/* eslint-disable */
// @ts-nocheck

/**
 * One block on a date, with its own from/to if it has one.
 */
export interface DayBlock {
  /** @nullable */
  end_time?: string | null;
  /** @nullable */
  start_time?: string | null;
  work_shift_id: string;
}
