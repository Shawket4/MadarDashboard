/* eslint-disable */
// @ts-nocheck

export interface OrgInventorySettings {
  /**
     * Stock-count variance tolerance (percent). A counted row whose |difference|
     * is at least this percent of expected is flagged and needs a reason.
     */
  stocktake_variance_threshold_pct: number;
}
