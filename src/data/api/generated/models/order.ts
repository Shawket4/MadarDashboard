/* eslint-disable */
// @ts-nocheck
import type { PaymentLeg } from './paymentLeg';

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
  /**
     * Delivery charge in piastres, shown separately from the item subtotal.
     * Always 0 for dine-in orders; for delivery orders
     * `total_amount == subtotal + tax_amount + delivery_fee` (minus discount).
     */
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
  /**
     * What kind of sale: "dine_in" (settled from a waiter's ticket — the only
     * kind that carries a service charge), "takeaway" (rung straight through
     * the till) or "delivery" (a finalized delivery order). Till sales before
     * 2026-09 say "dine_in" because "takeaway" could not be expressed.
     */
  order_type: string;
  /**
     * What was ACTUALLY tendered, one entry per `order_payments` row — the same
     * rows every money report buckets by. A single-tender order has one leg; a
     * split order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the
     * response to order creation, where the legs are written just after the row
     * this statement returns; every read hydrates it.
     */
  payment_legs: PaymentLeg[];
  /**
     * The order's NOMINAL payment label. For a split order this is the literal
     * `'mixed'` — a label that exists in no money report, because reports bucket
     * by what was actually tendered. Use [`Order::payment_legs`] for the real
     * methods; treat this as a display badge only.
     */
  payment_method: string;
  /**
     * The service charge on this bill; `0` where the branch charges none.
     * Its own field, and its own receipt line: a charge the customer did not
     * choose is stated separately from the tax rather than folded into it.
     */
  service_charge_amount?: number;
  shift_id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  teller_id: string;
  teller_name: string;
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
  /**
     * The WAITER who opened this order's ticket (`open_tickets.opened_by`),
     * stamped server-side at settle time. `null` for direct teller sales and
     * delivery orders (they never pass through a waiter's ticket).
     * @nullable
     */
  waiter_id?: string | null;
  /** @nullable */
  waiter_name?: string | null;
}
