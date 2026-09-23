/* eslint-disable */
// @ts-nocheck

/**
 * A person's date that holds its own set (a date change), not the pattern.
 */
export interface DateSet {
  date: string;
  /** The date is a day off by date change (it holds no shift). */
  day_off: boolean;
  employee_id: string;
}
