/* eslint-disable */
// @ts-nocheck
import type { SyncRecipeLine } from './syncRecipeLine';

/**
 * A modifier option, with price/availability resolved for `(branch, channel)`.
 */
export interface SyncOption {
  id: string;
  /** Effective availability (branch_channel → branch → channel → TRUE). */
  is_available: boolean;
  name: string;
  /** Effective price in piastres (branch_channel → branch → channel → catalog default). */
  price: number;
  recipe: SyncRecipeLine[];
  /**
     * The org_ingredient this option swaps out, if it is a swap-style option.
     * @nullable
     */
  replaces_ingredient_id?: string | null;
}
