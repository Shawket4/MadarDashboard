/* eslint-disable */
// @ts-nocheck

/**
 * One sitting at a table: the bill that was opened on it and what it came to.
 */
export interface TableSitting {
  /**
     * When the bill was settled or voided; `None` while it is still open.
     * @nullable
     */
  closed_at?: string | null;
  /** @nullable */
  customer_name?: string | null;
  /** @nullable */
  guest_count?: number | null;
  /** Minutes between the two, or to now while the bill is still open. */
  minutes: number;
  open_ticket_id: string;
  /**
     * When the party's bill was opened — the closest thing the server has to
     * when they sat down.
     */
  opened_at: string;
  /**
     * The settled sale, when the bill became one.
     * @nullable
     */
  order_id?: string | null;
  /** @nullable */
  order_number?: number | null;
  status: string;
  /** @nullable */
  ticket_ref?: string | null;
  /**
     * What the sale came to, in minor units. `None` for an unsettled or
     * voided bill — a table's takings only count money that was taken.
     * @nullable
     */
  total_amount?: number | null;
}
