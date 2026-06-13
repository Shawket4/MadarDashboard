/* eslint-disable */
// @ts-nocheck

/**
 * Two anchors are universal; the cost-plus anchor is only meaningful with
 * cost data, so it's optional.
 */
export interface PriceAnchors {
  /** @nullable */
  cost_plus?: number | null;
  peer_median: number;
  status_quo: number;
}
