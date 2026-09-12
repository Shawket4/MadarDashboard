/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';

/**
 * One scan's worth of order.
 */
export interface TableOrderRequest {
  /**
     * Who is at the table, if they offered a name. Shown on the bill so the
     * waiter can find them.
     * @nullable
     */
  customer_name?: string | null;
  /**
     * Client-minted, so a phone that resends on a flaky connection does not
     * order twice. This is the ONLY protection against a double-send, because
     * a customer's browser has no outbox to dedup against.
     * @nullable
     */
  idempotency_key?: string | null;
  /** What they want. Named, never priced — see the module docs. */
  items: OrderItemInput[];
  table_id: string;
}
