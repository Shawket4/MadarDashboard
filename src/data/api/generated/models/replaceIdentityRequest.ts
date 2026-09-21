/* eslint-disable */
// @ts-nocheck

export interface ReplaceIdentityRequest {
  /** Proof of the CURRENT phone. */
  device_token: string;
  /**
     * Also correct the name.
     * @nullable
     */
  name?: string | null;
  new_phone: string;
  /** Proof of the NEW phone (the client runs `/public/otp/request|verify` on it). */
  new_phone_device_token: string;
}
