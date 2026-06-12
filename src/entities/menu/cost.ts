/**
 * Pure cost & margin helpers — all inputs and outputs in piastres.
 * `null` means "unknown", never "free": any recipe line whose ingredient is
 * unlinked, missing from the catalog, or has no cost yet poisons the total.
 * A cost of exactly 0 on a linked ingredient is a real (free) cost.
 */

export interface RecipeLine {
  org_ingredient_id?: string | null;
  quantity_used: number;
}

export interface CatalogCostSource {
  id: string;
  /** Piastres per unit. 0 = legacy "never set" → treated as unknown only when flagged below. */
  cost_per_unit: number | null;
}

export interface PricedItem {
  /** Current price in piastres. */
  base_price: number;
}

/**
 * Browser-side recipe cost estimate for one size: Σ quantity × cost_per_unit.
 * Returns null when any line's ingredient cost is unknown.
 */
export function recipeCost(lines: RecipeLine[], catalog: CatalogCostSource[]): number | null {
  if (lines.length === 0) return null;
  const costById = new Map(catalog.map((c) => [c.id, c.cost_per_unit]));
  let total = 0;
  for (const line of lines) {
    if (!line.org_ingredient_id) return null; // unlinked ingredient → unknown
    const perUnit = costById.get(line.org_ingredient_id);
    if (perUnit === undefined || perUnit === null) return null; // not in catalog / no cost
    total += perUnit * line.quantity_used;
  }
  return Math.round(total);
}

/**
 * Per-unit margin in piastres: price − recipeCost. Null when the cost is
 * unknown — never coerce a missing cost to zero.
 */
export function itemMargin(
  item: PricedItem,
  lines: RecipeLine[],
  catalog: CatalogCostSource[],
): number | null {
  const cost = recipeCost(lines, catalog);
  if (cost === null) return null;
  return item.base_price - cost;
}

/** Margin as a 0..1 ratio of price; null when cost unknown or price is 0. */
export function itemMarginPct(
  item: PricedItem,
  lines: RecipeLine[],
  catalog: CatalogCostSource[],
): number | null {
  const margin = itemMargin(item, lines, catalog);
  if (margin === null || item.base_price <= 0) return null;
  return margin / item.base_price;
}
