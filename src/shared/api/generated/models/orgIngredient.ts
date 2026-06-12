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
  /** @nullable */
  description?: string | null;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  unit: string;
  updated_at: string;
}
