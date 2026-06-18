/* eslint-disable */
// @ts-nocheck

export interface OrderHistorySummary {
  /** @nullable */
  address_line?: string | null;
  branch_id: string;
  branch_name: string;
  channel: string;
  created_at: string;
  /** @nullable */
  customer_lat?: number | null;
  /** @nullable */
  customer_lng?: number | null;
  customer_name: string;
  delivery_fee: number;
  /** @nullable */
  delivery_ref?: string | null;
  discount_amount: number;
  id: string;
  /** Frozen cart snapshot: the items at the time of the order (for display). */
  items: unknown;
  /** @nullable */
  place_name?: string | null;
  status: string;
  subtotal: number;
  total: number;
}
