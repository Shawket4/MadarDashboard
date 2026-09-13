/**
 * What the programme owes, worked out from the member list.
 *
 * Liability is the value of what members could claim tomorrow. The balance is
 * in points or stamps, and a point has no price of its own — so it is valued
 * the way a customer would spend it: at what a unit of balance buys on the
 * catalogue. Two figures, both stated as what they are:
 *
 *  - `rewardsOwed`: rewards already earned and not yet claimed, valued at the
 *    AVERAGE menu price of the catalogue (or, in any-item mode, simply counted).
 *  - `outstandingValue`: every unit of balance, at the catalogue's average
 *    piastres-per-unit. The honest upper bound of what the balances are worth.
 *
 * Only members whose live balance is in the scope's currency count: an org
 * that switched mode still carries the old balances, and they buy nothing.
 */
import type { MemberView, RewardItem } from "@/data/api/generated/models";

export interface ProgrammeSummary {
  members: number;
  /** Members holding at least one earned, unclaimed reward. */
  membersWithReward: number;
  outstanding: number;
  rewardsOwed: number;
  /** Piastres; null when there is no catalogue to value against. */
  rewardsOwedValue: number | null;
  /** Piastres; null when there is no catalogue to value against. */
  outstandingValue: number | null;
}

export function summarise(members: MemberView[], catalogue: RewardItem[]): ProgrammeSummary {
  const priced = catalogue.filter((r) => r.cost_amount > 0 && r.base_price >= 0);
  const avgPrice = priced.length
    ? priced.reduce((s, r) => s + r.base_price, 0) / priced.length
    : null;
  const avgPerUnit = priced.length
    ? priced.reduce((s, r) => s + r.base_price / r.cost_amount, 0) / priced.length
    : null;

  let outstanding = 0;
  let rewardsOwed = 0;
  let membersWithReward = 0;
  for (const m of members) {
    // A negative balance (a clawback past zero) is owed BY the member; it does
    // not offset what the shop owes everyone else.
    outstanding += Math.max(0, m.balance);
    rewardsOwed += Math.max(0, m.rewards_ready);
    if (m.rewards_ready > 0) membersWithReward += 1;
  }
  return {
    members: members.length,
    membersWithReward,
    outstanding,
    rewardsOwed,
    rewardsOwedValue: avgPrice == null ? null : Math.round(rewardsOwed * avgPrice),
    outstandingValue: avgPerUnit == null ? null : Math.round(outstanding * avgPerUnit),
  };
}
