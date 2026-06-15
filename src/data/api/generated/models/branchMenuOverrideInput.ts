/* eslint-disable */
// @ts-nocheck
import type { BranchSizeOverrideInput } from './branchSizeOverrideInput';

export interface BranchMenuOverrideInput {
  branch_id: string;
  is_available?: boolean;
  menu_item_id: string;
  /**
     * Branch price in piastres; null inherits the org catalog base_price.
     * @nullable
     */
  price_override?: number | null;
  /**
     * Per-size branch prices. `null`/omitted → leave existing size overrides untouched;
   * a list → REPLACE the item's size overrides with exactly that set (empty clears them).
     * @nullable
     */
  sizes?: BranchSizeOverrideInput[] | null;
}
