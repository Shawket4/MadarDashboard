import type { MenuEngineeringRow } from "@/data/api/generated/models";

export type MenuClass = "star" | "workhorse" | "challenge" | "dog";

/** Badge tint per Foodics class (Badge has no semantic variants, so we tint via className). */
export const CLASS_BADGE: Record<MenuClass, string> = {
  star: "border-transparent bg-success/15 text-success",
  workhorse: "border-transparent bg-info/15 text-info",
  challenge: "border-transparent bg-warning/15 text-warning",
  dog: "border-transparent bg-destructive/15 text-destructive",
};

/** Scatter dot fill per class (semantic OKLCH tokens). */
export const CLASS_COLOR: Record<MenuClass, string> = {
  star: "var(--success)",
  workhorse: "var(--info)",
  challenge: "var(--warning)",
  dog: "var(--destructive)",
};

/** Kasavana–Smith popularity threshold: 0.70 / number of menu rows. */
export const popularityThreshold = (rows: MenuEngineeringRow[]): number =>
  rows.length > 0 ? 0.7 / rows.length : 0;

/** Weighted-average per-unit profit over cost-tracked rows (piastres). */
export const weightedAvgUnitProfit = (rows: MenuEngineeringRow[]): number => {
  let profit = 0;
  let qty = 0;
  for (const r of rows) {
    profit += r.total_profit;
    qty += r.quantity_sold;
  }
  return qty > 0 ? profit / qty : 0;
};

/** Realized margin over the window: total_profit / sales. */
export const marginPct = (r: MenuEngineeringRow): number | null =>
  r.sales > 0 ? r.total_profit / r.sales : null;
