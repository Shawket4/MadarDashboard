/* eslint-disable */
// @ts-nocheck

export interface ValuationRow {
  /**
     * Piastres per unit; `null` ⟺ unknown.
     * @nullable
     */
  cost_per_unit?: number | null;
  current_stock: number;
  ingredient_name: string;
  org_ingredient_id: string;
  unit: string;
  /**
     * current_stock × cost_per_unit in piastres; `null` when cost unknown.
     * @nullable
     */
  value?: number | null;
}
