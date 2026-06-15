/* eslint-disable */
// @ts-nocheck
import type { BranchSizeOverride } from './branchSizeOverride';

export interface BranchMenuOverride {
  branch_id: string;
  /** False disables the item at this branch (excluded from the branch menu). */
  is_available: boolean;
  menu_item_id: string;
  /**
     * Branch price in piastres; null inherits the org catalog base_price.
     * @nullable
     */
  price_override?: number | null;
  /** Per-size branch prices for this item (empty when none). Availability is item-level. */
  sizes?: BranchSizeOverride[];
  updated_at: string;
}
