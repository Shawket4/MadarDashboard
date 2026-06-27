/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';

export interface CreateOpenTicketRequest {
  branch_id: string;
  /** @nullable */
  customer_name?: string | null;
  /**
     * Optional discount the waiter applied at order time (overridable at settle).
     * @nullable
     */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  /** @nullable */
  guest_count?: number | null;
  /**
     * Client-minted dedup key for the ticket (exactly-once across LAN + cloud).
     * @nullable
     */
  idempotency_key?: string | null;
  /** Client-priced items (same shape as a POS order line) — recorded verbatim. */
  items: OrderItemInput[];
  /** @nullable */
  notes?: string | null;
  /**
     * Per-round dedup key for the first round.
     * @nullable
     */
  round_idempotency_key?: string | null;
  /** @nullable */
  table_id?: string | null;
}
