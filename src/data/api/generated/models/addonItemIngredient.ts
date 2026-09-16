/* eslint-disable */
// @ts-nocheck

export interface AddonItemIngredient {
  /**
     * The ingredient's category (additive, B12): lets the POS know an extra
     * shot is a `coffee_bean` and follows the drink's chosen bean.
     * @nullable
     */
  category_id?: string | null;
  /**
     * Slug of [`Self::category_id`] (`milk`, `coffee_bean`, `packaging`, …).
     * @nullable
     */
  category_slug?: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
}
