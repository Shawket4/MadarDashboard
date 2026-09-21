import { z } from "zod";

/**
 * Owner-facing model of a choice group (MENU_MODELING_AUDIT §4.1) and the pure
 * mappings onto today's wire fields. Nothing here talks to the API, so the
 * mappings are unit-tested in isolation (group-model.test.ts).
 *
 * Phase 2 adds `effect` + `swap_category_id` to the backend. The form already
 * carries `effect` and `swapTarget` as first-class fields; until then they are
 * DERIVED into `legacy_addon_type` (B3), which is what the resolver keys on.
 */

// ── Pick rule ⇄ selection_type / min / max / is_required ─────────────────────

export type PickRule =
  | { kind: "exactly_one" }
  | { kind: "up_to"; max: number }
  | { kind: "any" };

export interface SelectionFields {
  selection_type: "single" | "multi";
  min_selections: number;
  max_selections: number | null;
  is_required: boolean;
}

export const pickRuleToSelection = (rule: PickRule): SelectionFields => {
  switch (rule.kind) {
    case "exactly_one":
      return { selection_type: "single", min_selections: 1, max_selections: 1, is_required: true };
    case "up_to": {
      const max = Math.max(1, Math.floor(rule.max));
      return {
        selection_type: max === 1 ? "single" : "multi",
        min_selections: 0,
        max_selections: max,
        is_required: false,
      };
    }
    case "any":
      return { selection_type: "multi", min_selections: 0, max_selections: null, is_required: false };
  }
};

/** Read a stored group back as a pick rule. Lossy for odd stored shapes
 * (e.g. "at least 2 of 5" becomes "up to 5"), which the dashboard never writes. */
export const selectionToPickRule = (g: {
  selection_type: string;
  min_selections: number;
  max_selections?: number | null;
  is_required: boolean;
}): PickRule => {
  const max = g.max_selections ?? null;
  if (max === 1 && (g.is_required || g.min_selections >= 1)) return { kind: "exactly_one" };
  if (max === null) return g.selection_type === "single" ? { kind: "up_to", max: 1 } : { kind: "any" };
  return { kind: "up_to", max };
};

// ── Effect ⇄ legacy_addon_type ───────────────────────────────────────────────

export type Effect = "none" | "adds" | "swaps";
export type SwapTarget = "milk" | "beans";

/** The two swap families the resolver understands today (`is_swap_family`). */
export const SWAP_TYPES: Record<SwapTarget, string> = { milk: "milk_type", beans: "coffee_type" };
const SWAP_TYPE_SET = new Set(Object.values(SWAP_TYPES));

/** The category slug each swap family matches on the server. */
export const SWAP_SLUGS: Record<SwapTarget, string> = { milk: "milk", beans: "coffee_bean" };

export const isSwapType = (type: string | null | undefined): boolean => !!type && SWAP_TYPE_SET.has(type);

/**
 * The legacy type a NEW group is written with. Swaps map to the swap family;
 * anything else gets a type derived from the group's own name ("Red Bull Type"
 * → `red_bull_type`), so old tills show it as its own section instead of
 * merging it into Extras. A name that would collide with a swap family, or has
 * no latin letters, falls back to `extra`. `taken` holds the types of OTHER
 * groups; a name-derived type that is taken gets a numeric suffix.
 */
export const effectToLegacyType = (
  effect: Effect,
  swapTarget: SwapTarget | null,
  name: string,
  taken: Iterable<string> = [],
): string => {
  if (effect === "swaps") return SWAP_TYPES[swapTarget ?? "milk"];
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug || SWAP_TYPE_SET.has(slug) || /^(milk|coffee)(_|$)/.test(slug)) return "extra";
  const used = new Set(taken);
  if (!used.has(slug)) return slug;
  let n = 2;
  while (used.has(`${slug}_${n}`)) n++;
  return `${slug}_${n}`;
};

/** Read the effect back from a stored group. Non-swap groups are "adds" when
 * any option carries a recipe line, else "nothing". */
export const legacyTypeToEffect = (
  type: string | null | undefined,
  anyOptionHasLines: boolean,
): { effect: Effect; swapTarget: SwapTarget | null } => {
  if (type === SWAP_TYPES.milk) return { effect: "swaps", swapTarget: "milk" };
  if (type === SWAP_TYPES.beans) return { effect: "swaps", swapTarget: "beans" };
  return { effect: anyOptionHasLines ? "adds" : "none", swapTarget: null };
};

/** The effect a stored group has: the explicit column, else inferred from the legacy type. */
export const groupEffect = (
  g: { effect?: string | null; legacy_addon_type?: string | null },
  anyOptionHasLines: boolean,
): Effect =>
  g.effect === "none" || g.effect === "adds" || g.effect === "swaps"
    ? g.effect
    : legacyTypeToEffect(g.legacy_addon_type, anyOptionHasLines).effect;

// ── Form schema ──────────────────────────────────────────────────────────────

export interface GroupSchemaMessages {
  required: string;
  maxAtLeastOne: string;
  swapNeedsIngredient: string;
  swapNeedsCategory: string;
  duplicateIngredient: string;
  qtyPositive: string;
}

export const makeGroupSchema = (m: GroupSchemaMessages) => {
  const line = z.object({
    ingredient_id: z.string().min(1, m.required),
    quantity: z.coerce.number<string | number>().positive(m.qtyPositive),
    unit: z.string().min(1),
    /** `null`/absent = every size; else only sizes with this label (per-size amounts). */
    size_label: z.string().nullable().optional(),
  });
  const option = z.object({
    /** Server id; absent for a row added in this session. */
    id: z.string().optional(),
    name: z.string().trim().min(1, m.required),
    name_ar: z.string(),
    /** EGP as typed. */
    price: z.coerce.number<string | number>().min(0),
    is_active: z.boolean(),
    /** Preselected on the till (swap groups: the recipe's own ingredient). */
    is_default: z.boolean(),
    /** Swap groups: the one ingredient the option pours instead. */
    swap_ingredient_id: z.string(),
    /** Adds groups: the lines deducted when chosen. */
    lines: z.array(line),
  });
  return z
    .object({
      name: z.string().trim().min(1, m.required),
      name_ar: z.string(),
      pick: z.enum(["exactly_one", "up_to", "any"]),
      up_to: z.coerce.number<string | number>().int().min(1, m.maxAtLeastOne),
      effect: z.enum(["none", "adds", "swaps"]),
      /** Swap groups: the ingredient category whose members the options pour. */
      swap_category_id: z.string(),
      is_active: z.boolean(),
      options: z.array(option),
    })
    .superRefine((v, ctx) => {
      if (v.effect === "swaps" && !v.swap_category_id) {
        ctx.addIssue({ code: "custom", path: ["swap_category_id"], message: m.swapNeedsCategory });
      }
      v.options.forEach((o, i) => {
        if (v.effect === "swaps" && !o.swap_ingredient_id) {
          ctx.addIssue({ code: "custom", path: ["options", i, "swap_ingredient_id"], message: m.swapNeedsIngredient });
        }
        if (v.effect === "adds") {
          // Unique per (ingredient, size_label): the same syrup may appear once for
          // "All sizes" and once per size column.
          const seen = new Set<string>();
          o.lines.forEach((l, j) => {
            const key = JSON.stringify([l.ingredient_id, l.size_label || null]);
            if (l.ingredient_id && seen.has(key)) {
              ctx.addIssue({ code: "custom", path: ["options", i, "lines", j, "ingredient_id"], message: m.duplicateIngredient });
            }
            seen.add(key);
          });
        }
      });
    });
};

export type GroupFormInput = z.input<ReturnType<typeof makeGroupSchema>>;
export type GroupFormValues = z.output<ReturnType<typeof makeGroupSchema>>;

export const formPickRule = (v: Pick<GroupFormValues, "pick" | "up_to" | "effect">): PickRule =>
  v.effect === "swaps" || v.pick === "exactly_one"
    ? { kind: "exactly_one" }
    : v.pick === "up_to"
      ? { kind: "up_to", max: v.up_to }
      : { kind: "any" };

/** The recipe replace-set an option writes, per effect. */
export const optionRecipeLines = (
  effect: Effect,
  o: Pick<GroupFormValues["options"][number], "swap_ingredient_id" | "lines">,
  unitOf: (ingredientId: string) => string | undefined,
): { ingredient_id: string; quantity: number; unit: string; size_label: string | null }[] => {
  if (effect === "swaps") {
    return o.swap_ingredient_id
      ? [{ ingredient_id: o.swap_ingredient_id, quantity: 1, unit: unitOf(o.swap_ingredient_id) ?? "pcs", size_label: null }]
      : [];
  }
  if (effect === "adds") {
    return o.lines
      .filter((l) => l.ingredient_id)
      .map((l) => ({ ingredient_id: l.ingredient_id, quantity: l.quantity, unit: l.unit, size_label: l.size_label || null }));
  }
  return [];
};
