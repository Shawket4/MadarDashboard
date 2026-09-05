/* eslint-disable */
// @ts-nocheck

export interface StockRow {
  below_par: boolean;
  /**
     * Piastres per unit; `null` ⟺ cost never entered.
     * @nullable
     */
  cost_per_unit?: number | null;
  ingredient_name: string;
  on_hand: number;
  org_ingredient_id: string;
  /**
     * Reorder point; `null` = not set at this branch.
     * @nullable
     */
  par_min?: number | null;
  unit: string;
}
