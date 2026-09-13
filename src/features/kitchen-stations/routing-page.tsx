import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search, Store } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SegmentedControl } from "@/components/app/segmented-control";
import { ExportButton } from "@/components/app/export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteCategoryRoute, deleteItemRoute, listMenuCatalog, putCategoryRoute, putItemRoute,
  useListCategories, useListMenuCatalog, useListRoutes, useListStations,
} from "@/data/api/generated/api";
import type { MenuItemWithCosts } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { useScope } from "@/data/scope/use-scope";
import { useExportLogo } from "@/hooks/use-export-logo";
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

  const [tab, setTab] = useState<"categories" | "items">("categories");
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();
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

  // Routing is one configuration read two ways, so the file carries both: the
  // category assignments and every item, with what it inherits and what
  // overrides it. The item catalog is paged fifty at a time behind a search
  // box, so it is walked to the end under the SAME search — a routing sheet
  // that stopped at the first page would read as "these items have no station".
  const handleExport = async () => {
    if (!branchId || !orgId) return;
    setExporting(true);
    try {
      const allItems = await fetchAllPages<MenuItemWithCosts>(async (offset, limit) => {
        const res = await listMenuCatalog(
          { org_id: orgId, search: itemsSearchQ || undefined, page: Math.floor(offset / limit) + 1, per_page: limit },
          EXPORT_REQUEST,
        );
        return { rows: res.data, total: res.total };
      });

      const unassigned = t("kitchen.unassigned", "Default / unassigned");
      const catCols: ExcelColumn<(typeof categories)[number]>[] = [
        { header: t("kitchen.category", "Category"), accessor: (c) => getTranslatedName(c, lang), type: "text", width: 30 },
        { header: t("kitchen.station", "Station"), accessor: (c) => stationName(routeByCat.get(c.id)) ?? unassigned, type: "text", width: 26 },
      ];
      const itemCols: ExcelColumn<MenuItemWithCosts>[] = [
        { header: t("kitchen.item", "Item"), accessor: (it) => getTranslatedName(it, lang), type: "text", width: 32 },
        {
          header: t("kitchen.inheritedStation", "Inherited station"),
          accessor: (it) => stationName(it.category_id ? routeByCat.get(it.category_id) : undefined) ?? "—",
          type: "text",
          width: 24,
        },
        {
          header: t("kitchen.overrideStation", "Override"),
          accessor: (it) => stationName(routeByItem.get(it.id)) ?? "—",
          type: "text",
          width: 24,
        },
        {
          header: t("kitchen.routedTo", "Routed to"),
          accessor: (it) =>
            stationName(routeByItem.get(it.id))
            ?? stationName(it.category_id ? routeByCat.get(it.category_id) : undefined)
            ?? unassigned,
          type: "text",
          width: 26,
        },
      ];

      const title = t("kitchen.routingTitle", "Order routing");
      await exportToExcel({
        filename: "Madar-Order-Routing",
        logoUrl,
        sheets: [
          {
            name: t("kitchen.byCategory", "By category"),
            title,
            subtitle: t("kitchen.byCategory", "By category"),
            rows: categories as unknown as Record<string, unknown>[],
            columns: catCols as unknown as ExcelColumn<Record<string, unknown>>[],
          },
          {
            name: t("kitchen.byItem", "Per item"),
            title,
            subtitle: itemsSearchQ || t("kitchen.byItem", "Per item"),
            rows: allItems as unknown as Record<string, unknown>[],
            columns: itemCols as unknown as ExcelColumn<Record<string, unknown>>[],
          },
        ],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const setupReady = !!branchId && stations.length > 0;
  const setupError = stationsQ.error ?? categoriesQ.error ?? routesQ.error;
  const retrySetup = () => { void stationsQ.refetch(); void categoriesQ.refetch(); void routesQ.refetch(); };
  const setupLoading = stationsQ.isLoading || routesQ.isLoading;

  const stationSelect = (value: string, onChange: (v: string) => void, inheritLabel: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 sm:w-52"><SelectValue placeholder={inheritLabel} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>{inheritLabel}</SelectItem>
        {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const rowSkeletons = (
    <ListCard>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-40 sm:w-52" />
        </div>
      ))}
    </ListCard>
  );

  return (
    <Page>
      <PageHeader
        title={t("kitchen.routingTitle", "Order routing")}
        subtitle={t("kitchen.routingSubtitle", "Send each menu category to a kitchen station. Items inherit their category unless overridden.")}
        actions={setupReady ? <ExportButton onExport={handleExport} loading={exporting} /> : null}
        below={setupReady ? (
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: "categories", label: t("kitchen.byCategory", "By category") },
                { value: "items", label: t("kitchen.byItem", "Per item") },
              ]}
            />
            {tab === "items" ? (
              <div className="relative w-full sm:w-64">
                <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={itemsSearch} onChange={(e) => setItemsSearch(e.target.value)} placeholder={t("common.search", "Search…")} aria-label={t("common.search", "Search…")} className="h-9 ps-8" />
              </div>
            ) : null}
          </div>
        ) : null}
      />
      {!branchId ? (
        <EmptyState icon={Store} title={t("kitchen.pickBranch", "Select a branch in the top bar to manage its kitchen")} />
      ) : setupError ? (
        <ErrorState title={t("kitchen.routingLoadFailed", "Couldn't load kitchen routing")} message={getErrorMessage(setupError)} onRetry={retrySetup} />
      ) : setupLoading ? (
        rowSkeletons
      ) : stations.length === 0 ? (
        <EmptyState icon={Store} title={t("kitchen.noStationsForRouting", "Create a station first")} description={t("kitchen.noStationsForRoutingHint", "Add kitchen stations on the Stations tab, then route categories to them.")} />
      ) : tab === "categories" ? (
        categoriesQ.isLoading ? rowSkeletons : categories.length === 0 ? (
          <EmptyState title={t("kitchen.noCategories", "No categories to route yet.")} />
        ) : (
          <ListCard>
            {categories.map((c) => (
              <ListRow
                key={c.id}
                title={getTranslatedName(c, lang)}
                trailing={stationSelect(routeByCat.get(c.id) ?? UNASSIGNED, (v) => void setCategoryRoute(c.id, v), t("kitchen.unassigned", "Default / unassigned"))}
              />
            ))}
          </ListCard>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("kitchen.byItemHint", "Override a single item's station. Left on “Inherit”, it follows its category.")}</p>
          {catalog.error ? (
            <ErrorState title={t("kitchen.itemsLoadFailed", "Couldn't load menu items")} message={getErrorMessage(catalog.error)} onRetry={() => void catalog.refetch()} />
          ) : catalog.isLoading ? rowSkeletons : items.length === 0 ? (
            <EmptyState icon={Search} title={t("kitchen.noItems", "No items match")} />
          ) : (
            <ListCard>
              {items.map((it) => {
                const inherited = stationName(it.category_id ? routeByCat.get(it.category_id) : undefined);
                const override = routeByItem.get(it.id);
                return (
                  <ListRow
                    key={it.id}
                    title={getTranslatedName(it, lang)}
                    meta={override ? t("kitchen.overridden", "Overridden") : inherited
                      ? t("kitchen.inheritsStation", { station: inherited, defaultValue: `Inherits ${inherited}` })
                      : t("kitchen.noInheritedStation", "No category station")}
                    trailing={stationSelect(override ?? UNASSIGNED, (v) => void setItemRoute(it.id, v), t("kitchen.inheritCategory", "Inherit (category)"))}
                  />
                );
              })}
            </ListCard>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground tabular-nums">{t("common.page", { current: itemsPage + 1, total: pageCount, defaultValue: `Page ${itemsPage + 1} of ${pageCount}` })}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" disabled={itemsPage === 0} onClick={() => setItemsPage(itemsPage - 1)} aria-label={t("common.previous", "Previous")}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
                <Button variant="outline" size="icon-sm" disabled={itemsPage >= pageCount - 1} onClick={() => setItemsPage(itemsPage + 1)} aria-label={t("common.next", "Next")}><ChevronRight className="size-4 rtl:rotate-180" /></Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Page>
  );
}
