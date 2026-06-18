import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { CupSoda, SlidersHorizontal, Store, Tag, UtensilsCrossed } from "lucide-react";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { EditableCardGrid } from "@/components/app/editable-cards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BranchOverrideDialog } from "./branch-override-dialog";
import { BranchAddonOverrideDialog } from "./branch-addon-override-dialog";
import {
  getGetMenuItemQueryOptions,
  getListAddonCatalogQueryOptions,
  getListMenuCatalogQueryOptions,
  useListAddonCatalog,
  useListBranchAddonOverrides,
  useListBranchMenuOverrides,
  useListCategories,
  useListMenuCatalog,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  BranchAddonOverride,
  BranchMenuOverride,
  MenuItemWithCosts,
} from "@/data/api/generated/models";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney } from "@/lib/format";

const ALL = "__all__";
const PER_PAGE = 24;

function CountBadge({ n }: { n: number }) {
  return <span className="ms-1 text-xs tabular text-muted-foreground/70">{n}</span>;
}

/**
 * Per-branch overrides for the scoped branch, with Menu items / Add-on items
 * sub-tabs. Both lists are SERVER-driven: search, an "overridden only" filter,
 * an overridden-first sort, and pagination are query params — no client load-all.
 * The badge shows how many items/add-ons are overridden at this branch.
 */
export function BranchOverridesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId();
  const scope = useScope();
  const queryClient = useQueryClient();
  const enabled = !!orgId;
  const branchId = scope.branchId;
  const on = enabled && !!branchId;

  const [tab, setTab] = useState("menu");
  // Shared filter + sort (applies to whichever sub-tab is active).
  const [show, setShow] = useState<"all" | "overridden">("all");
  const [sort, setSort] = useState<"overridden" | "name">("overridden");
  const [categoryFilter, setCategoryFilter] = useState(ALL);

  const [itemsPage, setItemsPage] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const itemsSearchQ = useDebounced(itemsSearch, 300);
  const [addonsPage, setAddonsPage] = useState(0);
  const [addonsSearch, setAddonsSearch] = useState("");
  const addonsSearchQ = useDebounced(addonsSearch, 300);

  const [ovrItem, setOvrItem] = useState<MenuItemWithCosts | null>(null);
  const [ovrOpen, setOvrOpen] = useState(false);
  const [ovrAddon, setOvrAddon] = useState<AddonItem | null>(null);
  const [ovrAddonOpen, setOvrAddonOpen] = useState(false);

  // Reset to first page whenever a filter/sort/search changes.
  useEffect(() => { setItemsPage(0); }, [show, sort, categoryFilter, itemsSearchQ]);
  useEffect(() => { setAddonsPage(0); }, [show, sort, addonsSearchQ]);

  const overridden = show === "overridden" ? true : undefined;
  const sortParam = sort === "overridden" ? "overridden" : undefined;

  const itemsParams = useMemo(
    () => ({
      org_id: orgId ?? "",
      branch_id: branchId ?? undefined,
      category_id: categoryFilter === ALL ? undefined : categoryFilter,
      search: itemsSearchQ || undefined,
      overridden,
      sort: sortParam,
      page: itemsPage + 1,
      per_page: PER_PAGE,
    }),
    [orgId, branchId, categoryFilter, itemsSearchQ, overridden, sortParam, itemsPage],
  );
  const addonParams = useMemo(
    () => ({
      org_id: orgId ?? "",
      branch_id: branchId ?? undefined,
      search: addonsSearchQ || undefined,
      overridden,
      sort: sortParam,
      page: addonsPage + 1,
      per_page: PER_PAGE,
    }),
    [orgId, branchId, addonsSearchQ, overridden, sortParam, addonsPage],
  );

  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: on } });
  const items = useListMenuCatalog(itemsParams, { query: { enabled: on, placeholderData: keepPreviousData } });
  const addons = useListAddonCatalog(addonParams, { query: { enabled: on, placeholderData: keepPreviousData } });
  // Full override sets for the footers + the overridden-count badges.
  const overrides = useListBranchMenuOverrides({ branch_id: branchId ?? "" }, { query: { enabled: on } });
  const addonOverrides = useListBranchAddonOverrides({ branch_id: branchId ?? "" }, { query: { enabled: on } });

  const catList = useMemo(() => categories.data ?? [], [categories.data]);
  const itemList: MenuItemWithCosts[] = items.data?.data ?? [];
  const itemsPageCount = items.data?.total_pages ?? 0;
  const addonList: AddonItem[] = addons.data?.data ?? [];
  const addonsPageCount = addons.data?.total_pages ?? 0;
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, lang);

  const ovrByItem = useMemo(() => {
    const m = new Map<string, BranchMenuOverride>();
    for (const o of overrides.data ?? []) m.set(o.menu_item_id, o);
    return m;
  }, [overrides.data]);
  const ovrByAddon = useMemo(() => {
    const m = new Map<string, BranchAddonOverride>();
    for (const o of addonOverrides.data ?? []) m.set(o.addon_item_id, o);
    return m;
  }, [addonOverrides.data]);

  // Optimistic preloading.
  const prefetchItem = (id: string) => void queryClient.prefetchQuery(getGetMenuItemQueryOptions(id));
  const prefetchNextItems = () => {
    if (itemsPage + 1 >= itemsPageCount) return;
    void queryClient.prefetchQuery(getListMenuCatalogQueryOptions({ ...itemsParams, page: itemsPage + 2 }));
  };
  const prefetchNextAddons = () => {
    if (addonsPage + 1 >= addonsPageCount) return;
    void queryClient.prefetchQuery(getListAddonCatalogQueryOptions({ ...addonParams, page: addonsPage + 2 }));
  };

  const imgTile = (url: string | null | undefined, Icon: typeof CupSoda) => (
    <span className="grid size-11 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <Icon className="size-5" />}
    </span>
  );

  const filterSort = (
    <>
      <Select value={show} onValueChange={(v) => setShow(v as "all" | "overridden")}>
        <SelectTrigger className="h-9 w-auto min-w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("menu.overrides.showAll", "All")}</SelectItem>
          <SelectItem value="overridden">{t("menu.overrides.overriddenOnly", "Overridden only")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => setSort(v as "overridden" | "name")}>
        <SelectTrigger className="h-9 w-auto min-w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="overridden">{t("menu.overrides.sortOverridden", "Overridden first")}</SelectItem>
          <SelectItem value="name">{t("menu.overrides.sortName", "Name (A–Z)")}</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  if (!enabled) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("menu.overrides.tab", "Branch overrides")}</h1>
        </div>
        <EmptyState icon={Store} title={t("menu.pickOrg", "Select an organization to manage its menu")} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("menu.overrides.tab", "Branch overrides")}</h1>
        <p className="text-sm text-muted-foreground">{t("menu.overrides.subtitle", "Per-branch price and availability for items and add-ons")}</p>
      </div>

      {!branchId ? (
        <EmptyState icon={Store} title={t("menu.overrides.pickBranch", "Select a branch in the top bar to manage its overrides")} />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <PageTabsList>
            <PageTabsTrigger value="menu">{t("menu.overrides.menuItems", "Menu items")} <CountBadge n={ovrByItem.size} /></PageTabsTrigger>
            <PageTabsTrigger value="addons">{t("menu.overrides.addonItems", "Add-on items")} <CountBadge n={ovrByAddon.size} /></PageTabsTrigger>
          </PageTabsList>

          <TabsContent value="menu">
            <EditableCardGrid<MenuItemWithCosts>
              rows={itemList}
              getRowId={(m) => m.id}
              titleField={{ key: "name", label: t("common.name", "Name"), type: "text", editable: false, getValue: (m) => m.name, renderDisplay: (m) => <span className="font-semibold">{tname(m)}</span> }}
              fields={[]}
              renderImage={(m) => imgTile(m.image_url, CupSoda)}
              onCommitRow={() => {}}
              footer={(m) => {
                const o = ovrByItem.get(m.id);
                return (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{t("menu.overrides.orgPrice", "Org")} {fmtMoney(m.base_price)}</span>
                    {o ? (
                      <span className="flex items-center gap-2">
                        {!o.is_available ? <span className="font-medium text-destructive">{t("menu.overrides.hidden", "Hidden")}</span> : null}
                        {o.price_override != null ? <span className="font-medium">{fmtMoney(o.price_override)}</span> : null}
                        {(o.sizes?.length ?? 0) > 0 ? <span className="text-muted-foreground">{t("menu.overrides.nSizes", { count: o.sizes!.length, defaultValue: `${o.sizes!.length} sizes` })}</span> : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("menu.overrides.inheritsAll", "Inherits org")}</span>
                    )}
                  </div>
                );
              }}
              searchValue={itemsSearch}
              onSearchChange={setItemsSearch}
              searchPlaceholder={t("common.search", "Search…")}
              page={itemsPage}
              pageCount={itemsPageCount}
              onPageChange={setItemsPage}
              onRowPrefetch={(m) => prefetchItem(m.id)}
              onPrefetchNext={prefetchNextItems}
              isLoading={items.isLoading || overrides.isLoading}
              emptyState={<EmptyState icon={UtensilsCrossed} title={t("menu.noItems", "No items yet")} />}
              toolbar={
                <>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-auto min-w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("menu.allCategories", "All categories")}</SelectItem>
                      {catList.map((c) => <SelectItem key={c.id} value={c.id}>{tname(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {filterSort}
                </>
              }
              actions={(m) => (
                <DropdownMenuItem onClick={() => { setOvrItem(m); setOvrOpen(true); }}>
                  <SlidersHorizontal className="size-4" /> {t("menu.overrides.edit", "Edit override")}
                </DropdownMenuItem>
              )}
            />
          </TabsContent>

          <TabsContent value="addons">
            <EditableCardGrid<AddonItem>
              rows={addonList}
              getRowId={(a) => a.id}
              titleField={{ key: "name", label: t("common.name", "Name"), type: "text", editable: false, getValue: (a) => a.name, renderDisplay: (a) => <span className="font-semibold">{tname(a)}</span> }}
              fields={[]}
              renderImage={() => imgTile(null, Tag)}
              onCommitRow={() => {}}
              footer={(a) => {
                const o = ovrByAddon.get(a.id);
                return (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{t("menu.overrides.orgPrice", "Org")} {fmtMoney(a.default_price)}</span>
                    {o ? (
                      <span className="flex items-center gap-2">
                        {!o.is_available ? <span className="font-medium text-destructive">{t("menu.overrides.hidden", "Hidden")}</span> : null}
                        {o.price_override != null ? <span className="font-medium">{fmtMoney(o.price_override)}</span> : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("menu.overrides.inheritsAll", "Inherits org")}</span>
                    )}
                  </div>
                );
              }}
              searchValue={addonsSearch}
              onSearchChange={setAddonsSearch}
              searchPlaceholder={t("common.search", "Search…")}
              page={addonsPage}
              pageCount={addonsPageCount}
              onPageChange={setAddonsPage}
              onPrefetchNext={prefetchNextAddons}
              isLoading={addons.isLoading || addonOverrides.isLoading}
              emptyState={<EmptyState icon={Tag} title={t("menu.noAddons", "No add-ons yet")} />}
              toolbar={filterSort}
              actions={(a) => (
                <DropdownMenuItem onClick={() => { setOvrAddon(a); setOvrAddonOpen(true); }}>
                  <SlidersHorizontal className="size-4" /> {t("menu.overrides.edit", "Edit override")}
                </DropdownMenuItem>
              )}
            />
          </TabsContent>
        </Tabs>
      )}

      {branchId ? (
        <>
          <BranchOverrideDialog
            branchId={branchId}
            itemId={ovrItem?.id ?? null}
            itemName={ovrItem ? tname(ovrItem) : ""}
            override={ovrItem ? ovrByItem.get(ovrItem.id) : undefined}
            open={ovrOpen}
            onOpenChange={setOvrOpen}
          />
          <BranchAddonOverrideDialog
            branchId={branchId}
            addonId={ovrAddon?.id ?? null}
            addonName={ovrAddon ? tname(ovrAddon) : ""}
            orgDefaultPrice={ovrAddon?.default_price ?? 0}
            override={ovrAddon ? ovrByAddon.get(ovrAddon.id) : undefined}
            open={ovrAddonOpen}
            onOpenChange={setOvrAddonOpen}
          />
        </>
      ) : null}
    </Page>
  );
}
