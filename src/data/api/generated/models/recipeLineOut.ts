/* eslint-disable */
// @ts-nocheck

/**
 * One recipe line, hydrated with the ingredient name and a per-line cost.
 */
export interface RecipeLineOut {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  /**
     * Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked/uncosted),
     * never shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.
     * @nullable
     */
  line_cost_piastres?: number | null;
  /** Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity). */
  quantity: string;
  unit: string;
}
