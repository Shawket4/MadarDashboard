import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Copy, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { CatalogItemDialog } from "@/features/dialogs/catalog-item-dialog";
import { recipeCost } from "@/entities/menu/cost";
import { fmtMoney, fmtPercent, fmtUnit } from "@/shared/lib/format";
import type { OrgIngredient } from "@/shared/types";

export interface BuilderRow {
  size_label: string;
  org_ingredient_id: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  /** kept as string in the form, parsed on save */
  quantity_used: string;
}

interface BuilderForm {
  rows: BuilderRow[];
}

export interface RecipeBuilderProps {
  orgId: string;
  /** Ordered size labels; sizes[0] is the base size. */
  sizes: string[];
  /** Existing recipe rows (server state). */
  initialRows: Array<{
    size_label: string;
    org_ingredient_id?: string | null;
    ingredient_name: string;
    ingredient_unit: string;
    quantity_used: number;
  }>;
  catalog: OrgIngredient[];
  /** Current price in piastres per size — drives the margin preview. */
  priceForSize?: (size: string) => number | null;
  /** Optional "copy recipe from" sources. */
  copySources?: { id: string; label: string }[];
  fetchCopyRows?: (sourceId: string) => Promise<RecipeBuilderProps["initialRows"]>;
  /** Commit everything: upsert `rows`, delete `removed` (keyed per size+name). */
  onSave?: (
    rows: Array<{ size_label: string; org_ingredient_id: string | null; ingredient_name: string; ingredient_unit: string; quantity_used: number }>,
    removed: Array<{ size_label: string; ingredient_name: string }>,
  ) => Promise<void>;
  /**
   * Deferred mode (for embedding inside the item editor): hides the save
   * footer and reports the cleaned rows on every change — the host commits
   * them together with the rest of its form.
   */
  deferred?: boolean;
  onRowsChange?: (
    rows: Array<{ size_label: string; org_ingredient_id: string | null; ingredient_name: string; ingredient_unit: string; quantity_used: number }>,
  ) => void;
  /**
   * Whether the builder offers creating a NEW org ingredient inline.
   * The standalone recipes page wants this; the menu item editor doesn't —
   * mapping per-size quantities is its job, ingredient onboarding isn't.
   */
  allowCreateIngredient?: boolean;
}

const rowKey = (r: { size_label: string; ingredient_name: string }) => `${r.size_label}::${r.ingredient_name}`;

/**
 * Single-screen recipe builder — every size's lines edited together,
 * with a live current-cost estimate per size (browser-computed from
 * cost_per_unit × quantity, so it tracks today's ingredient costs).
 */
export function RecipeBuilder({
  orgId,
  sizes,
  initialRows,
  catalog,
  priceForSize,
  copySources = [],
  fetchCopyRows,
  onSave,
  deferred,
  onRowsChange,
  allowCreateIngredient = true,
}: RecipeBuilderProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [factors, setFactors] = useState<Record<string, string>>({});
  const [newIngredient, setNewIngredient] = useState(false);
  const [copying, setCopying] = useState(false);

  const form = useForm<BuilderForm>({
    defaultValues: { rows: [] },
  });
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "rows" });

  // Reseed when the selected item (or its server rows) change
  const initialKey = useMemo(
    () => initialRows.map((r) => `${rowKey(r)}=${r.quantity_used}`).sort().join("|"),
    [initialRows],
  );
  useEffect(() => {
    // reset (not replace) so defaultValues track the server state — otherwise
    // isDirty compares against the constructor's empty array
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

  const activeCatalog = useMemo(() => catalog.filter((c) => c.is_active), [catalog]);
  const catalogOptions = activeCatalog.map((c) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit), data: c }));
  const costSources = useMemo(
    () => catalog.map((c) => ({ id: c.id, cost_per_unit: c.cost_per_unit > 0 ? c.cost_per_unit : null })),
    [catalog],
  );

  const rowsForSize = (size: string) =>
    watchedRows.map((r, i) => ({ ...r, _index: i })).filter((r) => r.size_label === size);

  const addRow = (size: string) =>
    append({ size_label: size, org_ingredient_id: null, ingredient_name: "", ingredient_unit: "g", quantity_used: "" });

  /** Apply base-size scaling: non-base sizes get base rows × their factor. */
  const applyScaling = () => {
    const base = sizes[0];
    const baseRows = watchedRows.filter((r) => r.size_label === base);
    const next: BuilderRow[] = [...baseRows];
    for (const size of sizes.slice(1)) {
      const factor = parseFloat(factors[size] ?? "1");
      if (!Number.isFinite(factor) || factor <= 0) continue;
      for (const r of baseRows) {
        const qty = parseFloat(r.quantity_used);
        next.push({
          ...r,
          size_label: size,
          quantity_used: Number.isFinite(qty) ? String(Math.round(qty * factor * 1000) / 1000) : "",
        });
      }
    }
    replace(next);
  };

  const copyFrom = async (sourceId: string | null) => {
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
        // collapse duplicates that landed on the same (size, name) after remapping
        .filter((r, i, arr) => arr.findIndex((x) => rowKey(x) === rowKey(r)) === i);
      replace(mapped);
    } finally {
      setCopying(false);
    }
  };

  const cleanRows = (raw: BuilderRow[]) =>
    raw
      .map((r) => ({
        size_label: r.size_label,
        org_ingredient_id: r.org_ingredient_id,
        ingredient_name: r.ingredient_name,
        ingredient_unit: r.ingredient_unit,
        quantity_used: parseFloat(r.quantity_used),
      }))
      .filter((r) => r.ingredient_name && Number.isFinite(r.quantity_used) && r.quantity_used > 0);

  // deferred mode: stream the cleaned rows to the host on every edit
  useEffect(() => {
    if (deferred && onRowsChange) onRowsChange(cleanRows(watchedRows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred, JSON.stringify(watchedRows)]);

  const save = async () => {
    if (!onSave) return;
    const current = form.getValues("rows");
    const cleaned = cleanRows(current);
    const currentKeys = new Set(cleaned.map(rowKey));
    const removed = initialRows
      .filter((r) => !currentKeys.has(rowKey(r)))
      .map((r) => ({ size_label: r.size_label, ingredient_name: r.ingredient_name }));
    setSaving(true);
    try {
      await onSave(cleaned, removed);
      form.reset({ rows: current });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-5 max-h-[640px] overflow-y-auto">
      {/* toolbar: copy-from + inline ingredient create + scaling toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        {copySources.length > 0 && fetchCopyRows && (
          <div className="flex items-center gap-1.5">
            <Copy size={13} className="text-muted-foreground" />
            <SearchableSelect
              className="w-48 h-8 text-xs"
              options={copySources.map((s2) => ({ value: s2.id, label: s2.label }))}
              value={null}
              onChange={(v) => void copyFrom(v)}
              placeholder={t("recipes.builder.copyFrom")}
              disabled={copying}
            />
          </div>
        )}
        {allowCreateIngredient && (
          <Button type="button" size="sm" variant="outline" onClick={() => setNewIngredient(true)} className="gap-1">
            <Plus size={13} /> {t("inventory.catalog.newIngredient")}
          </Button>
        )}
        {sizes.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground ms-auto">
            <Switch checked={scaling} onCheckedChange={setScaling} />
            {t("recipes.builder.scaleFromBase", { base: sizes[0] })}
          </label>
        )}
      </div>

      {/* scaling factors */}
      {scaling && sizes.length > 1 && (
        <div className="flex items-end gap-3 flex-wrap rounded-lg border bg-muted/30 p-3">
          {sizes.slice(1).map((size) => (
            <div key={size} className="space-y-1">
              <p className="text-xs text-muted-foreground">{size} ×</p>
              <Input
                type="number"
                step="0.05"
                min="0"
                className="h-8 w-24"
                value={factors[size] ?? ""}
                placeholder="1.5"
                onChange={(e) => setFactors((f) => ({ ...f, [size]: e.target.value }))}
              />
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={applyScaling}>
            {t("recipes.builder.applyScaling")}
          </Button>
        </div>
      )}

      {/* one section per size */}
      {sizes.map((size) => {
        const rows = rowsForSize(size);
        const lines = rows.map((r) => ({
          org_ingredient_id: r.org_ingredient_id,
          quantity_used: parseFloat(r.quantity_used) || 0,
        }));
        const estimate = rows.length > 0 ? recipeCost(lines, costSources) : null;
        const price = priceForSize?.(size) ?? null;
        const marginPct = estimate !== null && price && price > 0 ? (price - estimate) / price : null;

        return (
          <div key={size}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">{size}</Badge>
              <div className="h-px bg-border flex-1" />
              {/* live current-cost estimate (browser-computed from today's ingredient costs) */}
              <span className="text-xs text-muted-foreground tabular">
                {t("recipes.builder.estimate")}: <span className="font-semibold">{fmtMoney(estimate)}</span>
                {marginPct !== null && <> · {t("recipes.builder.margin")} {fmtPercent(marginPct)}</>}
              </span>
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
                <div key={fields[row._index]?.id ?? row._index} className="flex items-center gap-2">
                  <SearchableSelect
                    className="flex-1"
                    options={catalogOptions}
                    value={row.org_ingredient_id}
                    onChange={(v, opt) => {
                      form.setValue(`rows.${row._index}.org_ingredient_id`, v, { shouldDirty: true });
                      if (opt?.data) {
                        const ing = opt.data as OrgIngredient;
                        form.setValue(`rows.${row._index}.ingredient_name`, ing.name, { shouldDirty: true });
                        form.setValue(`rows.${row._index}.ingredient_unit`, ing.unit, { shouldDirty: true });
                      }
                    }}
                    // legacy rows can carry only a free-text name — keep it visible
                    placeholder={row.ingredient_name || t("recipes.ingredient")}
                  />
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    className="w-28 h-9"
                    value={row.quantity_used}
                    placeholder="0.000"
                    onChange={(e) => form.setValue(`rows.${row._index}.quantity_used`, e.target.value, { shouldDirty: true })}
                  />
                  <span className="text-xs text-muted-foreground w-8">{fmtUnit(row.ingredient_unit)}</span>
                  <span className="text-xs text-muted-foreground tabular w-20 text-end">
                    {(() => {
                      const src = costSources.find((c) => c.id === row.org_ingredient_id);
                      const qty = parseFloat(row.quantity_used);
                      return src?.cost_per_unit != null && Number.isFinite(qty)
                        ? fmtMoney(src.cost_per_unit * qty)
                        : "—";
                    })()}
                  </span>
                  <Button type="button" variant="ghost" size="iconSm" className="text-destructive" onClick={() => remove(row._index)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => addRow(size)} className="gap-1 text-muted-foreground">
                <Plus size={13} /> {t("recipes.addIngredient")}
              </Button>
            </div>
          </div>
        );
      })}

      {/* commit (hidden when the host form owns the save) */}
      {!deferred && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {dirty && <span className="text-xs text-warning">{t("recipes.builder.unsaved")}</span>}
          <Button type="button" onClick={() => void save()} loading={saving} disabled={!dirty} className="gap-1">
            <Save size={14} /> {t("recipes.builder.saveAll")}
          </Button>
        </div>
      )}

      {newIngredient && (
        <CatalogItemDialog
          open={newIngredient}
          onClose={() => setNewIngredient(false)}
          edit={null}
          orgId={orgId}
          onCreated={(ing) =>
            // drop the new ingredient straight into the base size
            append({
              size_label: sizes[0],
              org_ingredient_id: ing.id,
              ingredient_name: ing.name,
              ingredient_unit: ing.unit,
              quantity_used: "",
            })
          }
        />
      )}
    </div>
  );
}
