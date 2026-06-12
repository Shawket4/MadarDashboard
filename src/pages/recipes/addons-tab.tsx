import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { ListPicker } from "@/shared/ui/list-picker";
import { useListAddonItems, useListAddonIngredients, upsertAddonIngredient, deleteAddonIngredient, listAddonIngredients } from "@/shared/api/generated/api";
import { useCatalog } from "@/entities/inventory/queries";
import { getListAddonIngredientsQueryKey, getListAddonCostsQueryKey } from "@/shared/api/generated/api";
import { getErrorMessage } from "@/shared/api/errors";
import { RecipeBuilder } from "@/features/recipe-builder/recipe-builder";
import type { AddonItem } from "@/shared/types";

// ─────────────────────────────────────────────────────────────────────────────
// Addons Tab
// ─────────────────────────────────────────────────────────────────────────────
export function AddonsTab({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selAddonId, setSelAddonId] = useState<string | null>(null);

  const { data: addons = [] } = useListAddonItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: recipes = [], isLoading } = useListAddonIngredients(selAddonId as string, { query: { enabled: !!selAddonId } });
  const { data: catalog = [] } = useCatalog(orgId);

  const selAddon = addons.find((a: AddonItem) => a.id === selAddonId);

  // Addon recipes are size-less — the builder treats them as a single base size
  const initialRows = useMemo(
    () =>
      recipes.map((r) => ({
        size_label: "one_size",
        org_ingredient_id: r.org_ingredient_id ?? null,
        ingredient_name: r.ingredient_name,
        ingredient_unit: r.unit,
        quantity_used: r.quantity_used,
      })),
    [recipes],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAddonIngredientsQueryKey(selAddonId ?? "") });
    qc.invalidateQueries({ queryKey: getListAddonCostsQueryKey() });
  };

  const saveAll = async (
    rows: Array<{ size_label: string; org_ingredient_id: string | null; ingredient_name: string; ingredient_unit: string; quantity_used: number }>,
    removed: Array<{ size_label: string; ingredient_name: string }>,
  ) => {
    try {
      for (const r of rows) {
        await upsertAddonIngredient(selAddonId!, {
          org_ingredient_id: r.org_ingredient_id,
          ingredient_name: r.ingredient_name,
          ingredient_unit: r.ingredient_unit,
          quantity_used: r.quantity_used,
        } as never);
      }
      for (const r of removed) await deleteAddonIngredient(selAddonId!, { ingredient_name: r.ingredient_name });
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
        heading={t("recipes.selectAddon")}
        items={addons.map((a: AddonItem) => ({
          id: a.id,
          label: a.name,
          sublabel: t(`menu.addonTypes.${a.addon_type}`, { defaultValue: a.addon_type }),
        }))}
        selectedId={selAddonId}
        onSelect={setSelAddonId}
        searchPlaceholder={t("menu.searchAddons")}
        emptyLabel={t("menu.emptyAddons")}
      />

      <div className="rounded-xl border bg-card overflow-hidden">
        {!selAddonId ? (
          <EmptyState icon={Package} title={t("recipes.selectAddon")} description={t("recipes.selectAddonHint")} className="h-[600px]" />
        ) : isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <>
            <div className="p-4 border-b bg-muted/30">
              <p className="font-bold">{selAddon?.name}</p>
            </div>
            <RecipeBuilder
              key={selAddonId}
              orgId={orgId}
              sizes={["one_size"]}
              initialRows={initialRows}
              catalog={catalog}
              priceForSize={() => selAddon?.default_price ?? null}
              copySources={addons.filter((a: AddonItem) => a.id !== selAddonId).map((a: AddonItem) => ({ id: a.id, label: a.name }))}
              fetchCopyRows={async (id: string) =>
                (await listAddonIngredients(id)).map((r) => ({
                  size_label: "one_size",
                  org_ingredient_id: r.org_ingredient_id ?? null,
                  ingredient_name: r.ingredient_name,
                  ingredient_unit: r.unit,
                  quantity_used: r.quantity_used,
                }))
              }
              onSave={saveAll}
            />
          </>
        )}
      </div>
    </div>
  );
}

