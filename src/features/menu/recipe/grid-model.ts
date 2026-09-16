/**
 * Pure model behind the Studio recipe grid (rows = ingredients, columns = sizes).
 *
 * The page keeps its per-size `SizeBlockDraft[]` store (one replace-set per size on
 * save); the grid is a pivot over it. Only `own` lines are editable and sent to
 * `PUT /menu-item-sizes/{sid}/recipe`. Lines expanded server-side from a recipe base,
 * a packaging rule or a linked source are shown read-only and never saved.
 */
import type { LineSource } from "./modeling-api";

export interface GridLine {
  ingredient_id: string;
  /** Quantity as typed. */
  quantity: string;
  unit: string;
  /** Absent = own. */
  source?: LineSource;
}

export interface GridBlock {
  key: string;
  id?: string;
  label: string;
  baseId?: string | null;
  lines: GridLine[];
}

export const normalizeSource = (s: string | null | undefined): LineSource =>
  s === "base" || s === "rule" || s === "linked" ? s : "own";

export const isOwn = (l: GridLine): boolean => normalizeSource(l.source) === "own";

/** Lines that would actually be written: own, with an ingredient and a finite quantity. */
export const ownPayload = (lines: GridLine[]): { ingredient_id: string; quantity: number; unit: string }[] =>
  lines
    .filter((l) => isOwn(l) && !!l.ingredient_id && l.quantity.trim() !== "" && Number.isFinite(Number(l.quantity)))
    .map((l) => ({ ingredient_id: l.ingredient_id, quantity: Number(l.quantity), unit: l.unit }));

/** Dirty signature of one size's recipe: only what the save would send. */
export const ownRecipeSig = (lines: GridLine[]): string =>
  JSON.stringify(ownPayload(lines).map((l) => [l.ingredient_id, l.quantity, l.unit]));

/** Keys of sizes whose own recipe differs from pristine (sizes with no pristine entry count as changed). */
export const changedSizeKeys = (blocks: GridBlock[], pristine: Record<string, string>): Set<string> => {
  const out = new Set<string>();
  for (const b of blocks) {
    const base = pristine[b.key];
    if (base === undefined || ownRecipeSig(b.lines) !== base) out.add(b.key);
  }
  return out;
};

// ── Pivot ────────────────────────────────────────────────────────────────────

export interface GridRow {
  /** `own:<ingredient>` / `base:<ingredient>` … */
  key: string;
  ingredient_id: string;
  source: LineSource;
  unit: string;
  /** Quantity per block key; `undefined` = no line in that size. */
  cells: Record<string, string | undefined>;
  /** Block keys that carry this row (first one names the base, for tags). */
  blockKeys: string[];
}

const SOURCE_ORDER: Record<LineSource, number> = { own: 0, linked: 0, base: 1, rule: 2 };

export const buildGridRows = (blocks: GridBlock[]): GridRow[] => {
  const rows = new Map<string, GridRow>();
  for (const b of blocks) {
    for (const l of b.lines) {
      if (!l.ingredient_id) continue;
      const source = normalizeSource(l.source);
      const key = `${source}:${l.ingredient_id}`;
      let row = rows.get(key);
      if (!row) {
        row = { key, ingredient_id: l.ingredient_id, source, unit: l.unit, cells: {}, blockKeys: [] };
        rows.set(key, row);
      }
      row.cells[b.key] = l.quantity;
      row.blockKeys.push(b.key);
    }
  }
  // Stable: insertion order within a source bucket.
  return [...rows.values()]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => SOURCE_ORDER[a.r.source] - SOURCE_ORDER[b.r.source] || a.i - b.i)
    .map(({ r }) => r);
};

// ── Edits (all return new arrays; non-own lines are never touched) ─────────────

const mapBlock = (blocks: GridBlock[], key: string, fn: (b: GridBlock) => GridBlock) =>
  blocks.map((b) => (b.key === key ? fn(b) : b));

/** Set (or add) the own quantity of `ingredient` in one size. */
export const setCell = <B extends GridBlock>(
  blocks: B[],
  blockKey: string,
  ingredientId: string,
  quantity: string,
  unit: string,
): B[] =>
  mapBlock(blocks, blockKey, (b) => {
    const idx = b.lines.findIndex((l) => isOwn(l) && l.ingredient_id === ingredientId);
    if (idx === -1) return { ...b, lines: [...b.lines, { ingredient_id: ingredientId, quantity, unit, source: "own" }] };
    return { ...b, lines: b.lines.map((l, i) => (i === idx ? { ...l, quantity } : l)) };
  }) as B[];

/** Add an own row: an empty cell in every size that does not have it yet. */
export const addRow = <B extends GridBlock>(blocks: B[], ingredientId: string, unit: string): B[] =>
  blocks.map((b) =>
    b.lines.some((l) => isOwn(l) && l.ingredient_id === ingredientId)
      ? b
      : { ...b, lines: [...b.lines, { ingredient_id: ingredientId, quantity: "", unit, source: "own" as const }] },
  );

export const removeRow = <B extends GridBlock>(blocks: B[], ingredientId: string): B[] =>
  blocks.map((b) => ({ ...b, lines: b.lines.filter((l) => !(isOwn(l) && l.ingredient_id === ingredientId)) }));

/** Round to the 3 decimals the quantity inputs accept; blanks stay blank. */
export const fmtQty = (q: number): string => String(Math.round(q * 1000) / 1000);

export const scaleQty = (quantity: string, factor: number): string => {
  if (quantity.trim() === "") return quantity;
  const n = Number(quantity);
  return Number.isFinite(n) ? fmtQty(n * factor) : quantity;
};

/**
 * Replace the own lines of `toKey` with those of `fromKey` (optionally scaled).
 * Base/rule/linked lines of the target stay as they are.
 */
export const copyColumn = <B extends GridBlock>(blocks: B[], fromKey: string, toKey: string, factor = 1): B[] => {
  const from = blocks.find((b) => b.key === fromKey);
  if (!from || fromKey === toKey) return factor === 1 ? blocks : scaleColumn(blocks, toKey, factor);
  const copied = from.lines
    .filter(isOwn)
    .map((l) => ({ ...l, source: "own" as const, quantity: scaleQty(l.quantity, factor) }));
  return mapBlock(blocks, toKey, (b) => ({ ...b, lines: [...copied, ...b.lines.filter((l) => !isOwn(l))] })) as B[];
};

/** Multiply every own quantity in one size by `factor`. */
export const scaleColumn = <B extends GridBlock>(blocks: B[], key: string, factor: number): B[] =>
  mapBlock(blocks, key, (b) => ({
    ...b,
    lines: b.lines.map((l) => (isOwn(l) ? { ...l, quantity: scaleQty(l.quantity, factor) } : l)),
  })) as B[];

// ── Swappable families ───────────────────────────────────────────────────────

/** Ingredient category slugs whose line a choice group can swap. */
export const SWAPPABLE_SLUGS = new Set(["milk", "coffee_bean"]);

export interface SwapGroupInfo {
  name: string;
  /** Ingredient ids used by the group's options. */
  ingredientIds: string[];
}

/**
 * The attached group that swaps this row's family: the first group offering an
 * option whose ingredient is in the same (swappable) category.
 */
export const swapGroupFor = (
  categorySlug: string | undefined,
  groups: SwapGroupInfo[],
  slugOf: (ingredientId: string) => string | undefined,
): string | null => {
  if (!categorySlug || !SWAPPABLE_SLUGS.has(categorySlug)) return null;
  const g = groups.find((gr) => gr.ingredientIds.some((id) => slugOf(id) === categorySlug));
  return g?.name ?? null;
};
