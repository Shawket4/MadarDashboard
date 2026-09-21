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
  /**
     * That device's code (`36B`), stored with the order. `null` when server-numbered.
     * @nullable
     */
  device_code?: string | null;
  /**
     * The device that numbered this sale (contract R4). `null` for server-numbered
     * orders (old clients, dashboard, delivery).
     * @nullable
     */
  device_id?: string | null;
  discount_amount: number;
  /**
     * Who applied the discount. Additive.
     * @nullable
     */
  discount_applied_by?: string | null;
  /** @nullable */
  discount_applied_by_name?: string | null;
  /**
     * The manager approval that let the discount past the person's cap. Additive.
     * @nullable
     */
  discount_approval_id?: string | null;
  /**
     * The approving manager's name, when the approval was recorded. Additive.
     * @nullable
     */
  discount_approved_by_name?: string | null;
  /** @nullable */
  discount_id?: string | null;
  /**
     * `preset` | `manual_amount` | `manual_percent`; `null` without a
     * discount or on sales from before discounts were attributed. Additive.
     * @nullable
     */
  discount_kind?: string | null;
  /**
     * The percentage asked for, in basis points. Additive.
     * @nullable
     */
  discount_percent_bps?: number | null;
  /**
     * The stored value — a fraction for a percentage. Same column as
     * [`Order::discount_value`].
     */
  discount_rate?: number;
  /** @nullable */
  discount_type?: string | null;
  /**
     * LEGACY SPELLING — an integer, 0-100 for a percentage. See
     * `discounts::wire`: every shipped till was generated against `integer`,
     * and a double here fails to deserialise the whole ORDER, not just this
     * field. Read [`Order::discount_rate`] for the stored number.
     */
  discount_value: number;
  /**
     * What receipts and lists show: `<device_code>-<order_number>` (`36B-12`)
     * for a device-numbered sale, else `order_number` as text.
     */
  display_number?: string;
  id: string;
  /**
     * The client-minted key the sale was created with (a till's sale, or the
     * ticket id of a settled bill). An offline POS identifies its own row by it
     * when a list read brings the sale back (OFFLINE_B_DESIGN §7). Additive.
     * @nullable
     */
  idempotency_key?: string | null;
  /**
     * The loyalty member this sale redeemed for (or was scanned for).
     * @nullable
     */
  loyalty_customer_id?: string | null;
  /**
     * That member's name, for the order detail. `None` once forgotten.
     * @nullable
     */
  loyalty_member_name?: string | null;
  /** @nullable */
  notes?: string | null;
  /**
     * The open ticket this sale settled, if any. Additive.
     * @nullable
     */
  open_ticket_id?: string | null;
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
     * split order has one per leg (e.g. card 285.00 + cash 255.00). Every
     * response carries them, the one to order creation included.
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
     * What the catalogue says this sale should have come to, when it differs.
     * Beside `subtotal` it is the size of the drift, which is the question
     * anyone looking at a flagged sale asks next.
     * @nullable
     */
  price_expected_total?: number | null;
  /**
     * This sale was rung against a catalogue that has since moved: a line was
     * charged at a price the menu no longer says, or the item was disabled at
     * this branch. Both mean a till that was OFFLINE when something changed —
     * a live sale is priced by the server and cannot deviate.
     *
     * Recorded, never rejected: the money already changed hands. It is here so
     * the POS and the dashboard can SHOW it, which is the whole point of
     * flagging something.
     */
  price_flagged?: boolean;
  /**
     * The service charge on this bill; `0` where the branch charges none.
     * Its own field, and its own receipt line: a charge the customer did not
     * choose is stated separately from the tax rather than folded into it.
     */
  service_charge_amount?: number;
  /**
     * The service charge rate the bill was priced under (a fraction); `0` on a
     * takeaway, a delivery, or a bill whose charge was waived. Additive.
     * @nullable
     */
  service_charge_rate_applied?: number | null;
  /**
     * Whether the service charge sat inside the tax base. Additive.
     * @nullable
     */
  service_charge_taxable_applied?: boolean | null;
  /**
     * What the removed service charge came to, in minor units; `0` when
     * nothing was waived. Not part of the total. Additive.
     * @nullable
     */
  service_charge_waived_amount?: number | null;
  /**
     * When the service charge was removed. Additive.
     * @nullable
     */
  service_charge_waived_at?: string | null;
  /**
     * Who removed the service charge from this table's bill (a holder of
     * `orders:waive_service`), or `null`. Additive.
     * @nullable
     */
  service_charge_waived_by?: string | null;
  /** @nullable */
  service_charge_waived_by_name?: string | null;
  /** DEPRECATED: same value as `till_id` (required by POS v0.5.1/v0.6.0). */
  shift_id: string;
  /**
     * Who started this sale's cart when it is not the person who rang it: a
     * held order resumed after a teller switch on the till. `null` otherwise.
     * Additive.
     * @nullable
     */
  started_by?: string | null;
  /** @nullable */
  started_by_name?: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  /**
     * Whether this bill's prices included tax, as it was priced. A receipt
     * says "Prices include VAT" when true. `null` on a read that does not
     * resolve it. Additive.
     * @nullable
     */
  tax_inclusive?: boolean | null;
  /**
     * The tax rate the bill was priced under (a fraction). `null` for orders
     * from before rates were recorded. Additive.
     * @nullable
     */
  tax_rate_applied?: number | null;
  teller_id: string;
  teller_name: string;
  till_id: string;
  /**
     * The branch's effective IANA timezone (see `crate::tz`) — the zone every
     * timestamp on this payload is shown and printed in. Additive: older
     * clients ignore it; `null` only where a write path does not resolve it.
     * @nullable
     */
  timezone?: string | null;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  total_amount: number;
  /**
     * `server` | `lan` | `unverified` — the till's verification as the ringing
     * device knew it; `null` when not recorded.
     * @nullable
     */
  verification?: string | null;
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
