/* eslint-disable */
// @ts-nocheck
import type { CartLineInput } from './cartLineInput';

export interface DeliveryOrderInput {
  /** @nullable */
  address_line?: string | null;
  branch_id: string;
  channel: string;
  /**
     * A one-time order to a different phone, at a branch that requires OTP:
     * the device token proving THAT phone.
     * @nullable
     */
  contact_device_token?: string | null;
  /** @nullable */
  customer_lat?: number | null;
  /** @nullable */
  customer_lng?: number | null;
  customer_name: string;
  customer_phone: string;
  /** @nullable */
  delivery_notes?: string | null;
  /**
     * Device-trust token from OTP verify (proves the phone). With
     * `member_token` it must prove the CUSTOMER's phone, not the typed one.
     */
  device_token: string;
  /** @nullable */
  floor?: string | null;
  /**
     * What a typed name/phone that differs from the customer's MEANS:
     * `"one_time"` (ordering for someone else: the order's snapshot carries
     * the typed contact, the profile is untouched) or `"update_name"` (correct
     * the stored name). A different PHONE with no choice is refused with 409
     * `IDENTITY_CHOICE_REQUIRED` (`kind: "phone"`); a different name alone
     * defaults to one-time. Ignored without `member_token`.
     * @nullable
     */
  identity_change?: string | null;
  items: CartLineInput[];
  /** @nullable */
  landmark?: string | null;
  /**
     * Ordering from a loyalty card ("order now"): the order belongs to the
     * card's customer whatever name and phone are typed. The server compares
     * the typed contact with the customer's and classifies the difference —
     * see `identity_change`.
     * @nullable
     */
  member_token?: string | null;
  /** "cash" | "card" — a hint the teller can change at finalize. */
  payment_method_hint: string;
  /** @nullable */
  place_name?: string | null;
  /**
     * Keep the address on the customer's profile. Defaults to yes for an
     * ordinary order and to NO for a one-time order for someone else.
     * @nullable
     */
  save_address?: boolean | null;
  /** @nullable */
  unit_number?: string | null;
}
