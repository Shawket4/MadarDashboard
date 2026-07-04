import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Copy, CupSoda, Pencil, Percent, Store, Tag, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { EditableCardGrid, type EditableField } from "@/components/app/editable-cards";
import { AddonCostCell, ItemCostCell } from "@/components/app/cost-cells";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryDialog } from "./category-dialog";
import { AddonDialog } from "./addon-dialog";
import { AddonRecipeDialog } from "./addon-recipe-dialog";
import { MenuItemDialog } from "./menu-item-dialog";
import { BranchAddonAvailabilitySwitch, BranchMenuItemAvailabilitySwitch } from "./branch-availability-switch";
import { invalidateCatalog } from "./util";
import { useAddonCostMap } from "./costing";
import {
  createMenuItem,
  duplicateItem,
  getGetMenuItemQueryOptions,
  getGetStudioQueryOptions,
  getListAddonCostsQueryOptions,
  getListAddonItemsQueryOptions,
  getListMenuCatalogQueryOptions,
  listMenuItems,
  patchOption,
  updateCategory,
  updateMenuItem,
  useDeleteCategory,
  useDeleteMenuItem,
  useDeleteOption,
  useListAddonItems,
  useListBranchAddonOverrides,
  useListBranchMenuOverrides,
  useListCategories,
  useListMenuCatalog,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  BranchAddonOverride,
  BranchMenuOverride,
  Category,
  MenuItem,
  MenuItemWithCosts,
  PatchOptionRequest,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { runBulk } from "@/lib/bulk-runner";
import { useDebounced } from "@/lib/use-debounced";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";

const ALL = "__all__";
const ITEMS_PER_PAGE = 24;

export function MenuItemsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const confirm = useConfirm();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const enabled = !!orgId;
  // When a single branch is scoped (top bar), each card gets an inline
  // "Available at this branch" toggle. No branch selected → org catalog only.
  const { branchId: scopedBranchId } = useScope();

  const [tab, setTab] = useState("items");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [addonType, setAddonType] = useState(ALL);
  const [itemsPage, setItemsPage] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const itemsSearchQ = useDebounced(itemsSearch, 300);

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [addonOpen, setAddonOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonItem | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeAddon, setRecipeAddon] = useState<AddonItem | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [bulkRows, setBulkRows] = useState<MenuItem[] | null>(null);

  // Reset to first page when filters change.
  useEffect(() => {
    setItemsPage(0);
  }, [categoryFilter, itemsSearchQ]);

  const queryClient = useQueryClient();
  const addonsActive = tab === "addons";

  const itemsParams = useMemo(
    () => ({
      org_id: orgId ?? "",
      category_id: categoryFilter === ALL ? undefined : categoryFilter,
      search: itemsSearchQ || undefined,
      page: itemsPage + 1,
      per_page: ITEMS_PER_PAGE,
    }),
    [orgId, categoryFilter, itemsSearchQ, itemsPage],
  );

  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled } });
  // Add-on list loads on mount (cheap — powers the tab count badge); the heavier
  // add-on cost rollup is deferred to the Add-ons tab (prefetched on hover).
  const addons = useListAddonItems({ org_id: orgId ?? "" }, { query: { enabled } });
  const items = useListMenuCatalog(itemsParams, { query: { enabled, placeholderData: keepPreviousData } });
  const addonCostMap = useAddonCostMap(orgId, addonsActive);

  // Branch availability overrides (only when a single branch is scoped). These
  // power the inline per-branch toggle on item/add-on cards.
  const scopedOn = enabled && !!scopedBranchId;
  const menuOverrides = useListBranchMenuOverrides({ branch_id: scopedBranchId ?? "" }, { query: { enabled: scopedOn } });
  const addonOverrides = useListBranchAddonOverrides({ branch_id: scopedBranchId ?? "" }, { query: { enabled: scopedOn } });
  const ovrByItem = useMemo(() => {
    const m = new Map<string, BranchMenuOverride>();
    for (const o of menuOverrides.data ?? []) m.set(o.menu_item_id, o);
    return m;
  }, [menuOverrides.data]);
  const ovrByAddon = useMemo(() => {
    const m = new Map<string, BranchAddonOverride>();
    for (const o of addonOverrides.data ?? []) m.set(o.addon_item_id, o);
    return m;
  }, [addonOverrides.data]);

  // Predictive prefetch: warm a query before the user commits to the action.
  const prefetchItem = (id: string) => {
    void queryClient.prefetchQuery(getGetMenuItemQueryOptions(id));
    void queryClient.prefetchQuery(getGetStudioQueryOptions(id));
  };
  const openStudio = (id: string) => void navigate({ to: "/menu/items/$itemId", params: { itemId: id }, search: {} });
  const prefetchNextItemsPage = () => {
    if (itemsPage + 1 >= itemsPageCount) return;
    void queryClient.prefetchQuery(getListMenuCatalogQueryOptions({ ...itemsParams, page: itemsPage + 2 }));
  };
  const prefetchAddons = () => {
    if (!orgId) return;
    void queryClient.prefetchQuery(getListAddonItemsQueryOptions({ org_id: orgId }));
    void queryClient.prefetchQuery(getListAddonCostsQueryOptions({ org_id: orgId }));
  };

  const catList = useMemo(() => categories.data ?? [], [categories.data]);
  const itemList: MenuItemWithCosts[] = items.data?.data ?? [];
  const itemsTotal = items.data?.total ?? 0;
  const itemsPageCount = items.data?.total_pages ?? 0;
  const addonList = useMemo(() => addons.data ?? [], [addons.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, lang);
  const catName = (id?: string | null) => {
    const c = catList.find((x) => x.id === id);
    return c ? tname(c) : "—";
  };

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const onDeleted = () => {
    toast.success(t("common.savedChanges", "Changes saved"));
    void invalidateCatalog();
  };
  const delItem = useDeleteMenuItem({ mutation: { onSuccess: onDeleted, onError: onErr } });
  // Add-ons are modifier OPTIONS post-unification (same stable ids) — deletes go
  // through the options endpoint (soft-deactivates when order-referenced).
  const delAddon = useDeleteOption({ mutation: { onSuccess: onDeleted, onError: onErr } });
  const delCategory = useDeleteCategory({ mutation: { onSuccess: onDeleted, onError: onErr } });

  const commitOk = () => {
    void invalidateCatalog();
    toast.success(t("common.savedChanges", "Changes saved"));
  };
  const commitItem = async (m: MenuItem, patch: Record<string, unknown>) => {
    try {
      await updateMenuItem(m.id, patch as UpdateMenuItemRequest);
      commitOk();
    } catch (e) {
      onErr(e);
    }
  };
  const commitAddon = async (a: AddonItem, patch: Record<string, unknown>) => {
    try {
      // Unified model: an add-on IS a modifier option (stable id). Map the
      // legacy field names onto the option patch; `addon_type` is the option's
      // GROUP and is not inline-editable (moving groups = the edit dialog).
      const p: PatchOptionRequest = {};
      if ("default_price" in patch) p.price = patch.default_price as number;
      if ("is_active" in patch) p.is_active = patch.is_active as boolean;
      if ("name" in patch) p.name = patch.name as string;
      await patchOption(a.id, p);
      commitOk();
    } catch (e) {
      onErr(e);
    }
  };
  const commitCategory = async (c: Category, patch: Record<string, unknown>) => {
    try {
      await updateCategory(c.id, patch as UpdateCategoryRequest);
      commitOk();
    } catch (e) {
      onErr(e);
    }
  };

  const duplicate = async (item: MenuItem) => {
    try {
      // Studio deep-copy (server-side): sizes + recipes + modifier attachments +
      // options + overrides in one call — the old client-side loop silently
      // dropped slots/optionals/allowlist. The copy starts inactive, as before.
      const created = await duplicateItem(item.id);
      await updateMenuItem(created.id, { is_active: false });
      void invalidateCatalog();
      toast.success(t("menu.grid.duplicated", { name: item.name, defaultValue: "Item duplicated" }));
    } catch (e) {
      onErr(e);
    }
  };

  const createFromPaste = async (rows: Record<string, string>[]) => {
    const byName = new Map(catList.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const { ok, failed } = await runBulk(rows, (row) => {
      const categoryId = byName.get((row.category ?? "").trim().toLowerCase());
      if (!categoryId) return Promise.reject(new Error(row.category ?? ""));
      return createMenuItem({ org_id: orgId ?? "", name: row.name, base_price: Math.round(parseFloat(row.base_price) * 100), category_id: categoryId, description: row.description || null });
    });
    void invalidateCatalog();
    if (failed.length > 0) {
      toast.error(t("menu.grid.bulkCreateFailed", { ok: ok.length, failed: failed.length, defaultValue: "Some rows failed" }), {
        action: { label: t("menu.grid.retryFailed", "Retry failed"), onClick: () => void createFromPaste(failed.map((f) => f.row)) },
      });
    } else {
      toast.success(t("menu.grid.bulkCreated", { count: ok.length, defaultValue: `${ok.length} created` }));
    }
  };

  // Field configs
  const itemTitle: EditableField<MenuItemWithCosts> = { key: "name", label: t("common.name", "Name"), type: "text", getValue: (m) => m.name, renderDisplay: (m) => <span className="font-semibold">{tname(m)}</span> };
  const itemFields: EditableField<MenuItemWithCosts>[] = useMemo(
    () => [
      { key: "base_price", label: t("common.price", "Price"), type: "money", getValue: (m) => m.base_price },
      { key: "category_id", label: t("common.category", "Category"), type: "select", options: catList.map((c) => ({ value: c.id, label: tname(c) })), getValue: (m) => m.category_id ?? "" },
      { key: "is_active", label: t("common.active", "Active"), type: "boolean", getValue: (m) => m.is_active },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catList, lang, t],
  );
  const addonTitle: EditableField<AddonItem> = { key: "name", label: t("common.name", "Name"), type: "text", getValue: (a) => a.name, renderDisplay: (a) => <span className="font-semibold">{tname(a)}</span> };
  const addonFields: EditableField<AddonItem>[] = [
    { key: "addon_type", label: t("menu.addonType", "Type"), type: "text", getValue: (a) => a.addon_type },
    { key: "default_price", label: t("common.price", "Price"), type: "money", getValue: (a) => a.default_price },
    { key: "is_active", label: t("common.active", "Active"), type: "boolean", getValue: (a) => a.is_active },
  ];
  const catTitle: EditableField<Category> = { key: "name", label: t("common.name", "Name"), type: "text", getValue: (c) => c.name, renderDisplay: (c) => <span className="font-semibold">{tname(c)}</span> };
  const catFields: EditableField<Category>[] = [
    { key: "is_active", label: t("common.active", "Active"), type: "boolean", getValue: (c) => c.is_active },
  ];

  const addonTypes = useMemo(() => Array.from(new Set(addonList.map((a) => a.addon_type))).sort(), [addonList]);
  const addonsByType = useMemo(() => (addonType === ALL ? addonList : addonList.filter((a) => a.addon_type === addonType)), [addonList, addonType]);

  const confirmDelete = async (name: string, run: () => void) => {
    if (await confirm({ title: t("common.confirmDelete", { name, defaultValue: `Delete "${name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) run();
  };

  const handleExport = async () => {
    try {
      const allItems = await listMenuItems({ org_id: orgId ?? "" });
      const itemCols: ExcelColumn<MenuItem>[] = [
        { header: t("common.name", "Name"), accessor: (m) => tname(m), type: "text", width: 26 },
        { header: t("common.category", "Category"), accessor: (m) => catName(m.category_id), type: "text", width: 20 },
        { header: t("common.price", "Price"), accessor: (m) => m.base_price, type: "money", width: 14, total: true },
        { header: t("common.status", "Status"), accessor: (m) => (m.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
      ];
      const catCols: ExcelColumn<Category>[] = [
        { header: t("common.name", "Name"), accessor: (c) => tname(c), type: "text", width: 24 },
        { header: t("common.status", "Status"), accessor: (c) => (c.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
      ];
      const addonCols: ExcelColumn<AddonItem>[] = [
        { header: t("common.name", "Name"), accessor: (a) => tname(a), type: "text", width: 24 },
        { header: t("menu.addonType", "Type"), accessor: (a) => a.addon_type, type: "text", width: 16 },
        { header: t("common.price", "Price"), accessor: (a) => a.default_price, type: "money", width: 14, total: true },
        { header: t("common.status", "Status"), accessor: (a) => (a.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
      ];
      await exportToExcel({
        filename: "Madar-Menu",
        sheets: [
          { name: t("nav.items", "Items"), title: t("nav.items", "Items"), rows: allItems as unknown as Record<string, unknown>[], columns: itemCols as unknown as ExcelColumn<Record<string, unknown>>[], totals: true },
          { name: t("menu.categories", "Categories"), title: t("menu.categories", "Categories"), rows: catList as unknown as Record<string, unknown>[], columns: catCols as unknown as ExcelColumn<Record<string, unknown>>[] },
          { name: t("menu.addons", "Add-ons"), title: t("menu.addons", "Add-ons"), rows: addonList as unknown as Record<string, unknown>[], columns: addonCols as unknown as ExcelColumn<Record<string, unknown>>[], totals: true },
        ],
      });
    } catch (e) {
      onErr(e);
    }
  };

  if (!enabled) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("nav.menu", "Menu")}</h1>
        </div>
        <EmptyState icon={Store} title={t("menu.pickOrg", "Select an organization to manage its menu")} />
      </Page>
    );
  }

  const imgTile = (url: string | null | undefined, Icon: typeof CupSoda) => (
    <span className="grid size-11 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <Icon className="size-5" />}
    </span>
  );

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("nav.menu", "Menu")}</h1>
        <p className="text-sm text-muted-foreground">{t("menu.subtitle", "Manage items, add-ons and categories")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <PageTabsList>
          <PageTabsTrigger value="items">{t("nav.items", "Items")} <CountBadge n={itemsTotal} /></PageTabsTrigger>
          <PageTabsTrigger value="addons" onMouseEnter={prefetchAddons} onFocus={prefetchAddons}>{t("menu.addons", "Add-ons")} <CountBadge n={addonList.length} /></PageTabsTrigger>
          <PageTabsTrigger value="categories">{t("menu.categories", "Categories")} <CountBadge n={catList.length} /></PageTabsTrigger>
        </PageTabsList>

        {!scopedBranchId && (tab === "items" || tab === "addons") ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" />
            {t("menu.branchToggleHint", "Select a branch in the top bar to toggle per-branch availability here.")}
          </div>
        ) : null}

        <TabsContent value="items">
          <EditableCardGrid<MenuItemWithCosts>
            rows={itemList}
            getRowId={(m) => m.id}
            titleField={itemTitle}
            fields={itemFields}
            renderImage={(m) => imgTile(m.image_url, CupSoda)}
            footer={(m) => (
              <div className="space-y-2">
                <ItemCostCell skus={m.sku_costs ?? []} />
                {scopedBranchId ? (
                  <BranchMenuItemAvailabilitySwitch branchId={scopedBranchId} menuItemId={m.id} override={ovrByItem.get(m.id)} />
                ) : null}
              </div>
            )}
            onCommitRow={commitItem}
            onRowPrefetch={(m) => prefetchItem(m.id)}
            onPrefetchNext={prefetchNextItemsPage}
            searchValue={itemsSearch}
            onSearchChange={setItemsSearch}
            searchPlaceholder={t("common.search", "Search…")}
            page={itemsPage}
            pageCount={itemsPageCount}
            onPageChange={setItemsPage}
            isLoading={items.isLoading || (items.isFetching && !items.data)}
            onAdd={() => { setEditingItem(null); setItemOpen(true); }}
            addLabel={t("menu.newItem", "New item")}
            onExport={handleExport}
            emptyState={<EmptyState icon={UtensilsCrossed} title={t("menu.noItems", "No items yet")} />}
            toolbar={
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setItemsPage(0); }}>
                <SelectTrigger className="h-9 w-auto min-w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("menu.allCategories", "All categories")}</SelectItem>
                  {catList.map((c) => <SelectItem key={c.id} value={c.id}>{tname(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            }
            bulkActions={(selected, clear) => (
              <Button size="sm" variant="outline" onClick={() => { setBulkRows(selected); clear(); }}>
                <Percent className="size-4" /> {t("menu.grid.bulkPriceAction", "Adjust price")}
              </Button>
            )}
            onPasteRows={createFromPaste}
            pasteColumns={[
              { key: "name", header: t("common.name", "Name") },
              { key: "base_price", header: `${t("common.price", "Price")} (EGP)` },
              { key: "category", header: t("common.category", "Category") },
              { key: "description", header: t("common.description", "Description") },
            ]}
            pasteValidate={(row) => {
              if (!row.name?.trim()) return t("menu.grid.nameRequired", "Name is required");
              const p = parseFloat(row.base_price);
              if (!Number.isFinite(p) || p < 0) return t("menu.grid.priceInvalid", "Invalid price");
              if (!catList.some((c) => c.name.trim().toLowerCase() === (row.category ?? "").trim().toLowerCase())) return t("menu.grid.categoryUnknown", "Unknown category");
              return null;
            }}
            actions={(m) => (
              <>
                <DropdownMenuItem onClick={() => openStudio(m.id)} onMouseEnter={() => prefetchItem(m.id)}>
                  <Pencil className="size-4" /> {t("menu.grid.fullEditor", "Full editor")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void duplicate(m)}>
                  <Copy className="size-4" /> {t("menu.grid.duplicate", "Duplicate")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => confirmDelete(m.name, () => delItem.mutate({ id: m.id }))}>
                  <Trash2 className="size-4" /> {t("common.delete", "Delete")}
                </DropdownMenuItem>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="addons">
          <EditableCardGrid<AddonItem>
            rows={addonsByType}
            getRowId={(a) => a.id}
            titleField={addonTitle}
            fields={addonFields}
            renderImage={() => imgTile(null, Tag)}
            footer={(a) => (
              <div className="space-y-2">
                <AddonCostCell cost={addonCostMap.get(a.id)} />
                {scopedBranchId ? (
                  <BranchAddonAvailabilitySwitch branchId={scopedBranchId} addonId={a.id} override={ovrByAddon.get(a.id)} />
                ) : null}
              </div>
            )}
            onCommitRow={commitAddon}
            searchText={(a) => `${a.name} ${a.addon_type}`}
            isLoading={addons.isLoading}
            onAdd={() => { setEditingAddon(null); setAddonOpen(true); }}
            addLabel={t("menu.newAddon", "New add-on")}
            emptyState={<EmptyState icon={Tag} title={t("menu.noAddons", "No add-ons yet")} />}
            toolbar={
              addonTypes.length > 0 ? (
                <Select value={addonType} onValueChange={setAddonType}>
                  <SelectTrigger className="h-9 w-auto min-w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("menu.allTypes", "All types")}</SelectItem>
                    {addonTypes.map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : null
            }
            actions={(a) => (
              <>
                <DropdownMenuItem onClick={() => { setEditingAddon(a); setAddonOpen(true); }}>
                  <Pencil className="size-4" /> {t("common.edit", "Edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setRecipeAddon(a); setRecipeOpen(true); }}>
                  <ChefHat className="size-4" /> {t("menu.addonRecipe.edit", "Edit recipe")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => confirmDelete(a.name, () => delAddon.mutate({ oid: a.id }))}>
                  <Trash2 className="size-4" /> {t("common.delete", "Delete")}
                </DropdownMenuItem>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="categories">
          <EditableCardGrid<Category>
            rows={catList}
            getRowId={(c) => c.id}
            titleField={catTitle}
            fields={catFields}
            renderImage={(c) => imgTile(c.image_url, Tag)}
            onCommitRow={commitCategory}
            searchText={(c) => `${c.name} ${tname(c)}`}
            isLoading={categories.isLoading}
            onAdd={() => { setEditingCategory(null); setCategoryOpen(true); }}
            addLabel={t("menu.newCategory", "New category")}
            emptyState={<EmptyState icon={Tag} title={t("menu.noCategories", "No categories yet")} />}
            actions={(c) => (
              <>
                <DropdownMenuItem onClick={() => { setEditingCategory(c); setCategoryOpen(true); }}>
                  <Pencil className="size-4" /> {t("common.edit", "Edit")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => confirmDelete(c.name, () => delCategory.mutate({ id: c.id }))}>
                  <Trash2 className="size-4" /> {t("common.delete", "Delete")}
                </DropdownMenuItem>
              </>
            )}
          />
        </TabsContent>
      </Tabs>

      <MenuItemDialog orgId={orgId} categories={catList} item={editingItem} defaultCategoryId={categoryFilter !== ALL ? categoryFilter : null} open={itemOpen} onOpenChange={setItemOpen} />
      <AddonDialog orgId={orgId} addon={editingAddon} open={addonOpen} onOpenChange={setAddonOpen} />
      <AddonRecipeDialog orgId={orgId ?? ""} addon={recipeAddon} open={recipeOpen} onOpenChange={setRecipeOpen} />
      <CategoryDialog orgId={orgId} category={editingCategory} open={categoryOpen} onOpenChange={setCategoryOpen} />
      <BulkPriceDialog open={!!bulkRows} rows={bulkRows ?? []} onClose={() => setBulkRows(null)} onDone={() => void invalidateCatalog()} />
    </Page>
  );
}

function CountBadge({ n }: { n: number }) {
  return <span className="ms-1 text-xs tabular text-muted-foreground/70">{n}</span>;
}

function BulkPriceDialog({ open, rows, onClose, onDone }: { open: boolean; rows: MenuItem[]; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"add" | "multiply">("add");
  const [value, setValue] = useState("");
  const [running, setRunning] = useState(false);

  const apply = async () => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return;
    setRunning(true);
    try {
      const { failed } = await runBulk(rows, (item) => {
        const next = mode === "add" ? item.base_price + Math.round(n * 100) : Math.round(item.base_price * (n / 100));
        return updateMenuItem(item.id, { base_price: Math.max(0, next) });
      });
      if (failed.length > 0) toast.error(t("menu.grid.bulkSummaryFailed", { ok: rows.length - failed.length, failed: failed.length, defaultValue: "Some updates failed" }));
      else toast.success(t("menu.grid.bulkSummary", { count: rows.length, defaultValue: `${rows.length} updated` }));
      onDone();
      onClose();
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("menu.grid.bulkPrice", { count: rows.length, defaultValue: `Adjust price · ${rows.length}` })}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as "add" | "multiply")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="add">{t("menu.grid.addEgp", "Add EGP")}</SelectItem>
              <SelectItem value="multiply">{t("menu.grid.multiplyPct", "Multiply %")}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" step="any" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "add" ? "5" : "110"} />
        </div>
        <p className="text-xs text-muted-foreground">{mode === "add" ? t("menu.grid.addEgpHint", "Adds the amount to each selected item.") : t("menu.grid.multiplyPctHint", "Scales each price by the percentage (110 = +10%).")}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel", "Cancel")}</Button>
          <Button type="button" loading={running} onClick={apply}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
