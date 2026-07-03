import { useTranslation } from "react-i18next";
import { getRouteApi } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Boxes,
  Copy,
  Info,
  Layers,
  Package,
  Ruler,
  Store,
} from "lucide-react";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useConfirm } from "@/components/app/confirm-dialog";
import { useGetStudio, duplicateItem } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { useOrgId } from "@/hooks/use-org-id";
import { invalidateStudio } from "./util";
import { BasicsTab } from "./basics-tab";
import { SizesTab } from "./sizes-tab";
import { RecipeTab } from "./recipe-tab";
import { ModifiersTab } from "./modifiers-tab";
import { OptionsTab } from "./options-tab";
import { AvailabilityTab } from "./availability-tab";

const routeApi = getRouteApi("/_app/menu/items/$itemId");

const TABS = ["basics", "sizes", "recipe", "modifiers", "options", "availability"] as const;
type TabKey = (typeof TABS)[number];

export function MenuStudioPage() {
  const { t, i18n } = useTranslation();
  const { itemId } = routeApi.useParams();
  const { tab } = routeApi.useSearch();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const activeTab: TabKey = (TABS as readonly string[]).includes(tab ?? "") ? (tab as TabKey) : "basics";
  const setTab = (next: string) =>
    void navigate({ to: ".", replace: true, search: (prev: Record<string, unknown>) => ({ ...prev, tab: next }) });

  const studioQ = useGetStudio(itemId, { query: { enabled: !!itemId } });
  const studio = studioQ.data;

  const goBack = () => void navigate({ to: "/menu/items", search: (prev: Record<string, unknown>) => ({ ...prev }) });

  const onDuplicate = async () => {
    const ok = await confirm({
      title: t("menu.studio.duplicateTitle", "Duplicate this item?"),
      description: t(
        "menu.studio.duplicateDesc",
        "Creates a new item with the same sizes, recipes, modifiers, options and overrides. The copy has no order history.",
      ),
      confirmLabel: t("menu.grid.duplicate", "Duplicate"),
    });
    if (!ok) return;
    try {
      const created = await duplicateItem(itemId);
      const newId = (created as { id?: string }).id;
      toast.success(t("menu.studio.duplicated", "Item duplicated"));
      if (newId) void navigate({ to: "/menu/items/$itemId", params: { itemId: newId }, search: {} });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (studioQ.isLoading) {
    return (
      <Page>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </Page>
    );
  }

  if (studioQ.isError || !studio) {
    return (
      <Page>
        <Button variant="ghost" size="sm" onClick={goBack} className="w-fit">
          <ArrowLeft className="size-4" /> {t("menu.studio.backToItems", "Back to items")}
        </Button>
        <EmptyState icon={Info} title={t("menu.studio.loadError", "Could not load this item")} />
      </Page>
    );
  }

  const name = getTranslatedName({ name: studio.name, name_translations: studio.name_translations }, i18n.language);
  const revalidate = () => invalidateStudio(itemId);

  return (
    <Page>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" onClick={goBack} className="w-fit -ms-2 text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("menu.studio.backToItems", "Back to items")}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
              {studio.image_url ? (
                <img src={studio.image_url} alt="" className="size-full object-cover" />
              ) : (
                <Package className="size-6" />
              )}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                  {name || t("menu.studio.untitled", "Untitled item")}
                </h1>
                <Badge variant={studio.is_active ? "default" : "secondary"} className="gap-1">
                  <BadgeCheck className="size-3.5" />
                  {studio.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground tabular">
                {t("menu.studio.revision", { rev: studio.catalog_revision, defaultValue: "Revision {{rev}}" })}
              </p>
              {studio.used_in_bundles.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground">
                    <Boxes className="me-1 inline size-3.5 -translate-y-px" />
                    {t("menu.studio.usedInBundles", "Used in bundles:")}
                  </span>
                  {studio.used_in_bundles.map((b) => (
                    <Badge key={b.bundle_id} variant="outline" className="font-normal">
                      {b.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void onDuplicate()}>
              <Copy className="size-4" /> {t("menu.grid.duplicate", "Duplicate")}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab} className="gap-6">
        <PageTabsList>
          <PageTabsTrigger value="basics">
            <Info className="size-4" /> {t("menu.studio.tabs.basics", "Basics")}
          </PageTabsTrigger>
          <PageTabsTrigger value="sizes">
            <Ruler className="size-4" /> {t("menu.studio.tabs.sizes", "Sizes & pricing")}
          </PageTabsTrigger>
          <PageTabsTrigger value="recipe">
            <BookOpen className="size-4" /> {t("menu.studio.tabs.recipe", "Recipe & cost")}
          </PageTabsTrigger>
          <PageTabsTrigger value="modifiers">
            <Layers className="size-4" /> {t("menu.studio.tabs.modifiers", "Modifiers")}
          </PageTabsTrigger>
          <PageTabsTrigger value="options">
            <Package className="size-4" /> {t("menu.studio.tabs.options", "Options")}
          </PageTabsTrigger>
          <PageTabsTrigger value="availability">
            <Store className="size-4" /> {t("menu.studio.tabs.availability", "Availability")}
          </PageTabsTrigger>
        </PageTabsList>

        <TabsContent value="basics">
          <BasicsTab studio={studio} itemId={itemId} orgId={orgId} onSaved={revalidate} />
        </TabsContent>
        <TabsContent value="sizes">
          <SizesTab studio={studio} itemId={itemId} onSaved={revalidate} />
        </TabsContent>
        <TabsContent value="recipe">
          <RecipeTab studio={studio} itemId={itemId} orgId={orgId} onSaved={revalidate} />
        </TabsContent>
        <TabsContent value="modifiers">
          <ModifiersTab studio={studio} itemId={itemId} orgId={orgId} onSaved={revalidate} />
        </TabsContent>
        <TabsContent value="options">
          <OptionsTab studio={studio} itemId={itemId} orgId={orgId} onSaved={revalidate} />
        </TabsContent>
        <TabsContent value="availability">
          <AvailabilityTab studio={studio} itemId={itemId} orgId={orgId} onSaved={revalidate} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
