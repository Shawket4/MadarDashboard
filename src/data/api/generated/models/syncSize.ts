/* eslint-disable */
// @ts-nocheck

/**
 * A size (menu_item_sizes row) with its price/availability resolved for the
 * requested `(branch, channel)`.
 */
export interface SyncSize {
  id: string;
  /** Effective availability (branch_channel → branch → channel → TRUE). */
  is_available: boolean;
  label: string;
  /** Effective price in piastres (branch_channel → branch → channel → catalog default). */
  price: number;
}
