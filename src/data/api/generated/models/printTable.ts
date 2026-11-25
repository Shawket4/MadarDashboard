/* eslint-disable */
// @ts-nocheck
import type { PrintColumn } from './printColumn';

/**
 * A table: a header band, zebra rows, bold footer rows, a totals band, a
 * caption under it.
 */
export interface PrintTable {
  /**
     * A wrapped line under the table (how it's made).
     * @nullable
     */
  caption?: string | null;
  columns: PrintColumn[];
  /** Bold rows ruled off under the body (a recipe's cost, price, food cost). */
  footer?: string[][];
  /**
     * Muted words after the title.
     * @nullable
     */
  note?: string | null;
  rows?: string[][];
  /** @nullable */
  title?: string | null;
  /**
     * An ink band under the body (a list's totals).
     * @nullable
     */
  totals?: string[] | null;
}
