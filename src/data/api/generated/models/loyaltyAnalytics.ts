/* eslint-disable */
// @ts-nocheck
import type { PointsLiability } from './pointsLiability';
import type { TopReward } from './topReward';

/**
 * The redemption report, computed in the database so a dashboard never loads
 * every member to draw it.
 */
export interface LoyaltyAnalytics {
  /** Balance earned, net of clawbacks written in the range. */
  earned_points: number;
  from: string;
  liability: PointsLiability;
  /** Balance spent, net of reversals written in the range. */
  redeemed_points: number;
  /** Units handed over as rewards. */
  redeemed_units: number;
  /** Minor units of goods given away as rewards, on sales not voided. */
  redeemed_value_minor: number;
  /** Redemption rows in the range (one per covered order line). */
  redemptions: number;
  /** Replayed sales whose rewards the points could not pay for. */
  refused_redemptions: number;
  to: string;
  top_rewards: TopReward[];
}
