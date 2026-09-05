/* eslint-disable */
// @ts-nocheck

export interface PublicBookingInput {
  branch_id: string;
  /**
     * From `/public/otp/verify`; required when the branch requires OTP.
     * @nullable
     */
  device_token?: string | null;
  guest_name: string;
  /** @nullable */
  locale?: string | null;
  /** @nullable */
  notes?: string | null;
  party_size: number;
  phone: string;
  starts_at: string;
}
