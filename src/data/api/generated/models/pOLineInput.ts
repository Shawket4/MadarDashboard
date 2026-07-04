/* eslint-disable */
// @ts-nocheck

export interface POLineInput {
  org_ingredient_id: string;
  purchase_unit: string;
  quantity_ordered: number;
  /** Piastres per purchase unit. */
  unit_cost: number;
  /**
     * Stock units per purchase unit. Ignored when `purchase_unit` is a known
     * inventory unit (the factor is derived from the ingredient's base unit).
     * @nullable
     */
  units_per_purchase_unit?: number | null;
}
