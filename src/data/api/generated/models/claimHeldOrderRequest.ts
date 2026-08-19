/* eslint-disable */
// @ts-nocheck

export interface ClaimHeldOrderRequest {
  /** The resuming device — recorded as the claim holder. */
  device_id: string;
  /** Steal a claim held by another device (that till died mid-edit). */
  force?: boolean;
}
