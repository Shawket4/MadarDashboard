/* eslint-disable */
// @ts-nocheck

export interface POLineInput {
  /**
     * Piastres for the whole line, as invoiced. Preferred: the unit cost is
     * derived from it exactly (12 000 g for 548.16 EGP is 4.568 piastres/g,
     * where a whole-piastre unit cost made it 5 and the order 600.00).
     * @nullable
     */
  line_cost?: number | null;
  org_ingredient_id: string;
  purchase_unit: string;
  quantity_ordered: number;
  /**
     * Piastres per purchase unit, for clients that predate `line_cost`.
     * Ignored when `line_cost` is sent; one of the two is required.
     * @nullable
     */
  unit_cost?: number | null;
  /**
     * Stock units per purchase unit. Ignored when `purchase_unit` is a known
     * inventory unit (the factor is derived from the ingredient's base unit).
     * @nullable
     */
  units_per_purchase_unit?: number | null;
}
