import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/app/combobox";
import { CreateIngredientDialog } from "./create-ingredient-dialog";
import type { OrgIngredient } from "@/data/api/generated/models";
import { fmtMoney, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

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
        {/* leading cluster: copy-from + new ingredient */}
        {(copySources.length > 0 && fetchCopyRows) || allowCreateIngredient ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
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
          </div>
        ) : null}

        {/* trailing cluster: scale toggle in its own muted pill */}
        {sizes.length > 1 ? (
          <label className="ms-auto flex cursor-pointer items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <Switch checked={scaling} onCheckedChange={setScaling} />
            {t("recipes.builder.scaleFromBase", { base: sizes[0], defaultValue: `Scale from ${sizes[0]}` })}
          </label>
        ) : null}
      </div>

      {/* scaling panel */}
      {scaling && sizes.length > 1 ? (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2.5 text-xs text-muted-foreground">
            {t("recipes.builder.scaleHint", { base: sizes[0], defaultValue: `Multiply ${sizes[0]} quantities by:` })}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            {sizes.slice(1).map((size) => (
              <div key={size} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{size}</Label>
                <div className="flex items-center rounded-md border bg-background">
                  <span className="ps-2.5 text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={factors[size] ?? ""}
                    placeholder="1.5"
                    onChange={(e) => setFactors((f) => ({ ...f, [size]: e.target.value }))}
                    className="h-8 w-20 border-0 bg-transparent tabular shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="ms-auto" onClick={applyScaling}>
              {t("recipes.builder.applyScaling", "Apply scaling")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* size sections */}
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
        const sizeDisplayLabel = size === "one_size" ? t("recipes.oneSize", "One size") : size;

        return (
          <div key={size} className="rounded-lg border bg-card">
            {/* size section header */}
            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                {sizeDisplayLabel}
              </span>

              {/* cost + margin summary cluster */}
              <div className="flex items-center gap-4 text-end">
                <div className="leading-tight">
                  <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
                    {t("recipes.builder.estimate", "Cost")}
                  </p>
                  <p className="text-sm font-semibold tabular text-foreground">
                    {estimate != null ? fmtMoney(estimate) : "—"}
                  </p>
                </div>
                {marginPct !== null ? (
                  <div className="leading-tight">
                    <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
                      {t("recipes.builder.margin", "Margin")}
                    </p>
                    <p className={cn(
                      "text-sm font-semibold tabular",
                      marginPct >= 0.6 ? "text-success" : marginPct >= 0.3 ? "text-foreground" : "text-warning",
                    )}>
                      {fmtPercent(marginPct)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ingredient rows */}
            <div className="space-y-1 p-2">
              {rows.map((row) => {
                const c = costOf(row.org_ingredient_id);
                const qty = parseFloat(row.quantity_used);
                const lineCost = c != null && Number.isFinite(qty) ? fmtMoney(c * qty) : "—";
                return (
                  <div
                    key={fields[row._index]?.id ?? row._index}
                    className="grid grid-cols-[1fr_auto_5rem_auto] items-center gap-3 rounded-md px-1 py-1"
                  >
                    {/* 1. Ingredient combobox — primary control */}
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

                    {/* 2. Qty + unit grouped in one bordered cluster */}
                    <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={row.quantity_used}
                        placeholder="0.000"
                        onChange={(e) => form.setValue(`rows.${row._index}.quantity_used`, e.target.value, { shouldDirty: true })}
                        className="h-9 w-20 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                      />
                      <span className="min-w-12 pe-3 ps-1 text-xs text-muted-foreground">
                        {t(`units.${row.ingredient_unit}`, row.ingredient_unit)}
                      </span>
                    </div>

                    {/* 3. Line cost — fixed end-aligned slot */}
                    <span className={cn(
                      "text-end text-sm tabular",
                      lineCost === "—" ? "text-muted-foreground" : "text-foreground font-medium",
                    )}>
                      {lineCost}
                    </span>

                    {/* 4. Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => remove(row._index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}

              {/* dashed append-row target */}
              <button
                type="button"
                onClick={() => addRow(size)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="size-4" />
                {t("recipes.addIngredient", "Add ingredient")}
              </button>
            </div>
          </div>
        );
      })}

      {/* save footer */}
      {!deferred ? (
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {dirty ? (
            <span className="text-xs text-warning">{t("recipes.builder.unsaved", "Unsaved changes")}</span>
          ) : null}
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
