/* eslint-disable */
// @ts-nocheck

export interface SignupRequest {
  /** The six-digit code from WhatsApp. */
  code: string;
  email: string;
  owner_name: string;
  /** At least 8 characters. */
  password: string;
  /** The phone the code went to. */
  phone: string;
  /** The shop's name. It names the organization and its first branch. */
  shop_name: string;
  /** `cafe` | `restaurant`: the role template the roles start from. */
  template: string;
  /** The version of the terms the owner accepted (stored with the org). */
  terms_version: string;
}
