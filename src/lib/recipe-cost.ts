/**
 * Recipe cost, margin and the food-cost colour, as the server computes them:
 * madar-money's `cost` and madar-units' `recipe_base_qty`, called through
 * WebAssembly (`@/lib/rules`). The choices (SHARED_RULES_PLAN.md, Step 2):
 * - D2: a cost of 0 is known (free); only a missing cost is unknown;
 * - D3: an editor holds the amount typed (before yield loss); its estimate
 *   costs what the server will store, converted and grossed up by the yield;
 * - D4: a recipe's cost is its known lines' exact sum rounded once, flagged
 *   incomplete when a line is unknown; the margin is over that rounded cost,
 *   and only for a complete one;
 * - D5: one colour rule, the food-cost band.
 * recipe-cost.test.ts runs it against madar-shared's cost_vectors.json.
 */
import type { OrgIngredient } from "@/data/api/generated/models";
import { rules, type Band, type RecipeCost } from "@/lib/rules";

export type { Band, RecipeCost };

/** A recipe line as an editor holds it: the amount typed, in `unit`. */
export interface DraftLine {
  ingredient: OrgIngredient | undefined;
  quantity: string;
  unit: string;
}

/** What the line will store, in its ingredient's base unit; `null` when it has no ingredient or quantity, or its unit does not convert. */
const storedQty = ({ ingredient: ing, quantity, unit }: DraftLine): number | null => {
  const typed = parseFloat(quantity);
  if (!ing || !Number.isFinite(typed)) return null;
  const q = rules.recipe_base_qty(typed, unit, ing.unit, ing.density_g_per_ml, ing.yield_pct);
  return typeof q === "number" ? q : null;
};

/** A draft line's cost in piastres; `null` when its quantity or its ingredient's cost is unknown. */
export const draftLineCost = (line: DraftLine): number | null => {
  const qty = storedQty(line);
  const cost = line.ingredient?.cost_per_unit;
  return qty == null || cost == null ? null : rules.line_cost(qty, cost);
};

/** A draft recipe's cost: the known lines' sum, `complete` false when any line is unknown. */
export const draftRecipeCost = (lines: DraftLine[]): RecipeCost =>
  rules.recipe_cost(
    lines.map((l) => {
      const qty = storedQty(l);
      return qty == null ? { qty: 0, cost_per_unit: null } : { qty, cost_per_unit: l.ingredient?.cost_per_unit ?? null };
    }),
  );

/** `(price − cost) / price` over whole piastres; `null` for a partial cost or a price of 0. */
export const recipeMargin = (price: number, cost: RecipeCost): number | null =>
  cost.complete ? rules.margin(price, cost.piastres) : null;

/** The food-cost band of a cost at a price: good < 30 %, fair ≤ 40 %, poor above; `null` unless price > 0. */
export const foodCostBand = (cost: number, price: number): Band | null => rules.food_cost_band(cost, price);

/** The one colour of a band: every margin tone and food-cost chip (D5). */
export const BAND_STYLE: Record<Band, { text: string; chip: string }> = {
  good: { text: "text-success", chip: "bg-success/10 text-success" },
  fair: { text: "text-warning", chip: "bg-warning/10 text-warning" },
  poor: { text: "text-destructive", chip: "bg-destructive/10 text-destructive" },
};
