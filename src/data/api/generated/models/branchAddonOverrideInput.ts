/* eslint-disable */
// @ts-nocheck

export interface BranchAddonOverrideInput {
  addon_item_id: string;
  branch_id: string;
  is_available?: boolean;
  /**
     * Branch price in piastres; null inherits the org default_price.
     * @nullable
     */
  price_override?: number | null;
}
