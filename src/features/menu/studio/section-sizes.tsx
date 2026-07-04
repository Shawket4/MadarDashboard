import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import type { OrgIngredient } from "@/data/api/generated/models";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FixCostPopover } from "./fix-cost-popover";
import { newBlockKey, type RecipeLineDraft, type SizeBlockDraft } from "./util";

interface Props {
  blocks: SizeBlockDraft[];
  setBlocks: Dispatch<SetStateAction<SizeBlockDraft[]>>;
  /** Block keys whose recipe diverges from pristine (new blocks always count). */
  recipeDirtyKeys: Set<string>;
  catalogById: Map<string, OrgIngredient>;
  ingredientOptions: ComboboxOption[];
  orgId: string | null;
  /** Refresh ingredient costs + aggregate after an inline cost fix. */
  onCostFixed: () => void;
}

/** Unit cost in piastres, or null when the ingredient is unpriced (never 0). */
const costOf = (catalogById: Map<string, OrgIngredient>, id: string): number | null => {
  const c = catalogById.get(id);
  return c?.cost_per_unit != null && c.cost_per_unit > 0 ? c.cost_per_unit : null;
};

/** Live client-side estimate over the draft lines: Σ(qty × cost_per_unit). */
const estimateFor = (
  catalogById: Map<string, OrgIngredient>,
  lines: RecipeLineDraft[],
): { piastres: number; incomplete: boolean } => {
  let sum = 0;
  let incomplete = false;
  for (const l of lines) {
    const qty = parseFloat(l.quantity);
    const unitCost = costOf(catalogById, l.ingredient_id);
    if (!l.ingredient_id || unitCost == null || !Number.isFinite(qty)) {
      incomplete = true;
      continue;
    }
    sum += unitCost * qty;
  }
  return { piastres: sum, incomplete };
};

/**
 * Section 2 — Sizes, price & recipe. One flat bordered block per size: the size
 * row (label · price · reorder · remove) with its recipe lines inline beneath,
 * ending in an honest cost line (server rollup when pristine, ≈ estimate when
 * dirty, "Cost incomplete" whenever any line is unlinked/unpriced — never 0).
 */
export function SectionSizes({
  blocks,
  setBlocks,
  recipeDirtyKeys,
  catalogById,
  ingredientOptions,
  orgId,
  onCostFixed,
}: Props) {
  const { t } = useTranslation();

  const patchBlock = (key: string, patch: Partial<SizeBlockDraft>) =>
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const moveBlock = (idx: number, dir: -1 | 1) =>
    setBlocks((prev) => {
      const next = [...prev];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  const removeBlock = (key: string) => setBlocks((prev) => prev.filter((b) => b.key !== key));
  const addBlock = () =>
    setBlocks((prev) => [
      ...prev,
      { key: newBlockKey(), label: "", price: "0", seededLabel: null, seededPrice: null, serverCost: null, lines: [] },
    ]);

  const patchLine = (key: string, idx: number, patch: Partial<RecipeLineDraft>) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === key ? { ...b, lines: b.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) } : b,
      ),
    );
  const addLine = (key: string) =>
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, lines: [...b.lines, { ingredient_id: "", quantity: "", unit: "g" }] } : b)),
    );
  const removeLine = (key: string, idx: number) =>
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, lines: b.lines.filter((_, i) => i !== idx) } : b)));

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        const recipeDirty = recipeDirtyKeys.has(b.key);
        const blockDirty =
          !b.id || recipeDirty || b.label !== (b.seededLabel ?? "") || b.price !== (b.seededPrice ?? "");
        // Cost mode: server rollup while this block is pristine; else a live
        // estimate marked with the unsaved tilde.
        const estimated = !b.id || recipeDirty || b.price !== b.seededPrice;
        const est = estimated ? estimateFor(catalogById, b.lines) : null;
        const costIncomplete = estimated ? est!.incomplete : (b.serverCost?.incomplete ?? false);
        const costPiastres = estimated ? est!.piastres : (b.serverCost?.piastres ?? null);
        const priceEgp = parseFloat(b.price);
        const pricePiastres = Number.isFinite(priceEgp) ? egpToPiastres(priceEgp) : 0;
        const margin =
          !costIncomplete && costPiastres != null && pricePiastres > 0
            ? (pricePiastres - costPiastres) / pricePiastres
            : null;

        return (
          <div key={b.key} className={cn("rounded-lg border p-3 transition-colors sm:p-4", blockDirty && "bg-brand/5")}>
            {/* Size row: reorder · label · price · remove */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={t("menu.studio.sizes.moveUp", "Move up")}
                  disabled={idx === 0}
                  onClick={() => moveBlock(idx, -1)}
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t("menu.studio.sizes.moveDown", "Move down")}
                  disabled={idx === blocks.length - 1}
                  onClick={() => moveBlock(idx, 1)}
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-30"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
              <Input
                value={b.label}
                placeholder={t("menu.studio.sizes.labelPh", "e.g. Small")}
                aria-label={t("menu.sizeLabel", "Label")}
                onChange={(e) => patchBlock(b.key, { label: e.target.value })}
                className="h-9 min-w-0 flex-1"
              />
              <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={b.price}
                  aria-label={`${t("common.price", "Price")} (EGP)`}
                  onChange={(e) => patchBlock(b.key, { price: e.target.value })}
                  className="h-9 w-24 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                />
                <span className="pe-3 ps-1 text-xs text-muted-foreground">EGP</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                aria-label={t("menu.removeSize", "Remove size")}
                onClick={() => removeBlock(b.key)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Recipe lines */}
            <div className="mt-3 space-y-2 border-t pt-3">
              {b.lines.map((line, li) => {
                const ing = line.ingredient_id ? catalogById.get(line.ingredient_id) : undefined;
                const unitCost = costOf(catalogById, line.ingredient_id);
                const qty = parseFloat(line.quantity);
                const lineCost = ing && unitCost != null && Number.isFinite(qty) ? fmtMoney(unitCost * qty) : null;
                const unlinked = !line.ingredient_id;
                const uncosted = !!ing && unitCost == null;
                return (
                  <div key={li} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
                    <Combobox
                      options={ingredientOptions}
                      value={line.ingredient_id || null}
                      onChange={(v) => {
                        const picked = catalogById.get(v);
                        patchLine(b.key, li, { ingredient_id: v, unit: picked?.unit ?? line.unit });
                      }}
                      placeholder={t("recipes.ingredient", "Ingredient")}
                    />
                    <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        min="0"
                        value={line.quantity}
                        placeholder="0.000"
                        aria-label={t("common.quantity", "Quantity")}
                        onChange={(e) => patchLine(b.key, li, { quantity: e.target.value })}
                        className="h-9 w-24 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                      />
                      <span className="min-w-10 pe-3 ps-1 text-xs text-muted-foreground">
                        {t(`units.${line.unit}`, line.unit)}
                      </span>
                    </div>
                    <div className="min-w-24 text-end">
                      {unlinked ? (
                        <span className="text-xs text-muted-foreground">
                          {t("menu.studio.recipe.pickIngredient", "Pick an ingredient")}
                        </span>
                      ) : uncosted ? (
                        <FixCostPopover ingredient={ing!} orgId={orgId} onFixed={onCostFixed} />
                      ) : (
                        <span className="text-sm font-medium tabular">{lineCost ?? "—"}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      aria-label={t("recipes.builder.removeIngredient", "Remove ingredient")}
                      onClick={() => removeLine(b.key, li)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => addLine(b.key)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Plus className="size-4" />
                {t("recipes.addIngredient", "Add ingredient")}
              </button>
            </div>

            {/* Honest cost line */}
            {b.lines.length > 0 ? (
              <p className="mt-3 border-t pt-2.5 text-end text-xs text-muted-foreground">
                {costIncomplete ? (
                  t("menu.studio.recipe.incomplete", "Cost incomplete")
                ) : costPiastres != null ? (
                  <span className="tabular">
                    {estimated ? "≈ " : null}
                    {margin != null
                      ? t("menu.studio.sizes.costMargin", "Cost {{cost}} · Margin {{margin}}", {
                          cost: fmtMoney(costPiastres),
                          margin: new Intl.NumberFormat(undefined, {
                            style: "percent",
                            maximumFractionDigits: 1,
                          }).format(margin),
                        })
                      : t("menu.studio.sizes.costOnly", "Cost {{cost}}", { cost: fmtMoney(costPiastres) })}
                  </span>
                ) : (
                  t("menu.studio.recipe.incomplete", "Cost incomplete")
                )}
              </p>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addBlock}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Plus className="size-4" />
        {t("menu.addSize", "Add size")}
      </button>

      <p className="text-xs text-muted-foreground">
        {t(
          "menu.studio.sizes.softDelete",
          "Sizes with order history are deactivated rather than deleted, preserving past orders.",
        )}
      </p>
    </div>
  );
}
