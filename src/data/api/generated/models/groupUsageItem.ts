/* eslint-disable */
// @ts-nocheck
import type { LintIssue } from './lintIssue';

/**
 * One menu item a group is attached to, as the group editor lists it.
 */
export interface GroupUsageItem {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
  /**
     * Swap groups only: the option preselected on this item, i.e. the first offered
     * option (sort, name) carrying the recipe's ingredient of the swap category, on
     * the item's first size that has one. `null` for non-swap groups or when the
     * recipe's ingredient is not offered (lint F4 / F5).
     * @nullable
     */
  default_option_id?: string | null;
  /** Active options this item offers. */
  included_option_count: number;
  /**
     * `null` = the item offers every option of the group.
     * @nullable
     */
  included_option_ids?: string[] | null;
  /** Effective for this item: attachment override, else the group default. */
  is_required: boolean;
  item_id: string;
  item_is_active: boolean;
  item_name: string;
  /**
     * `slot` | `allowlist` | `options` (old-till provenance).
     * @nullable
     */
  legacy_origin?: string | null;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
  /** Lint findings F4–F10 about this item and this group. */
  warnings: LintIssue[];
}
