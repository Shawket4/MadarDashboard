/* eslint-disable */
// @ts-nocheck
import type { LoyaltyRedemptionInput } from './loyaltyRedemptionInput';
import type { PaymentSplitInput } from './paymentSplitInput';
import type { ReplayApproval } from './replayApproval';

export interface SettleOpenTicketRequest {
  /** @nullable */
  amount_tendered?: number | null;
  /**
     * What the till handed back. Recorded as the drawer saw it, like a
     * counter sale's; absent, it is derived from `amount_tendered` and the
     * server's total.
     * @nullable
     */
  change_given?: number | null;
  /**
     * What the till actually took off this bill, in minor units — the figure
     * the drawer charged. Additive; absent, the server computes it as before.
     * This is also what a replayed bill keeps when its preset has since been
     * switched off: the money as rung, never recomputed from a dead rule.
     * @nullable
     */
  discount_amount?: number | null;
  /**
     * Who put the discount on the bill. Read on replay (live, it is the
     * cashier holding the token). Additive.
     * @nullable
     */
  discount_applied_by?: string | null;
  /**
     * The manager approval that let the bill's discount past the cashier's
     * cap, verified at replay like a counter sale's. Additive.
     * @nullable
     */
  discount_approval_id?: string | null;
  /**
     * Settle-time discount. ABSENT (all three fields) means the waiter's
     * ticket discount is inherited, as it always was — but the till can now
     * see that discount on the ticket view. The literal `discount_type:
     * "none"` settles with no discount at all; any other value (or a
     * `discount_id`) replaces the waiter's.
     * @nullable
     */
  discount_id?: string | null;
  /**
     * Which discount act this bill performs: `preset` | `manual_amount` |
     * `manual_percent`. A table bill is gated exactly like a counter sale, so
     * it names its act in the same vocabulary. ADDITIVE — an older tablet
     * sends nothing and the kind is derived as it always was (a `discount_id`
     * means preset, an ad-hoc discount is manual of its type).
     * @nullable
     */
  discount_kind?: string | null;
  /**
     * Basis points for a percentage bill discount (1250 = 12.5%). Additive.
     * @nullable
     */
  discount_percent_bps?: number | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  live_approval?: null | ReplayApproval;
  /**
     * The member spending a balance on this settle, when rewards are applied.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /**
     * Rewards covering lines of the ticket. A table-service bill redeems
     * exactly like a counter one — the cashier scans at settle either way.
     */
  loyalty_redemptions?: LoyaltyRedemptionInput[];
  payment_method: string;
  /**
     * Split tenders, when the party paid with more than one. Carried to the
     * order's payment legs like a counter sale's; they must sum to the total.
     * @nullable
     */
  payment_splits?: PaymentSplitInput[] | null;
  /**
     * When the bill was paid, as the till says. An offline settle replayed
     * later keeps its real time — it becomes the order's `created_at` and the
     * ticket's `settled_at`, one instant on both rows. Absent means now; a
     * future clock is refused.
     * @nullable
     */
  settled_at?: string | null;
  till_id: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  /**
     * What the till says the bill came to — the figure its drawer collected.
     * Checked against the server's own total exactly as a counter checkout is
     * (`create_order_inner`'s drift check); a disagreement is refused, not
     * recorded. Absent on older builds, which then get no check. The figure
     * to send is `OpenTicketView::bill.total`, which is priced by the same
     * engine under the same policy — a till that shows that number cannot
     * disagree with the books.
     * @nullable
     */
  total_amount?: number | null;
  /**
     * Remove the service charge from this bill. Only someone whose effective
     * permissions include `orders:waive_service` may send `true`; anyone else
     * is refused, live or replayed. The order records who and when. Absent
     * (every build before 0.7.2) means the charge stands.
     */
  waive_service_charge?: boolean;
}
