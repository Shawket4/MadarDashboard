import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/app/combobox";
import { CreateIngredientDialog } from "./create-ingredient-dialog";
import type { OrgIngredient } from "@/data/api/generated/models";
import { fmtMoney, fmtPercent } from "@/lib/format";

export interface RecipeRowInit {
  size_label: string;
  org_ingredient_id?: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  quantity_used: number;
}
export interface CleanRow {
  size_label: string;
  org_ingredient_id: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  quantity_used: number;
}
interface BuilderRow {
  size_label: string;
  org_ingredient_id: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  quantity_used: string;
}

export interface RecipeBuilderProps {
  orgId: string;
  /** Ordered size labels; sizes[0] is the base size. */
  sizes: string[];
  initialRows: RecipeRowInit[];
  catalog: OrgIngredient[];
  /** Current price (piastres) per size — drives the margin preview. */
  priceForSize?: (size: string) => number | null;
  copySources?: { id: string; label: string }[];
  fetchCopyRows?: (sourceId: string) => Promise<RecipeRowInit[]>;
  /** Standalone commit: upsert `rows`, delete `removed`. */
  onSave?: (rows: CleanRow[], removed: { size_label: string; ingredient_name: string }[]) => Promise<void>;
  /** Deferred (embedded) mode: hide the save footer, stream cleaned rows to the host. */
  deferred?: boolean;
  onRowsChange?: (rows: CleanRow[]) => void;
  allowCreateIngredient?: boolean;
}

const rowKey = (r: { size_label: string; ingredient_name: string }) => `${r.size_label}::${r.ingredient_name}`;

export function RecipeBuilder({
  orgId, sizes, initialRows, catalog, priceForSize, copySources = [], fetchCopyRows,
  onSave, deferred, onRowsChange, allowCreateIngredient = true,
}: RecipeBuilderProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [factors, setFactors] = useState<Record<string, string>>({});
  const [newIngredient, setNewIngredient] = useState(false);
  const [copying, setCopying] = useState(false);

  const form = useForm<{ rows: BuilderRow[] }>({ defaultValues: { rows: [] } });
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "rows" });

  const initialKey = useMemo(() => initialRows.map((r) => `${rowKey(r)}=${r.quantity_used}`).sort().join("|"), [initialRows]);
  useEffect(() => {
    form.reset({
      rows: initialRows.map((r) => ({
        size_label: r.size_label,
        org_ingredient_id: r.org_ingredient_id ?? null,
        ingredient_name: r.ingredient_name,
        ingredient_unit: r.ingredient_unit,
        quantity_used: String(r.quantity_used),
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const watchedRows = form.watch("rows");
  const dirty = form.formState.isDirty;

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const activeCatalog = useMemo(() => catalog.filter((c) => c.is_active), [catalog]);
  const catalogOptions = useMemo(
    () => activeCatalog.map((c) => ({ value: c.id, label: c.name, hint: t(`units.${c.unit}`, c.unit), keywords: c.category })),
    [activeCatalog, t],
  );
  const costOf = (id: string | null): number | null => {
    const c = id ? byId.get(id) : undefined;
    return c?.cost_per_unit != null && c.cost_per_unit > 0 ? c.cost_per_unit : null;
  };

  const cleanRows = (raw: BuilderRow[]): CleanRow[] =>
    raw
      .map((r) => ({
        size_label: r.size_label,
        org_ingredient_id: r.org_ingredient_id,
        ingredient_name: r.ingredient_name,
        ingredient_unit: r.ingredient_unit,
        quantity_used: parseFloat(r.quantity_used),
      }))
      .filter((r) => r.ingredient_name && Number.isFinite(r.quantity_used) && r.quantity_used > 0);

  useEffect(() => {
    if (deferred && onRowsChange) onRowsChange(cleanRows(watchedRows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred, JSON.stringify(watchedRows)]);

  const rowsForSize = (size: string) => watchedRows.map((r, i) => ({ ...r, _index: i })).filter((r) => r.size_label === size);
  const addRow = (size: string) => append({ size_label: size, org_ingredient_id: null, ingredient_name: "", ingredient_unit: "g", quantity_used: "" });

  const applyScaling = () => {
    const base = sizes[0];
    const baseRows = watchedRows.filter((r) => r.size_label === base);
    const next: BuilderRow[] = [...baseRows];
    for (const size of sizes.slice(1)) {
      const factor = parseFloat(factors[size] ?? "1");
      if (!Number.isFinite(factor) || factor <= 0) continue;
      for (const r of baseRows) {
        const qty = parseFloat(r.quantity_used);
        next.push({ ...r, size_label: size, quantity_used: Number.isFinite(qty) ? String(Math.round(qty * factor * 1000) / 1000) : "" });
      }
    }
    replace(next);
  };

  const copyFrom = async (sourceId: string) => {
    if (!sourceId || !fetchCopyRows) return;
    setCopying(true);
    try {
      const src = await fetchCopyRows(sourceId);
      const valid = new Set(sizes);
      const mapped = src
        .map((r) => ({
          size_label: valid.has(r.size_label) ? r.size_label : sizes[0],
          org_ingredient_id: r.org_ingredient_id ?? null,
          ingredient_name: r.ingredient_name,
          ingredient_unit: r.ingredient_unit,
          quantity_used: String(r.quantity_used),
        }))
        .filter((r, i, arr) => arr.findIndex((x) => rowKey(x) === rowKey(r)) === i);
      replace(mapped);
    } finally {
      setCopying(false);
    }
  };

  const save = async () => {
    if (!onSave) return;
    const current = form.getValues("rows");
    const cleaned = cleanRows(current);
    const currentKeys = new Set(cleaned.map(rowKey));
    const removed = initialRows.filter((r) => !currentKeys.has(rowKey(r))).map((r) => ({ size_label: r.size_label, ingredient_name: r.ingredient_name }));
    setSaving(true);
    try {
      await onSave(cleaned, removed);
      form.reset({ rows: current });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {copySources.length > 0 && fetchCopyRows ? (
          <div className="w-48">
            <Combobox
              options={copySources.map((s) => ({ value: s.id, label: s.label }))}
              value={null}
              onChange={(v) => void copyFrom(v)}
              placeholder={t("recipes.builder.copyFrom", "Copy from…")}
              disabled={copying}
            />
          </div>
        ) : null}
        {allowCreateIngredient ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setNewIngredient(true)}>
            <Plus className="size-4" /> {t("recipes.newIngredient", "New ingredient")}
          </Button>
        ) : null}
        {sizes.length > 1 ? (
          <label className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={scaling} onCheckedChange={setScaling} />
            {t("recipes.builder.scaleFromBase", { base: sizes[0], defaultValue: `Scale from ${sizes[0]}` })}
          </label>
        ) : null}
      </div>

      {scaling && sizes.length > 1 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
          {sizes.slice(1).map((size) => (
            <div key={size} className="space-y-1">
              <p className="text-xs text-muted-foreground">{size} ×</p>
              <Input type="number" step="0.05" min="0" className="h-8 w-24" value={factors[size] ?? ""} placeholder="1.5" onChange={(e) => setFactors((f) => ({ ...f, [size]: e.target.value }))} />
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={applyScaling}>{t("recipes.builder.applyScaling", "Apply scaling")}</Button>
        </div>
      ) : null}

      {sizes.map((size) => {
        const rows = rowsForSize(size);
        let estimate: number | null = rows.length > 0 ? 0 : null;
        for (const r of rows) {
          const c = costOf(r.org_ingredient_id);
          const qty = parseFloat(r.quantity_used);
          if (c == null || !Number.isFinite(qty)) { estimate = null; break; }
          estimate = (estimate ?? 0) + c * qty;
        }
        const price = priceForSize?.(size) ?? null;
        const marginPct = estimate !== null && price && price > 0 ? (price - estimate) / price : null;

        return (
          <div key={size}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{size === "one_size" ? t("recipes.oneSize", "One size") : size}</Badge>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground tabular">
                {t("recipes.builder.estimate", "Cost")}: <span className="font-semibold">{estimate != null ? fmtMoney(estimate) : "—"}</span>
                {marginPct !== null ? <> · {t("recipes.builder.margin", "margin")} {fmtPercent(marginPct)}</> : null}
              </span>
            </div>

            <div className="space-y-2">
              {rows.map((row) => {
                const c = costOf(row.org_ingredient_id);
                const qty = parseFloat(row.quantity_used);
                const lineCost = c != null && Number.isFinite(qty) ? fmtMoney(c * qty) : "—";
                return (
                  <div key={fields[row._index]?.id ?? row._index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Combobox
                        options={catalogOptions}
                        value={row.org_ingredient_id}
                        onChange={(v) => {
                          const ing = byId.get(v);
                          form.setValue(`rows.${row._index}.org_ingredient_id`, v, { shouldDirty: true });
                          if (ing) {
                            form.setValue(`rows.${row._index}.ingredient_name`, ing.name, { shouldDirty: true });
                            form.setValue(`rows.${row._index}.ingredient_unit`, ing.unit, { shouldDirty: true });
                          }
                        }}
                        placeholder={row.ingredient_name || t("recipes.ingredient", "Ingredient")}
                      />
                    </div>
                    <Input type="number" step="0.001" min="0" className="h-9 w-24" value={row.quantity_used} placeholder="0.000" onChange={(e) => form.setValue(`rows.${row._index}.quantity_used`, e.target.value, { shouldDirty: true })} />
                    <span className="w-8 text-xs text-muted-foreground">{t(`units.${row.ingredient_unit}`, row.ingredient_unit)}</span>
                    <span className="w-20 text-end text-xs text-muted-foreground tabular">{lineCost}</span>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => remove(row._index)}><Trash2 className="size-4" /></Button>
                  </div>
                );
              })}
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => addRow(size)}>
                <Plus className="size-4" /> {t("recipes.addIngredient", "Add ingredient")}
              </Button>
            </div>
          </div>
        );
      })}

      {!deferred ? (
        <div className="flex items-center justify-end gap-2 border-t pt-2">
          {dirty ? <span className="text-xs text-warning">{t("recipes.builder.unsaved", "Unsaved changes")}</span> : null}
          <Button type="button" onClick={() => void save()} loading={saving} disabled={!dirty}>
            <Save className="size-4" /> {t("recipes.builder.saveAll", "Save recipe")}
          </Button>
        </div>
      ) : null}

      {newIngredient ? (
        <CreateIngredientDialog
          orgId={orgId}
          open={newIngredient}
          onOpenChange={setNewIngredient}
          onCreated={(ing) => append({ size_label: sizes[0], org_ingredient_id: ing.id, ingredient_name: ing.name, ingredient_unit: ing.unit, quantity_used: "" })}
        />
      ) : null}
    </div>
  );
}
