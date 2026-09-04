/* eslint-disable */
// @ts-nocheck
import type { TopPer } from './topPer';

/**
 * Post-aggregation shaping.
 */
export interface Transform {
  /** Add a running total in time order. Needs a time dimension. */
  cumulative?: boolean;
  /** Add each row's percentage of the grand total. */
  share?: boolean;
  top_per?: null | TopPer;
}
