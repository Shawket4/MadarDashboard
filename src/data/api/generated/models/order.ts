/* eslint-disable */
// @ts-nocheck

export interface Order {
  /** @nullable */
  amount_tendered?: number | null;
  branch_id: string;
  /** @nullable */
  change_given?: number | null;
  created_at: string;
  /** @nullable */
  customer_name?: string | null;
  /**
     * Delivery channel ("in_mall" | "outside") of the linked delivery order,
   * surfaced on the list so clients can flag + segment delivery orders
   * without a per-order detail fetch. `null` for dine-in orders.
     * @nullable
     */
  delivery_channel?: string | null;
  /** Delivery charge in piastres, shown separately from the item subtotal.
   * Always 0 for dine-in orders; for delivery orders
   * `total_amount == subtotal + tax_amount + delivery_fee` (minus discount). */
  delivery_fee: number;
  /**
     * Customer location of the linked delivery order, so clients can link out
   * to a map (e.g. Google Maps) without a per-order detail fetch. `null` for
   * dine-in orders or delivery orders without captured coordinates.
     * @nullable
     */
  delivery_lat?: number | null;
  /** @nullable */
  delivery_lng?: number | null;
  /**
     * Links a finalized delivery order back to its `delivery_orders` row
   * (customer, address, channel, zone). `null` for dine-in orders.
     * @nullable
     */
  delivery_order_id?: string | null;
  discount_amount: number;
  /** @nullable */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  discount_value: number;
  id: string;
  /** @nullable */
  notes?: string | null;
  order_number: number;
  /**
     * Human-readable, org-unique reference (e.g. "DT-260614-0042"). Additive
   * alongside the per-shift order_number. Optional only during the rollout
   * window before the historical backfill runs; never null afterwards.
     * @nullable
     */
  order_ref?: string | null;
  /** Order origin: "dine_in" (POS sale) or "delivery" (finalized delivery
   * order). Defaults to "dine_in" for every POS sale. */
  order_type: string;
  payment_method: string;
  shift_id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  teller_id: string;
  teller_name: string;
  /**
   * The waiter who opened the ticket this order was settled from.
   * `null` for direct sales & delivery.
   * @nullable
   */
  waiter_id?: string | null;
  /** @nullable */
  waiter_name?: string | null;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  total_amount: number;
  /** @nullable */
  void_note?: string | null;
  /** @nullable */
  void_reason?: string | null;
  /** @nullable */
  voided_at?: string | null;
  /** @nullable */
  voided_by?: string | null;
}
