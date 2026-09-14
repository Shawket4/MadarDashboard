/* eslint-disable */
// @ts-nocheck

/**
 * What the system says one method took on a till.
 */
export interface MethodTotal {
  is_cash: boolean;
  method: string;
  order_count: number;
  /** @nullable */
  payment_method_id?: string | null;
  system_total: number;
}
