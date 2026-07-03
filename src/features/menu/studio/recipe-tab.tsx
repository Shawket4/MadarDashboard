import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Coins, Plus, Trash2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/app/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  putSizeRecipe,
  useListCatalog,
  updateCatalogItem,
} from "@/data/api/generated/api";
import type { OrgIngredient, SizeOut, StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StudioSection } from "./studio-section";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  orgId: string | null;
  onSaved: () => void;
}

interface Line {
  ingredient_id: string;
  quantity: string;
  unit: string;
}

export function RecipeTab({ studio, orgId, onSaved }: Props) {
  const { t } = useTranslation();
  const activeSizes = useMemo(() => [...studio.sizes].sort((a, b) => a.sort - b.sort), [studio.sizes]);
  const [sizeId, setSizeId] = useState<string>(activeSizes[0]?.id ?? "");
  const size: SizeOut | undefined = activeSizes.find((s) => s.id === sizeId) ?? activeSizes[0];

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

  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);

  // Seed the editor from the selected size's recipe.
  useEffect(() => {
    if (!size) {
      setLines([]);
      return;
    }
    setLines(
      size.recipe.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity: String(parseFloat(r.quantity)),
        unit: r.unit,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size?.id, studio.catalog_revision]);

  // Keep selection valid after a re-fetch.
  useEffect(() => {
    if (activeSizes.length && !activeSizes.some((s) => s.id === sizeId)) setSizeId(activeSizes[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSizes]);

  const costOf = (id: string): number | null => {
    const c = byId.get(id);
    return c?.cost_per_unit != null && c.cost_per_unit > 0 ? c.cost_per_unit : null;
  };

  // Live estimated cost from the current (unsaved) editor state.
  const estimate = useMemo(() => {
    if (lines.length === 0) return { piastres: null as number | null, incomplete: false };
    let sum = 0;
    let incomplete = false;
    for (const l of lines) {
      const qty = parseFloat(l.quantity);
      const unitCost = costOf(l.ingredient_id);
      if (!l.ingredient_id || unitCost == null || !Number.isFinite(qty)) {
        incomplete = true;
        continue;
      }
      sum += unitCost * qty;
    }
    return { piastres: sum, incomplete };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, byId]);

  const setLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ingredient_id: "", quantity: "", unit: "g" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (!size) return;
    const clean = lines
      .filter((l) => l.ingredient_id && Number.isFinite(parseFloat(l.quantity)))
      .map((l) => ({ ingredient_id: l.ingredient_id, quantity: parseFloat(l.quantity), unit: l.unit }));
    setSaving(true);
    try {
      await putSizeRecipe(size.id, { lines: clean });
      toast.success(t("common.savedChanges", "Changes saved"));
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const priceForSize = size ? size.price : null;
  const marginPct =
    estimate.piastres != null && !estimate.incomplete && priceForSize && priceForSize > 0
      ? (priceForSize - estimate.piastres) / priceForSize
      : null;

  if (activeSizes.length === 0) {
    return (
      <StudioSection title={t("menu.studio.tabs.recipe", "Recipe & cost")}>
        <p className="rounded-lg border border-dashed bg-muted/30 py-6 text-center text-sm text-muted-foreground">
          {t("menu.studio.recipe.needSize", "Add a size first — recipes are defined per size.")}
        </p>
      </StudioSection>
    );
  }

  return (
    <div className="space-y-6">
      <StudioSection
        title={t("menu.studio.tabs.recipe", "Recipe & cost")}
        description={t("menu.studio.recipe.desc", "What one unit of this size consumes. Cost is computed live.")}
        actions={
          activeSizes.length > 1 ? (
            <Select value={sizeId} onValueChange={setSizeId}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeSizes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      >
        {/* Live cost strip */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("menu.studio.recipe.liveCost", "Live cost")}</span>
            <span className="text-base font-semibold tabular">
              {estimate.piastres != null && !estimate.incomplete ? fmtMoney(estimate.piastres) : "—"}
            </span>
            {estimate.incomplete ? (
              <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
                <AlertTriangle className="size-3.5" />
                {t("menu.studio.recipe.incomplete", "Cost incomplete")}
              </Badge>
            ) : estimate.piastres != null ? (
              <Badge variant="outline" className="gap-1 border-success/40 text-success">
                <CheckCircle2 className="size-3.5" />
                {t("menu.studio.recipe.complete", "Fully costed")}
              </Badge>
            ) : null}
          </div>
          {marginPct != null ? (
            <div className="text-end">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("recipes.builder.margin", "Margin")}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold tabular",
                  marginPct >= 0.6 ? "text-success" : marginPct >= 0.3 ? "text-foreground" : "text-warning",
                )}
              >
                {new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(marginPct)}
              </p>
            </div>
          ) : null}
        </div>

        {/* Lines */}
        <div className="space-y-2">
          {lines.map((line, idx) => {
            const ing = line.ingredient_id ? byId.get(line.ingredient_id) : undefined;
            const unitCost = costOf(line.ingredient_id);
            const qty = parseFloat(line.quantity);
            const lineCost = ing && unitCost != null && Number.isFinite(qty) ? fmtMoney(unitCost * qty) : null;
            const unlinked = !line.ingredient_id;
            const uncosted = !!ing && unitCost == null;
            return (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg border bg-muted/20 p-2 sm:p-2.5"
              >
                <Combobox
                  options={ingOptions}
                  value={line.ingredient_id || null}
                  onChange={(v) => {
                    const picked = byId.get(v);
                    setLine(idx, { ingredient_id: v, unit: picked?.unit ?? line.unit });
                  }}
                  placeholder={t("recipes.ingredient", "Ingredient")}
                />
                <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.quantity}
                    placeholder="0.000"
                    onChange={(e) => setLine(idx, { quantity: e.target.value })}
                    className="h-9 w-24 border-0 bg-transparent text-end tabular shadow-none focus-visible:ring-0"
                  />
                  <span className="min-w-10 pe-3 ps-1 text-xs text-muted-foreground">
                    {t(`units.${line.unit}`, line.unit)}
                  </span>
                </div>
                {/* Line cost / inline fix affordance */}
                <div className="min-w-24 text-end">
                  {unlinked ? (
                    <span className="text-xs text-warning">{t("menu.studio.recipe.pickIngredient", "Pick an ingredient")}</span>
                  ) : uncosted ? (
                    <FixCostPopover ingredient={ing!} orgId={orgId} onFixed={onSaved} />
                  ) : (
                    <span className="text-sm font-medium tabular">{lineCost}</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  aria-label={t("recipes.builder.removeIngredient", "Remove ingredient")}
                  onClick={() => removeLine(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addLine}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Plus className="size-4" />
            {t("recipes.addIngredient", "Add ingredient")}
          </button>
        </div>

        {estimate.incomplete ? (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-warning">
            <Wand2 className="mt-px size-3.5 shrink-0" />
            {t(
              "menu.studio.recipe.fixHint",
              "Link every line to an ingredient and give each ingredient a cost to complete the cost.",
            )}
          </p>
        ) : null}
      </StudioSection>

      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => void save()} loading={saving}>
          {t("menu.studio.recipe.saveRecipe", "Save recipe")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Inline "fix cost" flow — set the ingredient's cost per unit without leaving the
 * editor. Patches the org catalog item; the live cost recomputes on refetch.
 */
function FixCostPopover({
  ingredient,
  orgId,
  onFixed,
}: {
  ingredient: OrgIngredient;
  orgId: string | null;
  onFixed: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!orgId) return;
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0) {
      toast.error(t("menu.studio.recipe.invalidCost", "Enter a valid cost"));
      return;
    }
    setSaving(true);
    try {
      await updateCatalogItem(orgId, ingredient.id, { cost_per_unit: egpToPiastres(n) });
      toast.success(t("menu.studio.recipe.costSet", "Ingredient cost set"));
      setOpen(false);
      onFixed();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-warning/40 px-2 py-0.5 text-xs font-medium text-warning hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Coins className="size-3" />
          {t("menu.studio.recipe.setCost", "Set cost")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{ingredient.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("menu.studio.recipe.costPerUnit", { unit: t(`units.${ingredient.unit}`, ingredient.unit), defaultValue: "Cost per {{unit}} (EGP)" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <Button type="button" size="sm" loading={saving} onClick={() => void submit()}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
