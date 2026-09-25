/* eslint-disable */
// @ts-nocheck

/**
 * Units of one order line a deal takes.
 */
export interface DealLineInput {
  /** Index into the order's `items[]`. */
  line_index: number;
  units: number;
}
