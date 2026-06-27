import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, Store } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  deleteCategoryRoute, deleteItemRoute, putCategoryRoute, putItemRoute,
  useListCategories, useListMenuCatalog, useListRoutes, useListStations,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { invalidateRouting } from "./util";

const UNASSIGNED = "__none__";
const PER_PAGE = 50;

export function RoutingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const scope = useScope();
  const branchId = scope.branchId;
  const orgId = useOrgId();

  const [tab, setTab] = useState("categories");
  const [itemsSearch, setItemsSearch] = useState("");
  const [itemsPage, setItemsPage] = useState(0);
  const itemsSearchQ = useDebounced(itemsSearch, 300);
  useEffect(() => { setItemsPage(0); }, [itemsSearchQ, branchId]);

  const enabled = !!branchId;
  const stationsQ = useListStations({ branch_id: branchId ?? "" }, { query: { enabled } });
  const categoriesQ = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: enabled && !!orgId } });
  const routesQ = useListRoutes({ branch_id: branchId ?? "" }, { query: { enabled } });

  const stations = useMemo(() => (stationsQ.data ?? []).filter((s) => s.is_active), [stationsQ.data]);
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const routeByCat = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of routesQ.data?.categories ?? []) m.set(r.category_id, r.station_id);
    return m;
  }, [routesQ.data]);
  const routeByItem = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of routesQ.data?.items ?? []) m.set(r.menu_item_id, r.station_id);
    return m;
  }, [routesQ.data]);
  const stationName = (id: string | undefined) => stations.find((s) => s.id === id)?.name;

  const catalogParams = useMemo(
    () => ({ org_id: orgId ?? "", search: itemsSearchQ || undefined, page: itemsPage + 1, per_page: PER_PAGE }),
    [orgId, itemsSearchQ, itemsPage],
  );
  const catalog = useListMenuCatalog(catalogParams, {
    query: { enabled: enabled && !!orgId && tab === "items", placeholderData: keepPreviousData },
  });
  const items = catalog.data?.data ?? [];
  const pageCount = catalog.data?.total_pages ?? 0;

  const setCategoryRoute = async (categoryId: string, value: string) => {
    if (!branchId) return;
    try {
      if (value === UNASSIGNED) await deleteCategoryRoute({ branch_id: branchId, category_id: categoryId });
      else await putCategoryRoute({ branch_id: branchId, category_id: categoryId, station_id: value });
      void invalidateRouting();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const setItemRoute = async (menuItemId: string, value: string) => {
    if (!branchId) return;
    try {
      if (value === UNASSIGNED) await deleteItemRoute({ branch_id: branchId, menu_item_id: menuItemId });
      else await putItemRoute({ branch_id: branchId, menu_item_id: menuItemId, station_id: value });
      void invalidateRouting();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("kitchen.routingTitle", "Order routing")}</h1>
        <p className="text-sm text-muted-foreground">{t("kitchen.routingSubtitle", "Send each menu category to a kitchen station. Items inherit their category unless overridden.")}</p>
      </div>
      {!branchId ? (
        <EmptyState icon={Store} title={t("kitchen.pickBranch", "Select a branch in the top bar to manage its kitchen")} />
      ) : stations.length === 0 ? (
        <EmptyState icon={Store} title={t("kitchen.noStationsForRouting", "Create a station first")} description={t("kitchen.noStationsForRoutingHint", "Add kitchen stations on the Stations tab, then route categories to them.")} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <PageTabsList>
            <PageTabsTrigger value="categories">{t("kitchen.byCategory", "By category")}</PageTabsTrigger>
            <PageTabsTrigger value="items">{t("kitchen.byItem", "Per item")}</PageTabsTrigger>
          </PageTabsList>

          {/* ── Category routing ─────────────────────────────────────────── */}
          <TabsContent value="categories" className="space-y-4">
            <div className="divide-y rounded-lg border">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3">
                  <span className="truncate text-sm font-medium">{getTranslatedName(c, lang)}</span>
                  <Select value={routeByCat.get(c.id) ?? UNASSIGNED} onValueChange={(v) => void setCategoryRoute(c.id, v)}>
                    <SelectTrigger className="w-52"><SelectValue placeholder={t("kitchen.unassigned", "Unassigned")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>{t("kitchen.unassigned", "Default / unassigned")}</SelectItem>
                      {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {categories.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">{t("kitchen.noCategories", "No categories to route yet.")}</div> : null}
            </div>
          </TabsContent>

          {/* ── Per-item override ────────────────────────────────────────── */}
          <TabsContent value="items" className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("kitchen.byItemHint", "Override a single item's station. Left on “Inherit”, it follows its category.")}</p>
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={itemsSearch} onChange={(e) => setItemsSearch(e.target.value)} placeholder={t("common.search", "Search…")} aria-label={t("common.search", "Search…")} className="h-9 ps-8" />
            </div>

            {catalog.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : items.length === 0 ? (
              <EmptyState icon={Search} title={t("kitchen.noItems", "No items match")} />
            ) : (
              <div className="divide-y rounded-lg border">
                {items.map((it) => {
                  const inherited = stationName(it.category_id ? routeByCat.get(it.category_id) : undefined);
                  const override = routeByItem.get(it.id);
                  return (
                    <div key={it.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{getTranslatedName(it, lang)}</p>
                        <p className="text-xs text-muted-foreground">
                          {override ? t("kitchen.overridden", "Overridden") : inherited
                            ? t("kitchen.inheritsStation", { station: inherited, defaultValue: `Inherits ${inherited}` })
                            : t("kitchen.noInheritedStation", "No category station")}
                        </p>
                      </div>
                      <Select value={override ?? UNASSIGNED} onValueChange={(v) => void setItemRoute(it.id, v)}>
                        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>{t("kitchen.inheritCategory", "Inherit (category)")}</SelectItem>
                          {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            {pageCount > 1 ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground tabular">{t("common.page", { current: itemsPage + 1, total: pageCount, defaultValue: `Page ${itemsPage + 1} of ${pageCount}` })}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon-sm" disabled={itemsPage === 0} onClick={() => setItemsPage(itemsPage - 1)} aria-label={t("common.previous", "Previous")}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
                  <Button variant="outline" size="icon-sm" disabled={itemsPage >= pageCount - 1} onClick={() => setItemsPage(itemsPage + 1)} aria-label={t("common.next", "Next")}><ChevronRight className="size-4 rtl:rotate-180" /></Button>
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
