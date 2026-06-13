import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tag } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { RecipeBuilder, type CleanRow, type RecipeRowInit } from "./recipe-builder";
import { MasterList } from "./master-list";
import { invalidateRecipes } from "./util";
import {
  deleteAddonIngredient, listAddonIngredients, upsertAddonIngredient, useListAddonIngredients, useListAddonItems, useListCatalog,
} from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";

export function AddonsTab({ orgId, initialSelectedId }: { orgId: string; initialSelectedId?: string }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);
  useEffect(() => { if (initialSelectedId) setSelected(initialSelectedId); }, [initialSelectedId]);

  const addons = useListAddonItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const catalog = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const list = useMemo(() => addons.data ?? [], [addons.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);
  const selectedAddon = list.find((a) => a.id === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <MasterList
        items={list.map((a) => ({ id: a.id, label: tname(a) }))}
        selectedId={selected}
        onSelect={setSelected}
        loading={addons.isLoading}
        searchPlaceholder={t("recipes.searchAddons", "Search add-ons…")}
        emptyText={t("recipes.noAddons", "No add-ons")}
      />
      {selected && selectedAddon ? (
        <AddonDetail key={selected} addon={selectedAddon} orgId={orgId} catalog={catalog.data ?? []} copySources={list.filter((a) => a.id !== selected).map((a) => ({ id: a.id, label: tname(a) }))} />
      ) : (
        <div className="rounded-xl border"><EmptyState icon={Tag} title={t("recipes.selectAddon", "Select an add-on")} description={t("recipes.selectAddonHint", "Pick an add-on to edit its recipe")} /></div>
      )}
    </div>
  );
}

function AddonDetail({ addon, orgId, catalog, copySources }: { addon: AddonItem; orgId: string; catalog: Parameters<typeof RecipeBuilder>[0]["catalog"]; copySources: { id: string; label: string }[] }) {
  const { t } = useTranslation();
  const ingredients = useListAddonIngredients(addon.id, { query: { enabled: !!addon.id } });

  const initialRows = useMemo<RecipeRowInit[]>(() => (ingredients.data ?? []).map((r) => ({
    size_label: "one_size", org_ingredient_id: r.org_ingredient_id ?? null, ingredient_name: r.ingredient_name, ingredient_unit: r.unit, quantity_used: r.quantity_used,
  })), [ingredients.data]);

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const saveAll = async (rows: CleanRow[], removed: { size_label: string; ingredient_name: string }[]) => {
    try {
      for (const r of rows) await upsertAddonIngredient(addon.id, { org_ingredient_id: r.org_ingredient_id, ingredient_name: r.ingredient_name, ingredient_unit: r.ingredient_unit, quantity_used: r.quantity_used });
      for (const r of removed) await deleteAddonIngredient(addon.id, { ingredient_name: r.ingredient_name });
      void invalidateRecipes();
      toast.success(t("recipes.builder.saved", "Recipe saved"));
    } catch (e) {
      onErr(e);
      throw e;
    }
  };

  if (ingredients.isLoading) return <div className="grid place-items-center rounded-xl border p-10"><Spinner /></div>;

  return (
    <div className="rounded-xl border">
      <div className="border-b bg-muted/30 p-4"><p className="font-semibold">{addon.name}</p></div>
      <div className="p-4">
        <RecipeBuilder
          orgId={orgId}
          sizes={["one_size"]}
          initialRows={initialRows}
          catalog={catalog}
          priceForSize={() => addon.default_price ?? null}
          copySources={copySources}
          fetchCopyRows={async (id) => (await listAddonIngredients(id)).map((r) => ({ size_label: "one_size", org_ingredient_id: r.org_ingredient_id ?? null, ingredient_name: r.ingredient_name, ingredient_unit: r.unit, quantity_used: r.quantity_used }))}
          onSave={saveAll}
        />
      </div>
    </div>
  );
}
