/* eslint-disable */
// @ts-nocheck

export interface RewardItem {
  /** Menu price in piastres — what the reward is worth, for the admin's sake. */
  base_price: number;
  /**
     * How much of that currency it costs. Per item, so one catalogue holds
     * "espresso, 5 visits" beside "cake, 10 visits".
     */
  cost_amount: number;
  /** `"points"` or `"visits"` — what this reward is bought with. */
  cost_currency: string;
  /** @nullable */
  image_url?: string | null;
  menu_item_id: string;
  /** Denormalised for display so the teller and the pass need no menu join. */
  name: string;
  sort_order: number;
}
