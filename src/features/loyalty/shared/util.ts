/**
 * Shared vocabulary for the loyalty admin.
 *
 * The program collects ONE of two things, never both: points earned on money
 * spent, or a stamp per order ("5 orders, free coffee"). Everything on these
 * screens reads from `mode`, so an admin never sees a field that does not apply
 * to the program they are running.
 */
import type { LoyaltySettings } from "@/data/api/generated/models/loyaltySettings";

export type LoyaltyMode = "points" | "visits";

export const modeOf = (s: Pick<LoyaltySettings, "mode"> | undefined): LoyaltyMode =>
  s?.mode === "visits" ? "visits" : "points";

/**
 * What to call the currency, in the customer's words.
 *
 * "orders", not "visits" — the customer counts the things they bought, and that
 * is the word the counter says back to them. Kept in step with the POS core's
 * `balance_label`, so the dashboard and the till never disagree in front of a
 * customer.
 */
export const currencyLabel = (mode: string, count?: number): string => {
  const plural = count === 1 ? "" : "s";
  return mode === "visits" ? `order${plural}` : `point${plural}`;
};

/** "5 orders" / "100 points" — a reward's price, ready to render. */
export const costLabel = (amount: number, currency: string): string =>
  `${amount} ${currencyLabel(currency, amount)}`;

/**
 * A scope's own row, or null when it inherits.
 *
 * A branch with no row of its own runs the org's program. The API answers a
 * branch query with the settings IN FORCE (inherited or not), so the only way
 * to tell them apart is whether `branch_id` came back matching what was asked.
 */
export const isOwnOverride = (
  settings: LoyaltySettings | undefined,
  branchId: string | null,
): boolean => Boolean(branchId) && settings?.branch_id === branchId;
