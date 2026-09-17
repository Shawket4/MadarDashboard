/* eslint-disable */
// @ts-nocheck
import type { LiabilityTrendPoint } from './liabilityTrendPoint';

/**
 * A weekly trend of the programme's liability, in the org's live currency
 * (points or visits — never both; see [`PointsLiability`]).
 *
 * `loyalty_customers.points_balance`/`visits_balance` are CURRENT balances
 * with no history table, so this is not a snapshot of the outstanding
 * balance at each week — it is each week's *net change* (earned minus
 * redeemed, reversals netted in), read straight off the ledger. Summing
 * `outstanding` across every week since the programme started would
 * reconstruct the current balance; a single week says whether that week
 * grew or shrank the liability.
 */
export interface LiabilityTrend {
  currency: string;
  from: string;
  points: LiabilityTrendPoint[];
  to: string;
}
