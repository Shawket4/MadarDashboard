/* eslint-disable */
// @ts-nocheck

/**
 * An org ingredient referenced by a returned option recipe.
 */
export interface SyncIngredient {
  /**
     * The ingredient's category (additive, B12), so the POS can mirror the
     * resolver's "extras follow the drink's choice" pass by slug.
     * @nullable
     */
  category_id?: string | null;
  /**
     * Slug of [`Self::category_id`] (`milk`, `coffee_bean`, `packaging`, …).
     * @nullable
     */
  category_slug?: string | null;
  id: string;
  name: string;
  unit: string;
}
