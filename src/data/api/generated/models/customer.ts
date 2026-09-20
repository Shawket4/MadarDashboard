/* eslint-disable */
// @ts-nocheck

export interface Customer {
  /** @nullable */
  birth_day?: number | null;
  /** @nullable */
  birth_month?: number | null;
  created_at: string;
  id: string;
  /** A live loyalty membership exists for this customer (same id). */
  is_member?: boolean;
  /** @nullable */
  last_order_at?: string | null;
  /**
     * `en` or `ar`; null when never asked.
     * @nullable
     */
  locale?: string | null;
  /**
     * DEPRECATED, kept for one release: a loyalty membership now shares the
     * customer's id, so this is `id` when `is_member` and null otherwise.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  marketing_opt_out?: boolean;
  name: string;
  /** @nullable */
  notes?: string | null;
  orders_count: number;
  /** @nullable */
  phone?: string | null;
  /**
     * Null when not a member.
     * @nullable
     */
  points_balance?: number | null;
  /**
     * Where the customer first came from: `pos`, `online`, `loyalty`,
     * `booking`, `table_qr`, `aggregator` or `dashboard`.
     */
  source?: string;
  /** Sum of completed sales, minor units. */
  total_spent: number;
  updated_at: string;
  /**
     * Null when not a member.
     * @nullable
     */
  visits_balance?: number | null;
}
