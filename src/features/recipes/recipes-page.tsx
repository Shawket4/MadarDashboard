import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearch } from "@tanstack/react-router";
import { Boxes, BookOpen, Package, Sliders } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useOrgId } from "@/hooks/use-org-id";
import { getMenuItem, listAddonIngredients, useListAddonItems, useListMenuItems } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { DrinksTab } from "./drinks-tab";
import { AddonsTab } from "./addons-tab";
import { SlotsOptionalsTab } from "./slots-optionals-tab";

interface RecipeExportRow { name: string; sub: string; ingredients: string }

export function RecipesPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  // Deep-link: ?item=<id> opens that drink, ?addon=<id> that add-on (e.g. from the
  // menu "cost missing" warning).
  const { item, addon } = useSearch({ strict: false }) as { item?: string; addon?: string };
  const [tab, setTab] = useState(addon ? "addons" : "drinks");
  useEffect(() => {
    if (item) setTab("drinks");
    else if (addon) setTab("addons");
  }, [item, addon]);

  const items = useListMenuItems({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const addons = useListAddonItems({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const itemList = items.data ?? [];
  const addonList = addons.data ?? [];

  const handleExport = async () => {
    const toastId = toast.loading(t("excel.generating", "Gathering recipe data…"));
    try {
      const drinkRows: RecipeExportRow[] = [];
      for (const it of itemList) {
        const full = await getMenuItem(it.id);
        const declared = (full.sizes ?? []).map((s) => s.label);
        const inRecipes = Array.from(new Set((full.recipes ?? []).map((r) => r.size_label)));
        const sizes = Array.from(new Set([...declared, ...inRecipes]));
        for (const size of sizes.length ? sizes : ["one_size"]) {
          const lines = (full.recipes ?? []).filter((r) => r.size_label === size);
          drinkRows.push({
            name: full.name,
            sub: size === "one_size" ? t("recipes.oneSize", "One size") : size,
            ingredients: lines.length ? lines.map((r) => `${r.ingredient_name} (${r.quantity_used} ${r.ingredient_unit})`).join(", ") : "—",
          });
        }
      }
      const addonRows: RecipeExportRow[] = [];
      for (const a of addonList) {
        const lines = await listAddonIngredients(a.id);
        addonRows.push({ name: a.name, sub: a.addon_type, ingredients: lines.length ? lines.map((r) => `${r.ingredient_name} (${r.quantity_used} ${r.unit})`).join(", ") : "—" });
      }
      const cols = (subHeader: string): ExcelColumn<RecipeExportRow>[] => [
        { header: t("common.name", "Name"), accessor: (r) => r.name, type: "text", width: 28 },
        { header: subHeader, accessor: (r) => r.sub, type: "text", width: 18 },
        { header: t("recipes.ingredients", "Ingredients"), accessor: (r) => r.ingredients, type: "text", width: 70 },
      ];
      await exportToExcel({
        filename: "Madar-Recipes",
        sheets: [
          { name: t("recipes.tabs.drinks", "Drinks"), title: t("recipes.tabs.drinks", "Drinks"), rows: drinkRows as unknown as Record<string, unknown>[], columns: cols(t("recipes.size", "Size")) as unknown as ExcelColumn<Record<string, unknown>>[] },
          { name: t("recipes.tabs.addons", "Add-ons"), title: t("recipes.tabs.addons", "Add-ons"), rows: addonRows as unknown as Record<string, unknown>[], columns: cols(t("common.type", "Type")) as unknown as ExcelColumn<Record<string, unknown>>[] },
        ],
      });
      toast.success(t("common.export", "Export"), { id: toastId });
    } catch (e) {
      toast.error(getErrorMessage(e), { id: toastId });
    }
  };

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("recipes.title", "Recipes")}</h1>
          <p className="text-sm text-muted-foreground">{t("recipes.subtitle", "Define what each item and add-on consumes")}</p>
        </div>
        {orgId ? (
          <div className="flex shrink-0 items-center gap-2">
            <ExportButton onExport={handleExport} disabled={!itemList.length && !addonList.length} />
          </div>
        ) : null}
      </div>
      {!orgId ? (
        <EmptyState icon={Boxes} title={t("recipes.pickOrg", "Select an organization")} />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <PageTabsList>
            <PageTabsTrigger value="drinks"><BookOpen className="size-4" /> {t("recipes.tabs.drinks", "Drinks")}</PageTabsTrigger>
            <PageTabsTrigger value="addons"><Package className="size-4" /> {t("recipes.tabs.addons", "Add-ons")}</PageTabsTrigger>
            <PageTabsTrigger value="slots"><Sliders className="size-4" /> {t("recipes.tabs.slotsOptionals", "Slots & Optionals")}</PageTabsTrigger>
          </PageTabsList>
          <TabsContent value="drinks"><DrinksTab orgId={orgId} initialSelectedId={item} /></TabsContent>
          <TabsContent value="addons"><AddonsTab orgId={orgId} initialSelectedId={addon} /></TabsContent>
          <TabsContent value="slots"><SlotsOptionalsTab orgId={orgId} /></TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
