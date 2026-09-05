/* eslint-disable */
// @ts-nocheck

export interface CreateIngredientCategoryRequest {
  name: string;
  /**
     * Optional explicit slug (`[a-z0-9_]`); derived from the name when omitted.
     * @nullable
     */
  slug?: string | null;
  /** @nullable */
  sort_order?: number | null;
}
