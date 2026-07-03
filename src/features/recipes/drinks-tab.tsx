import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CupSoda } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { RecipeBuilder, type CleanRow, type RecipeRowInit } from "./recipe-builder";
import { MasterList } from "./master-list";
import { invalidateRecipes } from "./util";
import {
  getMenuItem, getStudio, putSizeRecipe, useGetMenuItem, useListCatalog, useListMenuItems,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";

export function DrinksTab({ orgId, initialSelectedId }: { orgId: string; initialSelectedId?: string }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);
  useEffect(() => { if (initialSelectedId) setSelected(initialSelectedId); }, [initialSelectedId]);

  const items = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const catalog = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const list = useMemo(() => items.data ?? [], [items.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <MasterList
        items={list.map((m) => ({ id: m.id, label: tname(m) }))}
        selectedId={selected}
        onSelect={setSelected}
        loading={items.isLoading}
        searchPlaceholder={t("recipes.searchItems", "Search items…")}
        emptyText={t("recipes.noItems", "No items")}
      />
      {selected ? (
        <DrinkDetail key={selected} itemId={selected} orgId={orgId} catalog={catalog.data ?? []} copySources={list.filter((m) => m.id !== selected).map((m) => ({ id: m.id, label: tname(m) }))} />
      ) : (
        <div className="rounded-xl border"><EmptyState icon={CupSoda} title={t("recipes.selectDrink", "Select an item")} description={t("recipes.selectDrinkHint", "Pick an item to edit its recipe per size")} /></div>
      )}
    </div>
  );
}

function DrinkDetail({ itemId, orgId, catalog, copySources }: { itemId: string; orgId: string; catalog: Parameters<typeof RecipeBuilder>[0]["catalog"]; copySources: { id: string; label: string }[] }) {
  const { t } = useTranslation();
  const item = useGetMenuItem(itemId, { query: { enabled: !!itemId } });
  const full = item.data;

  const recipes = useMemo<RecipeRowInit[]>(() => (full?.recipes ?? []).map((r) => ({
    size_label: r.size_label, org_ingredient_id: r.org_ingredient_id ?? null, ingredient_name: r.ingredient_name, ingredient_unit: r.ingredient_unit, quantity_used: r.quantity_used,
  })), [full?.recipes]);

  const sizes = useMemo<string[]>(() => {
    const declared = (full?.sizes ?? []).map((s) => s.label);
    const inRecipes = recipes.map((r) => r.size_label);
    const union = Array.from(new Set([...declared, ...inRecipes]));
    return union.length ? union : ["one_size"];
  }, [full?.sizes, recipes]);

  const priceForSize = (size: string): number | null => {
    if (!full) return null;
    return full.sizes?.find((s) => s.label === size)?.price_override ?? full.base_price ?? null;
  };

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const saveAll = async (rows: CleanRow[], _removed: { size_label: string; ingredient_name: string }[]) => {
    try {
      // Unified model: recipes live in id-keyed `recipe_lines` per SIZE — one
      // replace-set per size covers adds/edits/removals (no diffing). The Studio
      // aggregate provides the size ids; only ingredient-linked rows are
      // writable (the builder always links via the catalog picker).
      const studio = await getStudio(itemId);
      for (const size of studio.sizes) {
        const lines = rows
          .filter((r) => r.size_label === size.label && r.org_ingredient_id)
          .map((r) => ({
            ingredient_id: r.org_ingredient_id!,
            quantity: r.quantity_used,
            unit: r.ingredient_unit,
          }));
        await putSizeRecipe(size.id, { lines });
      }
      void invalidateRecipes();
      toast.success(t("recipes.builder.saved", "Recipe saved"));
    } catch (e) {
      onErr(e);
      throw e;
    }
  };

  if (item.isLoading || !full) return <div className="grid place-items-center rounded-xl border p-10"><Spinner /></div>;

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="border-b px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-base leading-tight">{full.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("recipes.perSize", "{{count}} size", { count: sizes.length })}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {sizes.map((size) => (
            <span key={size} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {size === "one_size" ? t("recipes.oneSize", "One size") : size}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5">
        <RecipeBuilder
          orgId={orgId}
          sizes={sizes}
          initialRows={recipes}
          catalog={catalog}
          priceForSize={priceForSize}
          copySources={copySources}
          fetchCopyRows={async (id) => (await getMenuItem(id)).recipes ?? []}
          onSave={saveAll}
        />
      </div>
    </div>
  );
}
