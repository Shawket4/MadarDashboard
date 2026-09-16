/* eslint-disable */
// @ts-nocheck

export interface Customer {
  created_at: string;
  id: string;
  /** @nullable */
  last_order_at?: string | null;
  /** @nullable */
  loyalty_customer_id?: string | null;
  name: string;
  /** @nullable */
  notes?: string | null;
  orders_count: number;
  /** @nullable */
  phone?: string | null;
  /** Sum of completed sales, minor units. */
  total_spent: number;
  updated_at: string;
}
