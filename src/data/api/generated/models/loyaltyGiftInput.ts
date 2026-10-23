/* eslint-disable */
// @ts-nocheck

/**
 * One order line named as the birthday gift.
 */
export interface LoyaltyGiftInput {
  /**
     * Index into `items`.
     * @minimum 0
     * @nullable
     */
  item_index?: number | null;
  /**
     * A ticket settle names the line by `open_ticket_items.id` instead; the
     * server fills in `item_index`.
     * @nullable
     */
  ticket_line_id?: string | null;
}
