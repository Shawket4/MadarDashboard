import type { MenuEngineeringRow } from "@/shared/api/generated/models";

export type MenuClass = "star" | "workhorse" | "challenge" | "dog";

/** Badge variants per Foodics class. */
export const CLASS_VARIANT: Record<MenuClass, "success" | "info" | "warning" | "destructive"> = {
  star: "success",
  workhorse: "info",
  challenge: "warning",
  dog: "destructive",
};

/** Scatter dot fill per class (semantic chart palette). */
export const CLASS_COLOR: Record<MenuClass, string> = {
  star: "hsl(var(--success))",
  workhorse: "hsl(var(--info))",
  challenge: "hsl(var(--warning))",
  dog: "hsl(var(--destructive))",
};

/** Kasavana–Smith popularity threshold: 0.70 / number of menu rows. */
export const popularityThreshold = (rows: MenuEngineeringRow[]): number =>
  rows.length > 0 ? 0.7 / rows.length : 0;

/** Weighted-average per-unit profit over cost-tracked rows (piastres). */
export const weightedAvgUnitProfit = (rows: MenuEngineeringRow[]): number => {
  let profit = 0;
  let qty = 0;
  for (const r of rows) {
    if (r.total_profit != null) {
      profit += r.total_profit;
      qty += r.quantity_sold;
    }
  }
  return qty > 0 ? profit / qty : 0;
};
