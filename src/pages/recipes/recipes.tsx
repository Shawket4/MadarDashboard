import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Package, Sliders } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useListMenuItems, getMenuItem, useListAddonItems, listAddonIngredients } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { exportToExcel } from "@/shared/lib/excel";

import { DrinksTab } from "./drinks-tab";
import { AddonsTab } from "./addons-tab";
import { SlotsOptionalsTab } from "./slots-optionals-tab";

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function Recipes() {
  const { t } = useTranslation();
  const { orgId } = useCurrentContext();
  const [tab, setTab] = useState<"drinks" | "addons" | "slots">("drinks");

  const { data: items = [] } = useListMenuItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: addons = [] } = useListAddonItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });

  const handleExport = async () => {
    if (!items.length && !addons.length) return;

    const toastId = toast.loading(t("excel.generating", { defaultValue: "Gathering recipe data..." }));

    try {
      const fullItems = await Promise.all(
        items.map((item) => getMenuItem(item.id))
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drinkRows: any[] = [];
      for (const item of fullItems) {
        const declared = (item.sizes ?? []).map((s) => s.label);
        const inRecipes = Array.from(new Set((item.recipes ?? []).map((r) => r.size_label)));
        let sizes = Array.from(new Set([...declared, ...inRecipes]));
        
        if (sizes.length === 0) {
          sizes = ["one_size"];
        }

        for (const size of sizes) {
          const recipesForSize = (item.recipes ?? []).filter((r) => r.size_label === size);
          
          let ingredientsStr = "blank";
          if (recipesForSize.length > 0) {
            ingredientsStr = recipesForSize
              .map((r) => `${r.ingredient_name} (${Number(r.quantity_used)} ${r.ingredient_unit})`)
              .join(", ");
          }

          drinkRows.push({
            itemName: item.name,
            size: size,
            ingredients: ingredientsStr,
          });
        }
      }

      const allAddonRecipes = await Promise.all(
        addons.map(async (addon) => {
          const recipes = await listAddonIngredients(addon.id);
          return { addon, recipes };
        })
      );

      const addonRows = allAddonRecipes.map(({ addon, recipes }) => {
        let ingredientsStr = "blank";
        if (recipes && recipes.length > 0) {
          ingredientsStr = recipes
            .map((r) => `${r.ingredient_name} (${Number(r.quantity_used)} ${r.unit})`)
            .join(", ");
        }

        return {
          addonName: addon.name,
          type: addon.addon_type,
          ingredients: ingredientsStr,
        };
      });

      await exportToExcel({
        filename: "Recipes_Export",
        sheets: [
          {
            name: "Drinks Recipes",
            title: t("recipes.tabs.drinks", { defaultValue: "Drinks Recipes" }),
            columns: [
              { key: "item", header: t("common.name", { defaultValue: "Item Name" }), accessor: (r) => r.itemName, width: 30 },
              { key: "size", header: t("recipes.size", { defaultValue: "Size" }), accessor: (r) => r.size, width: 20 },
              { key: "ingredients", header: t("recipes.ingredients", { defaultValue: "Ingredients" }), accessor: (r) => r.ingredients, width: 80 },
            ],
            rows: drinkRows,
          },
          {
            name: "Addon Recipes",
            title: t("recipes.tabs.addons", { defaultValue: "Addon Recipes" }),
            columns: [
              { key: "addon", header: t("common.name", { defaultValue: "Addon Name" }), accessor: (r) => r.addonName, width: 30 },
              { key: "type", header: t("common.type", { defaultValue: "Type" }), accessor: (r) => r.type, width: 25 },
              { key: "ingredients", header: t("recipes.ingredients", { defaultValue: "Ingredients" }), accessor: (r) => r.ingredients, width: 80 },
            ],
            rows: addonRows,
          },
        ],
      });

      toast.success(t("excel.done", { count: drinkRows.length + addonRows.length, defaultValue: "Export complete!" }), { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  };

  if (!orgId) return <PageShell title={t("recipes.title")} description={t("recipes.subtitle")}>{null}</PageShell>;

  return (
    <PageShell 
      title={t("recipes.title")} 
      description={t("recipes.subtitle")}
      action={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport} 
          disabled={!items.length && !addons.length}
        >
          {t("common.export", { defaultValue: "Export" })}
        </Button>
      }
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="drinks"><BookOpen size={14} /> {t("recipes.tabs.drinks")}</TabsTrigger>
          <TabsTrigger value="addons"><Package size={14} /> {t("recipes.tabs.addons")}</TabsTrigger>
          <TabsTrigger value="slots"><Sliders size={14} /> {t("recipes.tabs.slotsOptionals")}</TabsTrigger>
        </TabsList>
        <TabsContent value="drinks"><DrinksTab orgId={orgId} /></TabsContent>
        <TabsContent value="addons"><AddonsTab orgId={orgId} /></TabsContent>
        <TabsContent value="slots"><SlotsOptionalsTab orgId={orgId} /></TabsContent>
      </Tabs>
    </PageShell>
  );
}

