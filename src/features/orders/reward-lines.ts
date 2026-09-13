/**
 * Reading an order's loyalty rewards off the order detail.
 *
 * A reward pays for whole units of one line (`loyalty::redeem::plan`), and the
 * server stores that on the line as `is_reward` + `reward_units` +
 * `reward_covered` (minor units). The order carries the member it was redeemed
 * for (`loyalty_member_name` is null once that member was forgotten), and — for
 * a replayed offline sale whose rewards the points could no longer pay for —
 * the server's sentence in `loyalty_redemption_refused`.
 */
import type { OrderFull } from "@/data/api/generated/models";

export interface RewardLine {
  lineId: string;
  /** Units of the line the reward covered; null when the server did not say. */
  units: number | null;
  /** Minor units taken off the line. */
  covered: number;
}

export interface OrderRewards {
  memberId: string | null;
  memberName: string | null;
  lines: Map<string, RewardLine>;
  /** Minor units the rewards covered across the order. */
  totalCovered: number;
  /** Why the server refused to charge points for this sale's rewards on sync. */
  refused: string | null;
}

type RewardOrder = Pick<OrderFull, "loyalty_customer_id" | "loyalty_member_name" | "loyalty_redemption_refused"> & {
  items?: Pick<OrderFull["items"][number], "id" | "is_reward" | "reward_units" | "reward_covered">[];
};

export function orderRewards(order: RewardOrder | null | undefined): OrderRewards {
  const lines = new Map<string, RewardLine>();
  let totalCovered = 0;
  for (const it of order?.items ?? []) {
    const covered = Math.max(0, it.reward_covered ?? 0);
    if (it.is_reward !== true && covered <= 0) continue;
    lines.set(it.id, { lineId: it.id, units: it.reward_units ?? null, covered });
    totalCovered += covered;
  }
  return {
    memberId: order?.loyalty_customer_id || null,
    memberName: order?.loyalty_member_name || null,
    lines,
    totalCovered,
    refused: order?.loyalty_redemption_refused || null,
  };
}
