/* eslint-disable */
// @ts-nocheck

export interface MenuEngineeringRow {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  category_name?: string | null;
  /** star | workhorse | challenge | dog (Foodics names). */
  class: string;
  /** Lines in the window whose sale-time cost could not be resolved.
   * Always reports snapshot data quality, regardless of `cost_basis` —
   * under `current`, an included row can still carry snapshot gaps. */
  cost_missing_lines: number;
  item_name: string;
  /** Average profit per unit, piastres (`(sales - cost) / qty`). */
  item_profit: number;
  menu_item_id: string;
  /** "high" | "low" — Kasavana-Smith 70% rule (0.70 / n). */
  popularity_category: string;
  /** Share of units among the rows in this report (cost-tracked only). */
  popularity_pct: number;
  /** "high" | "low" — vs weighted-average per-unit profit. */
  profit_category: string;
  /** Units sold (standalone lines only — bundle lines are excluded so the
   * per-unit economics stay clean; bundle performance has its own report). */
  quantity_sold: number;
  /** Revenue from those lines, piastres. */
  sales: number;
  /** `"one_size"` for items without sizes. */
  size_label: string;
  /** COGS in piastres. Snapshot basis: `SUM(line_cost)` over the window;
   * current basis: today's recipe rollup × quantity. Rows where this is
   * unresolvable are excluded from the report, so it is always present. */
  total_cost: number;
  /** `sales - total_cost`, piastres. */
  total_profit: number;
}
