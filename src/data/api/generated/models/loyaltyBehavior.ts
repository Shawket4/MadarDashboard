/* eslint-disable */
// @ts-nocheck

/**
 * Behavioral rates over the range — how much of the member base actually
 * uses the programme, not just what it's worth. `total_members` and
 * `members_ever_redeemed` are org-wide and lifetime (a balance/history isn't
 * branch-scoped); every other figure narrows to `branch_id` and the range,
 * same as [`LoyaltyAnalytics`].
 */
export interface LoyaltyBehavior {
  /** `active_members / total_members`. `0.0` when there are no members. */
  active_member_rate: number;
  /** Distinct members with any loyalty transaction in the range. */
  active_members: number;
  from: string;
  /** Distinct members who have ever redeemed a reward. Org-wide, lifetime. */
  members_ever_redeemed: number;
  /** `new_members_active / active_members`. */
  new_member_share: number;
  /** Active members who enrolled during the range. */
  new_members_active: number;
  /** Members with exactly 1 earning visit in the range. */
  one_time_members: number;
  /** `members_ever_redeemed / total_members`. */
  redemption_rate: number;
  /**
     * `redeemed_points_period / earned_points_period` — the share of what
     * was earned in the range that got spent in it. Points earned before the
     * range and redeemed inside it are not the numerator's earn, so this can
     * exceed 1.0 on a range with heavy redemption of an older balance.
     */
  redemption_ratio: number;
  /** Members with 2+ earning visits in the range. */
  repeat_members: number;
  /**
     * `repeat_members / (repeat_members + one_time_members)`. `0.0` when
     * nobody earned in the range.
     */
  repeat_visit_rate: number;
  /** Active members who enrolled before the range started. */
  returning_members_active: number;
  to: string;
  /** Enrolled, not deleted, as of now. Org-wide. */
  total_members: number;
}
