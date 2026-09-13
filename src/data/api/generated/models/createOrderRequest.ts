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
  /**
     * The device's code; with `device_id` + `order_number` the number is stored verbatim.
     * @nullable
     */
  device_code?: string | null;
  /**
     * The device ringing the order (else `X-Madar-Device`).
     * @nullable
     */
  device_id?: string | null;
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
     * The device's own order number (contract R4): its per-business-day
     * sequence, the same counter as the `NNNN` of its `order_ref`. Stored
     * VERBATIM when the request also names `device_id` and a non-blank
     * `device_code` — the order then reads `display_number` `<device_code>-<n>`.
     * Without all three (old clients, dashboard, delivery) it is ignored and the
     * server numbers the sale per till: `MAX(order_number)+1` over the till's
     * server-numbered orders, under the till advisory lock
     * (`uq_orders_till_legacy_number`).
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
  /** @nullable */
  subtotal?: number | null;
  /** @nullable */
  tax_amount?: number | null;
  till_id: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  /** @nullable */
  total_amount?: number | null;
  /**
     * `server` | `lan` | `unverified` — the till's verification as the device knew it.
     * @nullable
     */
  verification?: string | null;
}
