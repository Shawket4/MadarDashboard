/* eslint-disable */
// @ts-nocheck

export interface LiabilityTrendPoint {
  /**
     * Net points/visits change in that week (earn − redeem, reversals
     * netted in) — not a running balance. See [`LiabilityTrend`].
     */
  outstanding: number;
  week: string;
}
