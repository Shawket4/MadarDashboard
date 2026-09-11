/* eslint-disable */
// @ts-nocheck
import type { DeliveryOrderCart } from './deliveryOrderCart';

export interface DeliveryOrder {
  /** @nullable */
  address_line?: string | null;
  branch_id: string;
  /** @nullable */
  cancel_reason?: string | null;
  /** @nullable */
  cancel_restocked?: boolean | null;
  /** @nullable */
  cancelled_at?: string | null;
  /** The frozen priced line snapshot the POS renders before finalize. */
  cart: DeliveryOrderCart;
  channel: string;
  /** @nullable */
  confirmed_at?: string | null;
  created_at: string;
  /** @nullable */
  customer_lat?: number | null;
  /** @nullable */
  customer_lng?: number | null;
  customer_name: string;
  customer_phone: string;
  /** @nullable */
  delivered_at?: string | null;
  delivery_fee: number;
  /** @nullable */
  delivery_notes?: string | null;
  /** @nullable */
  delivery_ref?: string | null;
  /** @nullable */
  delivery_zone_id?: string | null;
  discount_amount?: number;
  /**
     * Frozen channel discount on the item subtotal. `discount_amount` is 0
     * when none.
     * @nullable
     */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  discount_value?: number;
  /**
     * How `road_distance_meters` was measured: `osrm` (routed) or `haversine`
     * (straight line — the routing fallback, and always the in-mall walking
     * distance). `None` exactly when no distance was recorded.
     * @nullable
     */
  distance_source?: string | null;
  /** Extra prep minutes the teller added on top of the branch base (multiples of 5). */
  extra_prep_minutes: number;
  /** @nullable */
  floor?: string | null;
  id: string;
  /** @nullable */
  landmark?: string | null;
  /** @nullable */
  order_id?: string | null;
  org_id: string;
  otp_verified: boolean;
  /** @nullable */
  out_for_delivery_at?: string | null;
  /**
     * What was actually taken at the door. Set at finalize and only then;
     * `Some` exactly when the order is `delivered`.
     * @nullable
     */
  payment_method?: string | null;
  /**
     * What the customer SAID they would pay with, at checkout. Display only.
     * @nullable
     */
  payment_method_hint?: string | null;
  /** @nullable */
  place_name?: string | null;
  /** @nullable */
  preparing_at?: string | null;
  /** @nullable */
  ready_at?: string | null;
  /** @nullable */
  receipt_printed_at?: string | null;
  /** @nullable */
  rejected_at?: string | null;
  /** @nullable */
  road_distance_meters?: number | null;
  /**
     * Always 0: the service charge is dine-in only. Present so the till can
     * render the same breakdown for every kind of sale.
     */
  service_charge_amount?: number;
  service_charge_rate_applied?: number;
  status: string;
  subtotal: number;
  /**
     * The tax as priced at intake, under the policy frozen beside it. Inside
     * `total` when `tax_inclusive`, added to it otherwise. Finalize does not
     * re-price: a rate the shop changes between the quote and the door does
     * not move a bill the customer already agreed.
     */
  tax_amount?: number;
  /**
     * Copy of the ONE inclusivity flag (org, branch override) as it stood at
     * intake — not a setting of its own.
     */
  tax_inclusive?: boolean;
  /** Fraction, not a percentage: `0.14` is 14%. */
  tax_rate_applied?: number;
  /**
     * The quote: `subtotal - discount_amount + delivery_fee`, plus
     * `tax_amount` when the tax is exclusive. Replayed verbatim at finalize.
     */
  total: number;
  /** @nullable */
  unit_number?: string | null;
  updated_at: string;
}
