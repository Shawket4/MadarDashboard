/* eslint-disable */
// @ts-nocheck

export interface IngredientCategory {
  created_at: string;
  id: string;
  /** Live (non-deleted) ingredients in this category. */
  ingredient_count: number;
  name: string;
  org_id: string;
  /**
     * Stable machine key (`general`, `milk`, `coffee_bean`, …). `milk` and
     * `coffee_bean` carry swap semantics in the menu; the slug never changes.
     */
  slug: string;
  sort_order: number;
  updated_at: string;
}
