/* eslint-disable */
// @ts-nocheck

/**
 * One reward applied to one line of the cart.
 */
export interface LoyaltyRedemptionInput {
  /**
     * Index into `items`. An index rather than an id because a cart may hold
     * the same menu item on two lines with different modifiers, and only the
     * position tells them apart.
     *
     * Optional because a TICKET settle names its lines by id instead (see
     * `ticket_line_id`) and the server fills this in — a till settling a ticket
     * cannot see the order the server will flatten its rounds into, and a
     * guessed index takes the wrong item off the bill.
     * @minimum 0
     * @nullable
     */
  item_index?: number | null;
  /**
     * `open_ticket_items.id` — how a ticket settle names the line to cover.
     * Resolved to `item_index` by `settle_open_ticket` before pricing.
     * @nullable
     */
  ticket_line_id?: string | null;
  /**
     * How many of that line's units the reward covers. Defaults to one.
     * @nullable
     */
  units?: number | null;
}
