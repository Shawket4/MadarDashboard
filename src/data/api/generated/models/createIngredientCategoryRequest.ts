/* eslint-disable */
// @ts-nocheck

export interface CreateIngredientCategoryRequest {
  /**
     * Defaults to `true` for slug `packaging`, else `false`.
     * @nullable
     */
  is_packaging?: boolean | null;
  name: string;
  /**
     * Optional explicit slug (`[a-z0-9_]`); derived from the name when omitted.
     * @nullable
     */
  slug?: string | null;
  /** @nullable */
  sort_order?: number | null;
}
