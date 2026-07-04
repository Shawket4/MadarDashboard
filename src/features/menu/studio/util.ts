import { queryClient } from "@/data/api/query";
import {
  getGetStudioQueryKey,
  getGetItemCostQueryKey,
  getListCatalogQueryKey,
} from "@/data/api/generated/api";
import type { ModifierGroupOut, StudioAggregate } from "@/data/api/generated/models";
import { piastresToEgp } from "@/lib/format";

/**
 * Invalidate the Menu Studio aggregate + live-cost queries for one item, plus the
 * broader catalog lists so the items grid / POS-facing catalog reflect the edit.
 * Every studio mutation bumps `catalog_revision` server-side, so we re-fetch the
 * aggregate rather than patch it locally.
 */
export const invalidateStudio = (itemId: string) => {
  void queryClient.invalidateQueries({ queryKey: getGetStudioQueryKey(itemId) });
  void queryClient.invalidateQueries({ queryKey: getGetItemCostQueryKey(itemId) });
  void queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/menu-items") ||
          k.startsWith("/categories") ||
          k.startsWith("/catalog") ||
          k.startsWith("/costing") ||
          k.startsWith("/modifier-groups"))
      );
    },
  });
};

/**
 * Refresh after an inline ingredient-cost fix: the org ingredient catalog (unit
 * costs feed the live per-line estimates) + the studio aggregate (server cost
 * rollups). The old recipe tab only invalidated the studio; the catalog list key
 * is `/inventory/orgs/{id}/catalog`, which that predicate never matched.
 */
export const invalidateIngredientCosts = (orgId: string | null, itemId: string) => {
  if (orgId) void queryClient.invalidateQueries({ queryKey: getListCatalogQueryKey(orgId) });
  invalidateStudio(itemId);
};

/** Read the Arabic translation off a generated `*_translations` object. */
export const arOf = (translations: unknown): string => {
  const tr = translations as Record<string, unknown> | null | undefined;
  return tr && typeof tr.ar === "string" ? tr.ar : "";
};

// ── Draft models for the one-page editor ─────────────────────────────────────
// The page owns ONE dirty store: local drafts per section + a pristine signature
// per section. A section is dirty when its current signature diverges from the
// pristine one; saving a step re-baselines just that section's signature.

export interface ItemDraftValues {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category_id: string;
  is_active: boolean;
}

export interface RecipeLineDraft {
  ingredient_id: string;
  /** Quantity as typed (text) — parsed on save. */
  quantity: string;
  unit: string;
}

/** One size block: the size row + its inline recipe (mirrors SizeOut 1:1). */
export interface SizeBlockDraft {
  /** Stable client key (server size id when seeded, `new-N` for added blocks). */
  key: string;
  /** Server size id — absent until the size exists server-side. */
  id?: string;
  label: string;
  /** EGP as typed. */
  price: string;
  /** Seeded label/price — for per-block dirty tints and cost-mode detection. */
  seededLabel: string | null;
  seededPrice: string | null;
  /** Server cost rollup from the seeded SizeOut; null for new blocks. */
  serverCost: { piastres: number | null; incomplete: boolean } | null;
  lines: RecipeLineDraft[];
}

/** One attached reusable group (mirrors the old modifiers tab AttachState). */
export interface AttachDraft {
  group_id: string;
  name: string;
  legacy_addon_type: string | null;
  selection_type: string;
  min: number;
  max: number | null;
  is_required: boolean;
  /** null = offer all of the group's options; else the allowlisted subset. */
  included_option_ids: string[] | null;
  /** All options the group offers (for the allowlist chips). */
  allOptions: { id: string; name: string; price: number }[];
}

/** One item-only option row (old options tab row model, minus its own save). */
export interface OptionRowDraft {
  id?: string;
  name: string;
  price: string; // EGP text
  is_active: boolean;
  // Optional ingredient deduction (first recipe line only, kept simple).
  ingredient_id: string;
  quantity: string;
  unit: string;
}

let blockSeq = 0;
/** Client key for a block added in this session. */
export const newBlockKey = (): string => `new-${++blockSeq}`;

// ── Seeding from the server aggregate ────────────────────────────────────────

export const toItemValues = (s: StudioAggregate): ItemDraftValues => ({
  name: s.name,
  name_ar: arOf(s.name_translations),
  description: s.description ?? "",
  // The aggregate doesn't return description translations; parity with the old
  // basics tab (seed empty, send `{ar}` only when typed).
  description_ar: "",
  category_id: s.category_id ?? "",
  is_active: s.is_active,
});

export const toSizeBlocks = (s: StudioAggregate): SizeBlockDraft[] =>
  [...s.sizes]
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort - b.sort)
    .map((z) => {
      const price = String(piastresToEgp(z.price));
      return {
        key: z.id,
        id: z.id,
        label: z.label,
        price,
        seededLabel: z.label,
        seededPrice: price,
        serverCost: { piastres: z.cost_piastres ?? null, incomplete: z.cost_incomplete },
        lines: z.recipe.map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity: String(parseFloat(r.quantity)),
          unit: r.unit,
        })),
      };
    });

export const toAttachDraft = (g: ModifierGroupOut): AttachDraft => {
  const allOptions = g.options.map((o) => ({ id: o.id, name: o.name, price: o.price }));
  const includedIds = g.options.filter((o) => o.included).map((o) => o.id);
  const allIncluded = includedIds.length === allOptions.length;
  return {
    group_id: g.group_id,
    name: g.name,
    legacy_addon_type: g.legacy_addon_type ?? null,
    selection_type: g.selection_type,
    min: g.min,
    max: g.max ?? null,
    is_required: g.is_required,
    included_option_ids: allIncluded ? null : includedIds,
    allOptions,
  };
};

export const toAttachDrafts = (s: StudioAggregate): AttachDraft[] =>
  [...s.modifier_groups].sort((a, b) => a.sort - b.sort).map(toAttachDraft);

export const toOptionRows = (s: StudioAggregate): OptionRowDraft[] =>
  s.options.map((o) => {
    const line = o.recipe[0];
    return {
      id: o.id,
      name: o.name,
      price: String(piastresToEgp(o.price)),
      is_active: o.is_active,
      ingredient_id: line?.ingredient_id ?? "",
      quantity: line ? String(parseFloat(line.quantity)) : "",
      unit: line?.unit ?? "g",
    };
  });

// ── Dirty signatures ─────────────────────────────────────────────────────────

export const itemSig = (v: ItemDraftValues): string =>
  JSON.stringify([v.name, v.name_ar, v.description, v.description_ar, v.category_id, v.is_active]);

export const sizesSig = (blocks: SizeBlockDraft[]): string =>
  JSON.stringify(blocks.map((b) => [b.label, b.price]));

export const recipeSig = (lines: RecipeLineDraft[]): string =>
  JSON.stringify(lines.map((l) => [l.ingredient_id, l.quantity, l.unit]));

export const modifiersSig = (attached: AttachDraft[]): string =>
  JSON.stringify(
    attached.map((a) => [
      a.group_id,
      a.min,
      a.max,
      a.is_required,
      a.included_option_ids ? [...a.included_option_ids].sort() : null,
    ]),
  );

export const optionsSig = (rows: OptionRowDraft[]): string =>
  JSON.stringify(rows.map((r) => [r.id ?? null, r.name, r.price, r.is_active, r.ingredient_id, r.quantity, r.unit]));

export interface PristineSigs {
  item: string;
  sizes: string;
  /** Per size-block recipe signature, keyed by block key. Missing key = new block. */
  recipes: Record<string, string>;
  modifiers: string;
  options: string;
}

export const EMPTY_PRISTINE: PristineSigs = { item: "", sizes: "", recipes: {}, modifiers: "", options: "" };
