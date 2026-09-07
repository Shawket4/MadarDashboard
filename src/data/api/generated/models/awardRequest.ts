/* eslint-disable */
// @ts-nocheck

export interface AwardRequest {
  branch_id: string;
  /** @nullable */
  customer_id?: string | null;
  /**
     * The server's order id — the history path, where the order is synced.
     * @nullable
     */
  order_id?: string | null;
  /**
     * The client-minted idempotency key — the just-checked-out path, where the
     * order may not have reached the server yet. Resolved to the same order.
     * @nullable
     */
  order_key?: string | null;
  /** @nullable */
  phone?: string | null;
  /**
     * When the teller pressed the button. Absent = now.
     *
     * An offline till stamps the press and queues it, so a drain days later
     * still credits an award that was made in time. Bounded on arrival (see
     * the module docs) so it cannot be used to reach outside the window.
     * @nullable
     */
  requested_at?: string | null;
  /**
     * Who. A scanned pass token, a typed phone, or an already-resolved member.
     * @nullable
     */
  token?: string | null;
}
