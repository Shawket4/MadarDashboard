import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { ListPicker } from "@/shared/ui/list-picker";
import { useListMenuItems, useGetMenuItem, getMenuItem, upsertDrinkRecipe, deleteDrinkRecipe } from "@/shared/api/generated/api";
import { useCatalog } from "@/entities/inventory/queries";
import { getGetMenuItemQueryKey, getListSkuCostsQueryKey } from "@/shared/api/generated/api";
import { getErrorMessage } from "@/shared/api/errors";
import { RecipeBuilder } from "@/features/recipe-builder/recipe-builder";

// ─────────────────────────────────────────────────────────────────────────────
// Drinks Tab
// ─────────────────────────────────────────────────────────────────────────────
export function DrinksTab({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selItemId, setSelItemId] = useState<string | null>(null);

  const { data: items = [] } = useListMenuItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: fullItem, isLoading } = useGetMenuItem(selItemId as string, { query: { enabled: !!selItemId } });
  const { data: catalog = [] } = useCatalog(orgId);

  const recipes = useMemo(() => fullItem?.recipes ?? [], [fullItem?.recipes]);

  const sizes = useMemo<string[]>(() => {
    const declared = (fullItem?.sizes ?? []).map((s) => s.label);
    const inRecipes = Array.from(new Set(recipes.map((r) => r.size_label)));
    if (declared.length === 0 && inRecipes.length === 0) return ["one_size"];
    const union = Array.from(new Set([...declared, ...inRecipes]));
    return union.length > 0 ? union : ["one_size"];
  }, [fullItem?.sizes, recipes]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(selItemId ?? "") });
    // recipe changes move the cost rollups
    qc.invalidateQueries({ queryKey: getListSkuCostsQueryKey() });
  };

  const priceForSize = (size: string): number | null => {
    if (!fullItem) return null;
    const override = fullItem.sizes?.find((s) => s.label === size)?.price_override;
    return override ?? fullItem.base_price ?? null;
  };

  // Commit the whole builder state: upsert every kept line, delete removed ones
  const saveAll = async (
    rows: Array<{ size_label: string; org_ingredient_id: string | null; ingredient_name: string; ingredient_unit: string; quantity_used: number }>,
    removed: Array<{ size_label: string; ingredient_name: string }>,
  ) => {
    try {
      for (const r of rows) await upsertDrinkRecipe(selItemId!, r as never);
      for (const r of removed) await deleteDrinkRecipe(selItemId!, r.size_label, { ingredient_name: r.ingredient_name });
      invalidate();
      toast.success(t("recipes.builder.saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <ListPicker
        heading={t("recipes.selectDrink")}
        items={items.map((it) => ({
          id: it.id,
          label: it.name,
          sublabel: it.description ?? null,
        }))}
        selectedId={selItemId}
        onSelect={setSelItemId}
        searchPlaceholder={t("menu.searchItems")}
        emptyLabel={t("menu.emptyItems")}
      />

      <div className="rounded-xl border bg-card overflow-hidden">
        {!selItemId ? (
          <EmptyState icon={Coffee} title={t("recipes.selectDrink")} description={t("recipes.selectDrinkHint")} className="h-[600px]" />
        ) : isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <>
            <div className="p-4 border-b bg-muted/30">
              <p className="font-bold">{fullItem?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{sizes.length} size(s)</p>
            </div>
            <RecipeBuilder
              key={selItemId}
              orgId={orgId}
              sizes={sizes}
              initialRows={recipes}
              catalog={catalog}
              priceForSize={priceForSize}
              copySources={items.filter((it) => it.id !== selItemId).map((it) => ({ id: it.id, label: it.name }))}
              fetchCopyRows={async (id: string) => (await getMenuItem(id)).recipes ?? []}
              onSave={saveAll}
            />
          </>
        )}
      </div>
    </div>
  );
}

