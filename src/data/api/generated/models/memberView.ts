/* eslint-disable */
// @ts-nocheck

/**
 * A member as the teller, the admin and the pass all see them.
 *
 * Both balances travel, because an org may switch mode (or run points at one
 * branch and stamps at another) and what a customer earned under the old rules
 * is still theirs. `mode` says which one is LIVE where the question was asked,
 * and `balance` is that one — so a caller never has to pick.
 */
export interface MemberView {
  /** The live balance, in `mode`'s currency. */
  balance: number;
  /** The balance affords at least one reward on offer here. */
  can_redeem: boolean;
  enrolled_at: string;
  id: string;
  lifetime_points: number;
  lifetime_visits: number;
  locale: string;
  /** `"points"` or `"visits"` — what the branch that asked collects. */
  mode: string;
  name: string;
  /**
     * The cheapest reward on offer here, in `mode`'s currency — what the
     * progress line counts towards. Falls back to the scope's default cost
     * when no rewards have been curated.
     */
  next_reward_cost: number;
  org_id: string;
  phone: string;
  points_balance: number;
  /**
     * What that next reward still needs. Equals `next_reward_cost` on an exact
     * multiple, because a fresh card is the honest thing to show there.
     */
  points_to_next_reward: number;
  /**
     * Progress towards the NEXT reward, after the earned ones are set aside.
     * `balance % next_reward_cost`.
     */
  progress_to_next: number;
  /**
     * How many rewards the balance has ALREADY earned.
     *
     * A card does not stop at full. Six stamps against a five-stamp reward is
     * one reward earned and one stamp towards the next, not "five and a bit
     * wasted" — and a customer who has been in eleven times is owed two
     * rewards, whether or not they claimed the first.
     */
  rewards_ready: number;
  visits_balance: number;
}
