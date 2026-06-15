/* eslint-disable */
// @ts-nocheck

export interface BranchAddonOverride {
  addon_item_id: string;
  branch_id: string;
  /** False disables the addon at this branch (excluded from the branch addon list). */
  is_available: boolean;
  /**
     * Branch price in piastres; null inherits the org default_price.
     * @nullable
     */
  price_override?: number | null;
  updated_at: string;
}
