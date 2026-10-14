/* eslint-disable */
// @ts-nocheck

export interface SignupRequest {
  /** @nullable */
  code?: string | null;
  email: string;
  owner_name: string;
  /** At least 8 characters. */
  password: string;
  /**
     * Deprecated, for the dashboard build before the verify step: the phone
     * and code checked here instead of by `/public/signup/verify`.
     * @nullable
     */
  phone?: string | null;
  /** The shop's name. It names the organization and its first branch. */
  shop_name: string;
  /**
     * The token `POST /public/signup/verify` answered with: the proof that the
     * owner holds the phone. The phone is the one it was issued for.
     * @nullable
     */
  signup_token?: string | null;
  /** `cafe` | `restaurant`: the role template the roles start from. */
  template: string;
  /** The version of the terms the owner accepted (stored with the org). */
  terms_version: string;
}
