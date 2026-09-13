/**
 * Reading an order's loyalty rewards off the order detail.
 *
 * A reward pays for whole units of one line (`loyalty::redeem::plan`), and the
 * server stores that on the line as `is_reward` + `reward_covered` (piastres).
 * The order carries the member it was redeemed for.
 *
 * These fields are read defensively, by name, because the order detail
 * response does not expose them yet: the moment the backend adds
 * `OrderItem.is_reward` / `reward_units` / `reward_covered` and
 * `Order.loyalty_customer_id` / `loyalty_member_name`, the detail sheet shows
 * them with no further change here.
 */
export interface RewardLine {
  lineId: string;
  /** Units of the line the reward covered; null when the server did not say. */
  units: number | null;
  /** Piastres taken off the line. */
  covered: number;
}

export interface OrderRewards {
  memberId: string | null;
  memberName: string | null;
  lines: Map<string, RewardLine>;
  /** Piastres the rewards covered across the order. */
  totalCovered: number;
}

type Loose = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function orderRewards(order: object | null | undefined): OrderRewards {
  const o = (order ?? {}) as Loose;
  const items = Array.isArray(o.items) ? (o.items as Loose[]) : [];
  const lines = new Map<string, RewardLine>();
  let totalCovered = 0;
  for (const it of items) {
    const covered = num(it.reward_covered) ?? 0;
    if (it.is_reward !== true && covered <= 0) continue;
    const id = str(it.id);
    if (!id) continue;
    lines.set(id, { lineId: id, units: num(it.reward_units), covered });
    totalCovered += covered;
  }
  return {
    memberId: str(o.loyalty_customer_id),
    memberName: str(o.loyalty_member_name) ?? str(o.loyalty_customer_name),
    lines,
    totalCovered,
  };
}
