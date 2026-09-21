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
  /**
     * Option lines only: the size this amount is for (`null` = every size).
     * @nullable
     */
  size_label?: string | null;
  /**
     * Where the line came from: `own` (typed on this size; also legacy NULL rows),
     * `base` (recipe base), `rule` (packaging rule) or `linked` (copied from the
     * item this one follows). Only `own` lines are edited by
     * `PUT /menu-item-sizes/{id}/recipe`.
     * @nullable
     */
  source?: string | null;
  unit: string;
}
