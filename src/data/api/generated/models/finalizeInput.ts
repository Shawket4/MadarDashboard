/* eslint-disable */
// @ts-nocheck

export interface FinalizeInput {
  /** The actual method the customer paid (overrides the hint). Must be an org method. */
  payment_method: string;
  shift_id: string;
}
