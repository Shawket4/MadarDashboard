/* eslint-disable */
// @ts-nocheck

export interface CreateStocktakeRequest {
  /**
     * Cycle-count scope: snapshot only ingredients in this catalog category.
   * Omit (with org_ingredient_ids) for a full-branch count.
     * @nullable
     */
  category?: string | null;
  /** @nullable */
  note?: string | null;
  /**
     * Cycle-count scope: snapshot only these specific ingredients.
     * @nullable
     */
  org_ingredient_ids?: string[] | null;
}
