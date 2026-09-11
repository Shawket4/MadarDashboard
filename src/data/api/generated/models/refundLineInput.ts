/* eslint-disable */
// @ts-nocheck

/**
 * One line of the order a refund is for. Optional detail: an overcharge or a
 * goodwill gesture is an amount with no line behind it.
 */
export interface RefundLineInput {
  /**
     * The share of the refund's amount attributed to this line, minor units.
     * Zero is allowed (a reward line sent back for nothing). The lines of a
     * refund may not add up to more than the refund.
     */
  amount: number;
  order_item_id: string;
  /**
     * How many of the line's units this refund is for. Held, cumulatively
     * across every refund of the order, to what the line sold.
     */
  quantity: number;
}
