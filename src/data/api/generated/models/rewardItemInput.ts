/* eslint-disable */
// @ts-nocheck

export interface RewardItemInput {
  /**
     * Omitted follows the scope's `default_reward_cost`.
     * @nullable
     */
  cost_amount?: number | null;
  /**
     * `"points"` or `"visits"`. Omitted follows the scope's mode.
     * @nullable
     */
  cost_currency?: string | null;
  menu_item_id: string;
}
