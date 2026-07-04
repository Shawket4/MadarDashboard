/* eslint-disable */
// @ts-nocheck
import type { Stocktake } from './stocktake';
import type { StocktakeItem } from './stocktakeItem';

export type StocktakeFull = Stocktake & {
  items: StocktakeItem[];
  /**
     * Org tolerance: a counted row whose |difference| is >= this percent of the
     * expected quantity (or that appears-from / vanishes-to zero) is flagged and
     * requires a `variance_reason` before the count can be finalized.
     */
  variance_threshold_pct: number;
};
