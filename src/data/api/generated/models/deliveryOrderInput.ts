/* eslint-disable */
// @ts-nocheck
import type { CartLineInput } from './cartLineInput';

export interface DeliveryOrderInput {
  /** @nullable */
  address_line?: string | null;
  branch_id: string;
  channel: string;
  /** @nullable */
  customer_lat?: number | null;
  /** @nullable */
  customer_lng?: number | null;
  customer_name: string;
  customer_phone: string;
  /** @nullable */
  delivery_notes?: string | null;
  /** Device-trust token from OTP verify (proves the phone). */
  device_token: string;
  /** @nullable */
  floor?: string | null;
  items: CartLineInput[];
  /** @nullable */
  landmark?: string | null;
  /** "cash" | "card" — a hint the teller can change at finalize. */
  payment_method_hint: string;
  /** @nullable */
  place_name?: string | null;
  /** @nullable */
  unit_number?: string | null;
}
