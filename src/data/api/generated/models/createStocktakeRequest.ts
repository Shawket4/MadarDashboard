/* eslint-disable */
// @ts-nocheck

export interface CreateStocktakeRequest {
  /**
     * Cycle-count scope: only ingredients in this category.
     * @nullable
     */
  category_id?: string | null;
  /** @nullable */
  note?: string | null;
  /**
     * Cycle-count scope: only these ingredients.
     * @nullable
     */
  org_ingredient_ids?: string[] | null;
}
