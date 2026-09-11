/* eslint-disable */
// @ts-nocheck
import type { RefundLineInput } from './refundLineInput';
import type { RefundReason } from './refundReason';

export interface CreateRefundRequest {
  /**
     * Minor units, > 0. Together with every refund already on the order it
     * may not exceed `orders.total_amount`.
     */
  amount: number;
  /**
     * Client-minted idempotency key. A retried request or a replayed offline
     * queue carrying the same key gets the original refund back instead of
     * handing the money out again.
     * @nullable
     */
  client_ref?: string | null;
  /**
     * When the refund was issued. Omit for live requests — the server stamps
     * `now()`. An offline till sends the real time; future values are rejected.
     * @nullable
     */
  issued_at?: string | null;
  lines?: RefundLineInput[];
  /**
     * How the money went back — a name from the org's payment-method
     * vocabulary. One tender per refund; a split is two refunds.
     */
  method: string;
  /**
     * Free-text explanation. Required when `reason` is `other`.
     * @nullable
     */
  note?: string | null;
  /** The settled sale the money goes back against. */
  order_id: string;
  reason: RefundReason;
  /**
     * The shift whose drawer the money leaves. Omit for a live request and the
     * actor's own open shift at the order's branch is used; a replayed offline
     * refund must name the shift it was issued in, the way a queued sale does.
     * @nullable
     */
  shift_id?: string | null;
}
