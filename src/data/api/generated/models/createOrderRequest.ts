/* eslint-disable */
// @ts-nocheck
import type { LoyaltyRedemptionInput } from './loyaltyRedemptionInput';
import type { OrderItemInput } from './orderItemInput';
import type { PaymentSplitInput } from './paymentSplitInput';

export interface CreateOrderRequest {
  /** @nullable */
  amount_tendered?: number | null;
  branch_id: string;
  /** @nullable */
  change_given?: number | null;
  /** @nullable */
  created_at?: string | null;
  /** @nullable */
  customer_name?: string | null;
  /** @nullable */
  discount_amount?: number | null;
  /** @nullable */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  /** @nullable */
  idempotency_key?: string | null;
  items: OrderItemInput[];
  /**
     * The loyalty member spending a balance on this sale. Required when
     * `loyalty_redemptions` is non-empty, and ONLY for that: earning is a
     * separate, later act (`POST /loyalty/award`), so a sale that redeems
     * nothing never names a member here.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /**
     * Rewards covering lines of this cart. Each names a line by its index in
     * `items` and how many of that line's units the reward pays for, so a
     * mixed basket can have one free coffee among four paid ones.
     */
  loyalty_redemptions?: LoyaltyRedemptionInput[];
  /** @nullable */
  notes?: string | null;
  /**
     * IGNORED by the server (accepted for backward compatibility only). The
     * authoritative per-shift number is ALWAYS `MAX(order_number)+1` computed under
     * the shift advisory lock — never the client value, which is used only on the
     * device's local receipt. The byte-identical-at-reprint guarantee rides on
     * `order_ref`, not this field. Two tills on one shift get distinct numbers
     * (UNIQUE(shift_id, order_number) + the lock).
     * @nullable
     */
  order_number?: number | null;
  /**
     * Client-minted order reference (`<BRANCH>-<YYMMDD>-<DEVICE>-<NNNN>`). Stored
     * verbatim when present; absent → the server mints the deterministic
     * shift-based ref. The global `UNIQUE(order_ref)` index keeps both paths
     * collision-safe (a managed per-device code makes concurrent tills unique).
     * @nullable
     */
  order_ref?: string | null;
  payment_method: string;
  /** @nullable */
  payment_splits?: PaymentSplitInput[] | null;
  shift_id: string;
  /** @nullable */
  subtotal?: number | null;
  /** @nullable */
  tax_amount?: number | null;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  /** @nullable */
  total_amount?: number | null;
}
