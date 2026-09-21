/* eslint-disable */
// @ts-nocheck

/**
 * Every field optional — only present keys are updated. Nullable columns that must
 * be clearable (`max_selections`, `swap_category_id`, `legacy_addon_type`) use
 * presence: key absent = keep, `null` = clear, value = set.
 */
export interface PatchGroupRequest {
  /**
     * `none` | `adds` | `swaps`. Changing it re-derives `legacy_addon_type` for old
     * tills: swaps milk → `milk_type`, swaps coffee_bean → `coffee_type`; otherwise
     * the provided/existing type (a magic type on a non-swap group becomes `extra`).
     * @nullable
     */
  effect?: string | null;
  /**
     * Reactivate (`true`) or deactivate (`false`) the group.
     * @nullable
     */
  is_active?: boolean | null;
  /** @nullable */
  is_required?: boolean | null;
  /**
     * Absent = keep; `null` = clear (group invisible to old tills); a string = set.
     * @nullable
     */
  legacy_addon_type?: string | null;
  /**
     * Absent = keep; `null` = no upper bound; a number = set.
     * @nullable
     */
  max_selections?: number | null;
  /** @nullable */
  min_selections?: number | null;
  /** @nullable */
  name?: string | null;
  name_translations?: unknown;
  /** @nullable */
  selection_type?: string | null;
  /** @nullable */
  sort?: number | null;
  /**
     * Absent = keep; `null` = clear; a category id of this org = set.
     * @nullable
     */
  swap_category_id?: string | null;
}
