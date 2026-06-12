import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { Coffee, Package, Plus, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { EmptyState } from "@/shared/ui/empty-state";
import { getTranslatedName, getTranslatedDescription } from "@/shared/lib/translation";
import {
  useListCategories, deleteCategory,
  useListMenuItems, updateMenuItem, deleteMenuItem,
  useListAddonItems, updateAddonItem, deleteAddonItem,
  getListCategoriesQueryKey, getListMenuItemsQueryKey, getGetMenuItemQueryKey, getListAddonItemsQueryKey,
} from "@/shared/api/generated/api";
import { CategoryDialog } from "@/features/dialogs/category-dialog";
import { AddonDialog } from "@/features/dialogs/addon-dialog";
import { MenuItemEditor } from "@/features/dialogs/menu-item-editor";
import { useSkuCostsByItem, useAddonCostMap } from "@/entities/costing/queries";
import { ItemCostCell, AddonCostCell } from "@/entities/costing/cost-cells";
import { ItemsGrid } from "./items-grid";
import { RowActions } from "@/shared/ui/row-actions";
import { StatusBadge } from "@/shared/ui/status-badge";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { SkeletonList } from "@/shared/ui/skeleton-list";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney, piastresToEgp } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { AddonItem, Category, MenuItem } from "@/shared/types";

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Menu() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { orgId } = useCurrentContext();
  // /menu/add-ons deep-links straight to the addons tab (C.1 route)
  const [tab, setTab] = useState<"items" | "categories" | "addons">(
    () => (window.location.pathname.endsWith("/add-ons") ? "addons" : "items"),
  );
  const [itemsView, setItemsView] = useState<"grid" | "classic">("grid");

  const [catDlg, setCatDlg] = useState(false);
  const [itemDlg, setItemDlg] = useState(false);
  const [addonDlg, setAddonDlg] = useState(false);

  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editAddon, setEditAddon] = useState<AddonItem | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "cat"; id: string; name: string } | { kind: "item"; id: string; name: string } | { kind: "addon"; id: string; name: string } | null
  >(null);

  const [selCat, setSelCat] = useState<string | "all">("all");
  const [selType, setSelType] = useState<string | "all">("all");

  const { data: categories = [], isLoading: catsLoading } = useListCategories({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: items = [], isLoading: itemsLoading } = useListMenuItems({ org_id: orgId as string, category_id: selCat === "all" ? undefined : selCat }, { query: { enabled: !!orgId } });
  const { data: addons = [], isLoading: addonsLoading } = useListAddonItems({ org_id: orgId as string, addon_type: selType === "all" ? undefined : selType }, { query: { enabled: !!orgId } });

  // A.2: recipe-cost rollups joined per (menu_item_id, size_label)
  const skuCostsByItem = useSkuCostsByItem(orgId);
  const addonCostMap = useAddonCostMap(orgId);

  const toggleItem = useMutation({
    mutationFn: (it: MenuItem) => updateMenuItem(it.id, { is_active: !it.is_active } as any),
    onSuccess: (_, it) => {
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(it.id) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggleAddon = useMutation({
    mutationFn: (a: AddonItem) => updateAddonItem(a.id, { is_active: !a.is_active } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: getListAddonItemsQueryKey() }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (c: NonNullable<typeof confirmDelete>) =>
      c.kind === "cat" ? deleteCategory(c.id) : c.kind === "item" ? deleteMenuItem(c.id) : deleteAddonItem(c.id),
    onSuccess: (_, c) => {
      qc.invalidateQueries({
        queryKey:
          c.kind === "cat" ? getListCategoriesQueryKey()
          : c.kind === "item" ? getListMenuItemsQueryKey()
          : getListAddonItemsQueryKey(),
      });
      toast.success(t("common.delete"));
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const itemCols: ColumnDef<MenuItem>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{getTranslatedName(row.original, i18n.language)}</p>
          {getTranslatedDescription(row.original, i18n.language) && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{getTranslatedDescription(row.original, i18n.language)}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "base_price",
      header: t("common.price"),
      cell: ({ row }) => <span className="font-semibold tabular">{fmtMoney(row.original.base_price)}</span>,
    },
    {
      id: "cost",
      header: t("menu.costMargin"),
      cell: ({ row }) => <ItemCostCell skus={skuCostsByItem.get(row.original.id) ?? []} />,
    },
    {
      accessorKey: "category_id",
      header: t("common.category"),
      cell: ({ row }) => {
        const cat = categories.find((c) => c.id === row.original.category_id);
        return cat ? <Badge variant="outline">{cat.name}</Badge> : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      accessorKey: "is_active",
      header: t("common.active"),
      cell: ({ row }) => (
        <button onClick={(e) => { e.stopPropagation(); toggleItem.mutate(row.original); }}>
          {row.original.is_active ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions onEdit={() => { setEditItem(row.original); setItemDlg(true); }} onDelete={() => setConfirmDelete({ kind: "item", id: row.original.id, name: row.original.name })} />
      ),
    },
  ], [categories, t, toggleItem, skuCostsByItem]);

  const catCols: ColumnDef<Category>[] = useMemo(() => [
    { accessorKey: "name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold">{getTranslatedName(row.original, i18n.language)}</span> },
    { accessorKey: "display_order", header: t("menu.displayOrder") },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions onEdit={() => { setEditCat(row.original); setCatDlg(true); }} onDelete={() => setConfirmDelete({ kind: "cat", id: row.original.id, name: row.original.name })} />
      ),
    },
  ], [t]);

  const addonCols: ColumnDef<AddonItem>[] = useMemo(() => [
    { accessorKey: "name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold">{getTranslatedName(row.original, i18n.language)}</span> },
    {
      accessorKey: "addon_type",
      header: t("common.type"),
      cell: ({ row }) => (
        <Badge variant="info">
          {t(`menu.addonTypes.${row.original.addon_type}`, { defaultValue: row.original.addon_type })}
        </Badge>
      ),
    },
    { accessorKey: "default_price", header: t("common.price"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.default_price)}</span> },
    {
      id: "cost",
      header: t("menu.costMargin"),
      cell: ({ row }) => <AddonCostCell cost={addonCostMap.get(row.original.id)} />,
    },
    {
      accessorKey: "is_active",
      header: t("common.active"),
      cell: ({ row }) => (
        <button onClick={(e) => { e.stopPropagation(); toggleAddon.mutate(row.original); }}>
          {row.original.is_active ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions onEdit={() => { setEditAddon(row.original); setAddonDlg(true); }} onDelete={() => setConfirmDelete({ kind: "addon", id: row.original.id, name: row.original.name })} />
      ),
    },
  ], [t, toggleAddon, addonCostMap]);

  const handleExport = () =>
    exportToExcel({
      filename: "Menu",
      sheets: [
        {
          name: "Items",
          title: t("menu.items"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (m: MenuItem) => getTranslatedName(m, i18n.language), width: 28 },
            { key: "description", header: t("common.description"), accessor: (m: MenuItem) => getTranslatedDescription(m, i18n.language) ?? "—", width: 32 },
            { key: "category", header: t("common.category"), accessor: (m: MenuItem) => categories.find((c) => c.id === m.category_id)?.name ?? t("menu.uncategorised"), width: 20 },
            { key: "price", header: t("common.price"), accessor: (m: MenuItem) => m.base_price, type: "money", width: 14, total: true },
            { key: "is_active", header: t("common.status"), accessor: (m: MenuItem) => m.is_active, type: "bool", width: 12 },
          ],
          rows: items,
          totals: true,
          stats: [
            { label: t("common.total"), value: items.length, type: "number" },
            { label: t("common.active"), value: items.filter((i) => i.is_active).length, type: "number", color: "FF16A34A" },
            { label: "Avg", value: items.length ? piastresToEgp(items.reduce((s, i) => s + i.base_price, 0) / items.length) : 0, type: "money" },
          ],
        },
        {
          name: "Categories",
          title: t("menu.categories"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (c: Category) => getTranslatedName(c, i18n.language), width: 28 },
            { key: "order", header: t("menu.displayOrder"), accessor: (c: Category) => c.display_order, type: "integer", width: 14 },
            { key: "is_active", header: t("common.status"), accessor: (c: Category) => c.is_active, type: "bool", width: 12 },
          ],
          rows: categories,
        },
        {
          name: "Addons",
          title: t("menu.addons"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (a: AddonItem) => getTranslatedName(a, i18n.language), width: 28 },
            { key: "type", header: t("common.type"), accessor: (a: AddonItem) => t(`menu.addonTypes.${a.addon_type}`, { defaultValue: a.addon_type }), width: 18 },
            { key: "price", header: t("common.price"), accessor: (a: AddonItem) => a.default_price, type: "money", width: 14, total: true },
            { key: "order", header: t("menu.displayOrder"), accessor: (a: AddonItem) => a.display_order, type: "integer", width: 14 },
            { key: "is_active", header: t("common.status"), accessor: (a: AddonItem) => a.is_active, type: "bool", width: 12 },
          ],
          rows: addons,
          totals: true,
        },
      ],
    });

  if (!orgId) return <PageShell title={t("menu.title")} description={t("menu.subtitle")}>{null}</PageShell>;

  return (
    <PageShell
      title={t("menu.title")}
      description={t("menu.subtitle")}
      action={
        <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length + categories.length + addons.length === 0}>
          {t("common.export")}
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as "items" | "categories" | "addons")}>
        <TabsList>
          <TabsTrigger value="items"><Coffee size={14} /> {t("menu.itemsCount", { count: items.length })}</TabsTrigger>
          <TabsTrigger value="categories"><Tag size={14} /> {t("menu.categoriesCount", { count: categories.length })}</TabsTrigger>
          <TabsTrigger value="addons"><Package size={14} /> {t("menu.addonsCount", { count: addons.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Select value={selCat} onValueChange={setSelCat}>
              <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("menu.allCategories")}</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* inline grid is the default; the classic table stays available */}
            <SegmentedControl
              value={itemsView}
              onChange={setItemsView}
              options={[
                { value: "grid", label: t("menu.grid.views.grid") },
                { value: "classic", label: t("menu.grid.views.classic") },
              ]}
            />
            {itemsView === "classic" && (
              <Button size="sm" className="ms-auto" onClick={() => { setEditItem(null); setItemDlg(true); }}>
                <Plus /> {t("menu.addItem")}
              </Button>
            )}
          </div>
          {itemsView === "grid" ? (
            <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
              <ItemsGrid
                orgId={orgId}
                items={items}
                categories={categories}
                skuCostsByItem={skuCostsByItem}
                isLoading={itemsLoading}
                onEditFull={(it) => { setEditItem(it); setItemDlg(true); }}
                onDelete={(it) => setConfirmDelete({ kind: "item", id: it.id, name: it.name })}
                onAdd={() => { setEditItem(null); setItemDlg(true); }}
              />
            </div>
          ) : itemsLoading ? (
            <SkeletonList count={5} />
          ) : items.length === 0 ? (
            <EmptyState icon={Coffee} title={t("menu.emptyItems")} />
          ) : (
          <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <DataTable columns={itemCols} data={items} searchKey="name" searchPlaceholder={t("menu.searchItems")} onRowClick={(it) => { setEditItem(it); setItemDlg(true); }} />
          </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="mb-4 flex">
            <Button size="sm" className="ms-auto" onClick={() => { setEditCat(null); setCatDlg(true); }}>
              <Plus /> {t("menu.addCategory")}
            </Button>
          </div>
          {catsLoading ? (
            <SkeletonList count={4} height="h-12" />
          ) : categories.length === 0 ? (
            <EmptyState icon={Tag} title={t("menu.emptyCategories")} />
          ) : (
          <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <DataTable columns={catCols} data={categories} searchKey="name" searchPlaceholder={t("menu.searchCategories")} />
          </div>
          )}
        </TabsContent>

        <TabsContent value="addons">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Select value={selType} onValueChange={setSelType}>
              <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("menu.allTypes")}</SelectItem>
                <SelectItem value="coffee_type">{t("menu.addonTypes.coffee_type")}</SelectItem>
                <SelectItem value="milk_type">{t("menu.addonTypes.milk_type")}</SelectItem>
                <SelectItem value="extra">{t("menu.addonTypes.extra")}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="ms-auto" onClick={() => { setEditAddon(null); setAddonDlg(true); }}>
              <Plus /> {t("menu.addAddon")}
            </Button>
          </div>
          {addonsLoading ? (
            <SkeletonList count={5} height="h-12" />
          ) : addons.length === 0 ? (
            <EmptyState icon={Package} title={t("menu.emptyAddons")} />
          ) : (
          <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <DataTable columns={addonCols} data={addons} searchKey="name" searchPlaceholder={t("menu.searchAddons")} />
          </div>
          )}
        </TabsContent>
      </Tabs>

      <CategoryDialog open={catDlg} onClose={() => { setCatDlg(false); setEditCat(null); }} edit={editCat} orgId={orgId} key={`cat-${editCat?.id ?? "new"}`} />
      <MenuItemEditor open={itemDlg} onClose={() => { setItemDlg(false); setEditItem(null); }} edit={editItem} orgId={orgId} categories={categories} key={`item-${editItem?.id ?? "new"}`} />
      <AddonDialog open={addonDlg} onClose={() => { setAddonDlg(false); setEditAddon(null); }} edit={editAddon} orgId={orgId} key={`addon-${editAddon?.id ?? "new"}`} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("common.confirmDelete", { name: confirmDelete?.name ?? "" })}
        destructive
        loading={remove.isPending}
        onConfirm={() => confirmDelete && remove.mutate(confirmDelete)}
      />
    </PageShell>
  );
}