/* eslint-disable */
// @ts-nocheck

export interface DiscardHeldOrderRequest {
  /** @nullable */
  device_id?: string | null;
  /** Discard even while another device holds the resume claim. */
  force?: boolean;
}
