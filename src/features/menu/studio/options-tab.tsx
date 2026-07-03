import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/app/combobox";
import { EmptyState } from "@/components/app/empty-state";
import { putItemOptions, useListCatalog } from "@/data/api/generated/api";
import type { ItemOptionInput, StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { StudioSection } from "./studio-section";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  orgId: string | null;
  onSaved: () => void;
}

/** Editor row — one priced optional with an optional single ingredient deduction. */
interface OptionRow {
  id?: string;
  name: string;
  price: string; // EGP text
  is_active: boolean;
  // Optional ingredient deduction (first recipe line only, kept simple).
  ingredient_id: string;
  quantity: string;
  unit: string;
}

const toRows = (studio: StudioAggregate): OptionRow[] =>
  studio.options.map((o) => {
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

export function OptionsTab({ studio, itemId, orgId, onSaved }: Props) {
  const { t } = useTranslation();
  const catalogQ = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  // Stable identity: `data ?? []` mints a fresh [] every render,
  // invalidating every useMemo keyed on it (react-hooks v7 catch).
  const catalog = useMemo(() => catalogQ.data ?? [], [catalogQ.data]);
  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const ingOptions = useMemo(
    () =>
      catalog
        .filter((c) => c.is_active)
        .map((c) => ({ value: c.id, label: c.name, hint: t(`units.${c.unit}`, c.unit), keywords: c.category })),
    [catalog, t],
  );

  const [rows, setRows] = useState<OptionRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(toRows(studio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.catalog_revision]);

  const setRow = (idx: number, patch: Partial<OptionRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((prev) => [...prev, { name: "", price: "0", is_active: true, ingredient_id: "", quantity: "", unit: "g" }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    const options: ItemOptionInput[] = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const price = parseFloat(r.price);
        const qty = parseFloat(r.quantity);
        const hasRecipe = r.ingredient_id && Number.isFinite(qty);
        return {
          id: r.id ?? undefined,
          name: r.name.trim(),
          price: Number.isFinite(price) ? egpToPiastres(price) : 0,
          is_active: r.is_active,
          recipe: hasRecipe ? [{ ingredient_id: r.ingredient_id, quantity: qty, unit: r.unit }] : null,
        };
      });
    setSaving(true);
    try {
      await putItemOptions(itemId, { options });
      toast.success(t("common.savedChanges", "Changes saved"));
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StudioSection
        title={t("menu.studio.tabs.options", "Options")}
        description={t(
          "menu.studio.options.desc",
          "Priced add-ons private to this item. Each can optionally deduct an ingredient when chosen.",
        )}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" /> {t("menu.studio.options.add", "Add option")}
          </Button>
        }
      >
        {rows.length === 0 ? (
          <EmptyState icon={Package} title={t("menu.studio.options.empty", "No options yet")} />
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const ing = row.ingredient_id ? byId.get(row.ingredient_id) : undefined;
              const unitCost = ing?.cost_per_unit != null && ing.cost_per_unit > 0 ? ing.cost_per_unit : null;
              const qty = parseFloat(row.quantity);
              const lineCost = ing && unitCost != null && Number.isFinite(qty) ? fmtMoney(unitCost * qty) : null;
              return (
                <div key={idx} className="rounded-lg border bg-muted/20 p-3">
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
                        step="0.01"
                        min="0"
                        value={row.price}
                        onChange={(e) => setRow(idx, { price: e.target.value })}
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
                  <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
                    <span className="pb-2 text-xs font-medium text-muted-foreground">
                      {t("menu.studio.options.deducts", "Deducts")}
                    </span>
                    <div className="min-w-48 flex-1">
                      <Combobox
                        options={ingOptions}
                        value={row.ingredient_id || null}
                        onChange={(v) => {
                          const picked = byId.get(v);
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
                            step="0.001"
                            min="0"
                            value={row.quantity}
                            placeholder="0.000"
                            onChange={(e) => setRow(idx, { quantity: e.target.value })}
                            className="h-9 w-24 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                          />
                          <span className="min-w-10 pe-3 ps-1 text-xs text-muted-foreground">
                            {t(`units.${row.unit}`, row.unit)}
                          </span>
                        </div>
                        <span className="pb-2 text-xs text-muted-foreground">
                          {lineCost ? t("menu.studio.options.cost", { cost: lineCost, defaultValue: "Cost {{cost}}" }) : null}
                        </span>
                        <button
                          type="button"
                          className="pb-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
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
          </div>
        )}
      </StudioSection>

      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => void save()} loading={saving}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
