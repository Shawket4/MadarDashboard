/* eslint-disable */
// @ts-nocheck

export interface PublicCreateBookingRequest {
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  /** Device-trust token from the delivery OTP flow, proving this phone is verified. */
  device_token: string;
  /**
     * `reservation` or `walk_in`; defaults from whether `reserved_for` is set.
     * @nullable
     */
  kind?: string | null;
  /** @nullable */
  lat?: number | null;
  /** @nullable */
  lng?: number | null;
  /** @nullable */
  party_size?: number | null;
  /** @nullable */
  reserved_for?: string | null;
}
