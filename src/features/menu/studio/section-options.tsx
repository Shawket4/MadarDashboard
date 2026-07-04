import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import type { OrgIngredient } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";
import type { OptionRowDraft } from "./util";

interface Props {
  rows: OptionRowDraft[];
  setRows: Dispatch<SetStateAction<OptionRowDraft[]>>;
  catalogById: Map<string, OrgIngredient>;
  ingredientOptions: ComboboxOption[];
}

/**
 * Section 4 — Item-only options: priced add-ons private to this item, each with
 * an optional single-ingredient deduction. Rows live in the page's dirty store;
 * the batched save replace-sets them via putItemOptions.
 */
export function SectionOptions({ rows, setRows, catalogById, ingredientOptions }: Props) {
  const { t } = useTranslation();

  const setRow = (idx: number, patch: Partial<OptionRowDraft>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((prev) => [...prev, { name: "", price: "0", is_active: true, ingredient_id: "", quantity: "", unit: "g" }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const ing = row.ingredient_id ? catalogById.get(row.ingredient_id) : undefined;
        const unitCost = ing?.cost_per_unit != null && ing.cost_per_unit > 0 ? ing.cost_per_unit : null;
        const qty = parseFloat(row.quantity);
        const lineCost = ing && unitCost != null && Number.isFinite(qty) ? fmtMoney(unitCost * qty) : null;
        return (
          <div key={idx} className="rounded-lg border p-3 sm:p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-40 flex-1 space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">{t("common.name", "Name")}</span>
                <Input
                  value={row.name}
                  placeholder={t("menu.studio.options.namePh", "e.g. Extra shot")}
                  onChange={(e) => setRow(idx, { name: e.target.value })}
                />
              </label>
              <label className="w-32 space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  {t("common.price", "Price")} (EGP)
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={row.price}
                  onChange={(e) => setRow(idx, { price: e.target.value })}
                  className="text-end tabular"
                />
              </label>
              <label className="flex items-center gap-2 pb-2">
                <Switch checked={row.is_active} onCheckedChange={(v) => setRow(idx, { is_active: v })} />
                <span className="text-sm">{t("common.active", "Active")}</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mb-1 ms-auto text-destructive"
                aria-label={t("common.remove", "Remove")}
                onClick={() => removeRow(idx)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Optional ingredient deduction */}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t("menu.studio.options.deducts", "Deducts")}
              </span>
              <div className="min-w-48 flex-1">
                <Combobox
                  options={ingredientOptions}
                  value={row.ingredient_id || null}
                  onChange={(v) => {
                    const picked = catalogById.get(v);
                    setRow(idx, { ingredient_id: v, unit: picked?.unit ?? row.unit });
                  }}
                  placeholder={t("menu.studio.options.noDeduction", "No deduction")}
                />
              </div>
              {row.ingredient_id ? (
                <>
                  <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0"
                      value={row.quantity}
                      placeholder="0.000"
                      aria-label={t("common.quantity", "Quantity")}
                      onChange={(e) => setRow(idx, { quantity: e.target.value })}
                      className="h-9 w-24 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                    />
                    <span className="min-w-10 pe-3 ps-1 text-xs text-muted-foreground">
                      {t(`units.${row.unit}`, row.unit)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular">
                    {lineCost ? t("menu.studio.options.cost", { cost: lineCost, defaultValue: "Cost {{cost}}" }) : null}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => setRow(idx, { ingredient_id: "", quantity: "" })}
                  >
                    {t("common.clear", "Clear")}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Plus className="size-4" />
        {t("menu.studio.options.add", "Add option")}
      </button>
    </div>
  );
}
