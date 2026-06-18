/* eslint-disable */
// @ts-nocheck

/**
 * Customer-safe tracking view of a delivery order, keyed by its opaque UUID
 * (same capability-URL trust model as the device-token flow). No phone number
 * is exposed; the destination fields are the customer's own inputs. Powers the
 * public `/track/{id}` page (polled, since the public surface has no SSE).
 */
export interface DeliveryTracking {
  /** @nullable */
  address_line?: string | null;
  branch_name: string;
  /** @nullable */
  cancel_reason?: string | null;
  /** @nullable */
  cancelled_at?: string | null;
  channel: string;
  /** @nullable */
  confirmed_at?: string | null;
  created_at: string;
  customer_name: string;
  /** @nullable */
  delivered_at?: string | null;
  delivery_fee: number;
  /** @nullable */
  delivery_ref?: string | null;
  discount_amount: number;
  /** Branch base prep time + the teller's per-order addition (minutes). */
  estimated_prep_minutes: number;
  /** @nullable */
  floor?: string | null;
  id: string;
  org_id: string;
  /** @nullable */
  out_for_delivery_at?: string | null;
  /** @nullable */
  payment_method_hint?: string | null;
  /** @nullable */
  place_name?: string | null;
  /** @nullable */
  preparing_at?: string | null;
  /** @nullable */
  ready_at?: string | null;
  /** @nullable */
  rejected_at?: string | null;
  status: string;
  subtotal: number;
  total: number;
  /** @nullable */
  unit_number?: string | null;
}
