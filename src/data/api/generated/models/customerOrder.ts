/* eslint-disable */
// @ts-nocheck

export interface CustomerOrder {
  branch_id: string;
  /** @nullable */
  branch_name?: string | null;
  created_at: string;
  id: string;
  /** @nullable */
  order_ref?: string | null;
  status: string;
  total_amount: number;
}
