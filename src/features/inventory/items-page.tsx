import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, PackagePlus } from "lucide-react";

import { Page } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BranchInventoryItem, OrgIngredient } from "@/data/api/generated/models";
import { useListBranchStock, useListBranches, useListCatalog } from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { ItemDialog } from "./item-dialog";
import { ItemDrawer } from "./item-drawer";
import { WasteDialog } from "./waste-dialog";

type Filter = "all" | "low";

export function ItemsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId } = useScope();

  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<OrgIngredient | null>(null);
  const [drawerItem, setDrawerItem] = useState<OrgIngredient | null>(null);
  const [wasteOpen, setWasteOpen] = useState(false);
  const [wastePreset, setWastePreset] = useState<string | null>(null);

  const catalog = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const stock = useListBranchStock(branchId ?? "", { query: { enabled: !!branchId } });

  const stockByIngredient = useMemo(() => {
    const map = new Map<string, BranchInventoryItem>();
    for (const s of stock.data ?? []) map.set(s.org_ingredient_id, s);
    return map;
  }, [stock.data]);

  const rows = useMemo(() => {
    let items = catalog.data ?? [];
    if (branchId && filter === "low") {
      items = items.filter((it) => stockByIngredient.get(it.id)?.below_reorder);
    }
    return items;
  }, [catalog.data, branchId, filter, stockByIngredient]);

  const drawerBranchItem = drawerItem ? stockByIngredient.get(drawerItem.id) ?? null : null;
  const activeBranches = useMemo(() => (branches.data ?? []).filter((b) => b.is_active), [branches.data]);

  const openCreate = () => { setDialogItem(null); setDialogOpen(true); };
  const openEdit = (it: OrgIngredient) => { setDialogItem(it); setDialogOpen(true); };

  const columns = useMemo<ColumnDef<OrgIngredient>[]>(() => {
    const base: ColumnDef<OrgIngredient>[] = [
      { accessorKey: "name", header: t("inventory.catalog.name", "Name") },
      {
        accessorKey: "category",
        header: t("inventory.catalog.category", "Category"),
        cell: ({ row }) => <Badge variant="secondary">{t(`inventory.catalog.cat_${row.original.category}`, row.original.category)}</Badge>,
      },
      {
        accessorKey: "cost_per_unit",
        header: t("inventory.catalog.standardCost", "Standard cost"),
        cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.cost_per_unit)}</span>,
      },
      {
        accessorKey: "supplier_name",
        header: t("inventory.catalog.supplier", "Supplier"),
        cell: ({ row }) => row.original.supplier_name ?? <span className="text-muted-foreground">—</span>,
      },
    ];
    if (branchId) {
      base.push(
        {
          id: "on_hand",
          header: t("inventory.catalog.onHand", "On hand"),
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s) return <span className="text-muted-foreground">—</span>;
            return <span className="tabular">{fmtNumber(s.current_stock)} {fmtUnit(s.unit)}</span>;
          },
        },
        {
          id: "low_level",
          header: t("inventory.catalog.lowStockLevel", "Low-stock level"),
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s || s.reorder_threshold <= 0) return <span className="text-muted-foreground">—</span>;
            return <span className="tabular">{fmtNumber(s.reorder_threshold)} {fmtUnit(s.unit)}</span>;
          },
        },
        {
          id: "status",
          header: t("inventory.stock.status", "Status"),
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s) return null;
            return (
              <Badge variant="secondary" className={cn(s.below_reorder ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}>
                {s.below_reorder ? t("inventory.stock.low", "Low") : t("inventory.stock.ok", "OK")}
              </Badge>
            );
          },
        },
      );
    }
    return base;
  }, [t, branchId, stockByIngredient]);

  const handleExport = () => {
    const cols: ExcelColumn<OrgIngredient>[] = [
      { header: t("inventory.catalog.name", "Name"), accessor: (it) => it.name, type: "text", width: 28 },
      { header: t("inventory.catalog.category", "Category"), accessor: (it) => t(`inventory.catalog.cat_${it.category}`, it.category), type: "text", width: 16 },
      { header: t("inventory.catalog.costPerUnit", "Cost / unit"), accessor: (it) => it.cost_per_unit ?? null, type: "money", width: 14 },
      { header: t("inventory.catalog.unit", "Unit"), accessor: (it) => fmtUnit(it.unit), type: "text", width: 10 },
      { header: t("inventory.catalog.supplier", "Supplier"), accessor: (it) => it.supplier_name ?? "—", type: "text", width: 22 },
    ];
    if (branchId) {
      cols.push(
        { header: t("inventory.catalog.onHand", "On hand"), accessor: (it) => stockByIngredient.get(it.id)?.current_stock ?? null, type: "number", width: 12 },
        { header: t("inventory.catalog.lowStockLevel", "Low-stock level"), accessor: (it) => { const s = stockByIngredient.get(it.id); return s && s.reorder_threshold > 0 ? s.reorder_threshold : null; }, type: "number", width: 14 },
        { header: t("inventory.stock.status", "Status"), accessor: (it) => { const s = stockByIngredient.get(it.id); return s ? (s.below_reorder ? t("inventory.stock.low", "Low") : t("inventory.stock.ok", "OK")) : "—"; }, type: "text", width: 10 },
      );
    }
    void exportToExcel({ filename: "Sufrix-Ingredients", sheets: [{ name: t("inventory.catalog.title", "Ingredient catalog"), title: t("inventory.catalog.title", "Ingredient catalog"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.catalog.title", "Ingredient catalog")}</h1>
        </div>
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.catalog.title", "Ingredient catalog")}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={!rows.length} />
          <Button onClick={openCreate}>
            <PackagePlus className="size-4" />
            {t("inventory.catalog.newItem", "New ingredient")}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={catalog.isLoading}
        getRowId={(it) => it.id}
        onRowClick={(it) => setDrawerItem(it)}
        searchPlaceholder={t("inventory.catalog.search", "Search ingredients")}
        toolbar={
          branchId ? (
            <SegmentedControl<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: t("common.all", "All") },
                { value: "low", label: t("inventory.reports.lowStock", "Low stock") },
              ]}
            />
          ) : undefined
        }
        emptyState={<EmptyState icon={Boxes} title={t("inventory.catalog.noItems", "No ingredients yet")} />}
      />

      <ItemDialog orgId={orgId} open={dialogOpen} onOpenChange={setDialogOpen} item={dialogItem} branches={activeBranches} />

      <ItemDrawer
        item={drawerItem}
        branchId={branchId}
        branchItem={drawerBranchItem}
        open={!!drawerItem}
        onOpenChange={(o) => !o && setDrawerItem(null)}
        onEdit={() => { if (drawerItem) { openEdit(drawerItem); setDrawerItem(null); } }}
        onLogWaste={() => { if (drawerItem) { setWastePreset(drawerItem.id); setWasteOpen(true); setDrawerItem(null); } }}
      />

      {branchId ? (
        <WasteDialog branchId={branchId} open={wasteOpen} onOpenChange={setWasteOpen} presetIngredientId={wastePreset} />
      ) : null}
    </Page>
  );
}
