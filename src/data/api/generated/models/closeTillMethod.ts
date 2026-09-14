/* eslint-disable */
// @ts-nocheck

export interface CloseTillMethod {
  is_cash: boolean;
  method: string;
  order_count: number;
  /** @nullable */
  payment_method_id?: string | null;
  system_total: number;
}
