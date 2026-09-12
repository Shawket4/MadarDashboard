/* eslint-disable */
// @ts-nocheck
import type { TableSitting } from './tableSitting';

/**
 * What a table has done over the window asked for.
 */
export interface TableHistory {
  /** Mean spend per settled bill, minor units. */
  average_bill_minor: number;
  /**
     * Mean minutes a party occupied the table, over settled bills — the
     * number that says whether a table turns.
     */
  average_minutes: number;
  /** Settled bills only. */
  covers: number;
  from: string;
  label: string;
  settled_count: number;
  /** Bills opened on this table in the window, newest first. */
  sittings: TableSitting[];
  table_id: string;
  to: string;
  total_minor: number;
  /** Settled bills per day over the window, x100 so the wire stays integer. */
  turns_per_day_x100: number;
}
