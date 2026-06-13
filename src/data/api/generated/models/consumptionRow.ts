/* eslint-disable */
// @ts-nocheck

export interface ConsumptionRow {
  consumed_qty: number;
  /**
     * Consumption valued in piastres; `null` if any contributing cost unknown.
     * @nullable
     */
  consumed_value?: number | null;
  ingredient_name: string;
  org_ingredient_id: string;
  unit: string;
}
