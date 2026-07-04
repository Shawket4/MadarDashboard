/* eslint-disable */
// @ts-nocheck

export interface OrgIngredient {
  category: string;
  /**
     * Piastres per unit. `null` ⟺ never entered (unknown, NOT free) —
     * recipes using this ingredient are cost-missing everywhere.
     * @nullable
     */
  cost_per_unit?: number | null;
  created_at: string;
  /**
     * Grams per millilitre, bridging weight↔volume in recipes; `null` = none.
     * @nullable
     */
  density_g_per_ml?: number | null;
  /** @nullable */
  description?: string | null;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  /**
     * How many BASE STOCK units one `pack_unit` yields; `null` = none.
     * @nullable
     */
  pack_size?: number | null;
  /**
     * Named purchase pack (e.g. "case", "sack"); `null` = none.
     * @nullable
     */
  pack_unit?: string | null;
  /**
     * Default supplier for reordering this ingredient; `null` = none set.
     * @nullable
     */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
  unit: string;
  updated_at: string;
  /**
     * Usable % after trim/cook loss (e.g. 70 = 70%); `null` = 100%. Recipe
     * quantities are grossed up by this at save time.
     * @nullable
     */
  yield_pct?: number | null;
}
