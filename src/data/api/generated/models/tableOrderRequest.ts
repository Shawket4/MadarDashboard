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
     * Their phone, if they offered one. Optional and never required: with a
     * valid number (and a name) the bill is linked to that customer — created
     * on first contact, `source = table_qr` — so the visit counts toward them.
     * A number that is not valid is ignored; the order is never refused.
     * @nullable
     */
  customer_phone?: string | null;
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
