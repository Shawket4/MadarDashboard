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
  listAddonIngredients, putOptionRecipe, useListAddonIngredients, useListAddonItems, useListCatalog,
} from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { fmtMoney } from "@/lib/format";

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
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
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
  const saveAll = async (rows: CleanRow[], _removed: { size_label: string; ingredient_name: string }[]) => {
    try {
      // Unified model: an add-on IS a modifier option (same stable id) and its
      // recipe is one replace-set of id-keyed lines — adds/edits/removals in a
      // single call (quantity 0 = swap marker, allowed).
      const lines = rows
        .filter((r) => r.org_ingredient_id)
        .map((r) => ({
          ingredient_id: r.org_ingredient_id!,
          quantity: r.quantity_used,
          unit: r.ingredient_unit,
        }));
      await putOptionRecipe(addon.id, lines);
      void invalidateRecipes();
      toast.success(t("recipes.builder.saved", "Recipe saved"));
    } catch (e) {
      onErr(e);
      throw e;
    }
  };

  if (ingredients.isLoading) return <div className="grid place-items-center rounded-xl border p-10"><Spinner /></div>;

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="border-b px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-base leading-tight">{addon.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("common.addon", addon.addon_type)}</p>
        </div>
        {addon.default_price != null ? (
          <span className="shrink-0 text-sm font-medium tabular text-muted-foreground">{fmtMoney(addon.default_price)}</span>
        ) : null}
      </div>
      <div className="p-5">
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
