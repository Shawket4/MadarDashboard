/* eslint-disable */
// @ts-nocheck

export interface ReplaceIdentityResponse {
  /** True when two customers were combined into this one. */
  combined: boolean;
  customer_id: string;
  first_name: string;
  /** The new number, masked. The client already holds its device token. */
  phone_hint: string;
}
