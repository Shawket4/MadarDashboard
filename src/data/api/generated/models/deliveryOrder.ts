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
  /** @nullable */
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
  status: string;
  subtotal: number;
  total: number;
  /** @nullable */
  unit_number?: string | null;
  updated_at: string;
}
