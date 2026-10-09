/* eslint-disable */
// @ts-nocheck

export interface PurchaseOrderLine {
  id: string;
  ingredient_name: string;
  /**
     * Piastres for the whole line, as on the supplier's invoice. The unit
     * cost is derived from it, never the other way round.
     */
  line_cost: number;
  org_ingredient_id: string;
  purchase_order_id: string;
  purchase_unit: string;
  quantity_ordered: number;
  quantity_received: number;
  /** Ingredient's base stock unit. */
  unit: string;
  /**
     * Piastres per PURCHASE unit, rounded to whole piastres (older readers;
     * the truth is `line_cost`, the precise figure `unit_cost_exact`).
     */
  unit_cost: number;
  /** Piastres per PURCHASE unit, exact: `line_cost / quantity_ordered`. */
  unit_cost_exact: number;
  units_per_purchase_unit: number;
}
