/* eslint-disable */
// @ts-nocheck
import type { SyncOptionNameTranslations } from './syncOptionNameTranslations';
import type { SyncRecipeLine } from './syncRecipeLine';

/**
 * A modifier option, with price/availability resolved for `(branch, channel)`.
 */
export interface SyncOption {
  id: string;
  /** Effective availability (branch_channel → branch → channel → TRUE). */
  is_available: boolean;
  /**
     * Explicit preselect for non-swap groups (e.g. "White bread"). Swap groups
     * derive their default from the drink's recipe; this is always `false` there.
     */
  is_default?: boolean;
  name: string;
  /**
     * `{locale: name}`, as the dashboard authored it (`{}` when untranslated):
     * a till shows the option in its own language. Additive.
     */
  name_translations?: SyncOptionNameTranslations;
  /** Effective price in piastres (branch_channel → branch → channel → catalog default). */
  price: number;
  recipe: SyncRecipeLine[];
  /**
     * The org_ingredient this option swaps out, if it is a swap-style option.
     * @nullable
     */
  replaces_ingredient_id?: string | null;
}
