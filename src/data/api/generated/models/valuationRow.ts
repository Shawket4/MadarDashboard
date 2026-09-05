/* eslint-disable */
// @ts-nocheck

export interface ValuationRow {
  /**
     * Piastres per unit; `null` ⟺ unknown.
     * @nullable
     */
  cost_per_unit?: number | null;
  ingredient_name: string;
  on_hand: number;
  org_ingredient_id: string;
  unit: string;
  /**
     * on_hand × cost_per_unit in piastres; `null` when cost unknown.
     * @nullable
     */
  value?: number | null;
}
