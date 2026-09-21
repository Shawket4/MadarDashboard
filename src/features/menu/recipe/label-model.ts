/**
 * Lines keyed by an optional size label (recipe bases, per-size option amounts)
 * ⇄ grid columns. Column `*` holds the unlabelled lines ("every size"); every
 * other column is one exact size label and wins over `*` for that size.
 */
import { fmtQty, type GridBlock } from "./grid-model";

export const ALL_SIZES = "*";

export interface LabelledLine {
  size_label?: string | null;
  ingredient_id: string;
  quantity: string | number;
  unit: string;
}

export const labelKey = (label: string | null | undefined): string => (label ? `L:${label}` : ALL_SIZES);

export const toLabelBlocks = (lines: LabelledLine[], extraLabels: string[], allLabel: string): GridBlock[] => {
  const labels: string[] = [];
  const push = (l: string | null | undefined) => {
    if (l && !labels.includes(l)) labels.push(l);
  };
  lines.forEach((l) => push(l.size_label));
  extraLabels.forEach(push);
  const blocks: GridBlock[] = [
    { key: ALL_SIZES, label: allLabel, lines: [] },
    ...labels.map((l) => ({ key: labelKey(l), label: l, lines: [] })),
  ];
  for (const l of lines) {
    const b = blocks.find((x) => x.key === labelKey(l.size_label));
    const n = typeof l.quantity === "number" ? l.quantity : Number(l.quantity);
    b?.lines.push({
      ingredient_id: l.ingredient_id,
      quantity: Number.isFinite(n) ? fmtQty(n) : String(l.quantity),
      unit: l.unit,
      source: "own",
    });
  }
  return blocks;
};

/** Grid → flat lines. Blank cells are dropped; `*` lines get `size_label: null`. */
export const fromLabelBlocks = (
  blocks: GridBlock[],
): { size_label: string | null; ingredient_id: string; quantity: number; unit: string }[] =>
  blocks.flatMap((b) =>
    b.lines
      .filter((l) => l.ingredient_id && l.quantity.trim() !== "" && Number.isFinite(Number(l.quantity)))
      .map((l) => ({
        size_label: b.key === ALL_SIZES ? null : b.label,
        ingredient_id: l.ingredient_id,
        quantity: Number(l.quantity),
        unit: l.unit,
      })),
  );

/** Drop a label column (its lines go with it). */
export const removeLabelColumn = (blocks: GridBlock[], key: string): GridBlock[] =>
  key === ALL_SIZES ? blocks : blocks.filter((b) => b.key !== key);

/** Add a label column pre-filled with blank cells for the grid's rows. */
export const addLabelColumn = (blocks: GridBlock[], label: string): GridBlock[] => {
  if (blocks.some((b) => b.key === labelKey(label))) return blocks;
  const ingredients = new Map<string, string>();
  blocks.forEach((b) => b.lines.forEach((l) => ingredients.set(l.ingredient_id, l.unit)));
  return [
    ...blocks,
    {
      key: labelKey(label),
      label,
      lines: [...ingredients].map(([ingredient_id, unit]) => ({ ingredient_id, quantity: "", unit, source: "own" as const })),
    },
  ];
};
