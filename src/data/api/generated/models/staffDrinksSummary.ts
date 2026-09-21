/* eslint-disable */
// @ts-nocheck

/**
 * What the staff pool gave away and took in over a range of business days.
 */
export interface StaffDrinksSummary {
  /** What the pool comped, minor units (server-priced). */
  comp_minor: number;
  /** Rows whose till-reported comp differs from the server's. */
  comp_mismatches: number;
  /**
     * What the drinks cost to make, where known. Counts in FULL: the drink
     * was made whether or not anyone paid for it.
     */
  cost_minor: number;
  /** Rows (lines put on the pool). */
  drinks: number;
  /** What those lines were still charged — the only part that is revenue. */
  extras_minor: number;
  /** Of those rows, how many went past the allowance. */
  overspent: number;
  /** Drinks (the sum of their quantities) — what the allowance is measured in. */
  quantity: number;
  /** Record-only rows (no priced sale line behind them; POS ≤ v0.7.12). */
  unpriced: number;
}
