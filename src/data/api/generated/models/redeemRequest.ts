/* eslint-disable */
// @ts-nocheck

export interface RedeemRequest {
  branch_id: string;
  customer_id: string;
  /**
     * Which reward was handed over. Optional so a branch that has curated no
     * catalogue can still redeem, but recorded whenever it is known.
     * @nullable
     */
  reward_menu_item_id?: string | null;
}
