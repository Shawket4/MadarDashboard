import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, CircleDashed, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BranchStockRow, OrgIngredient } from "@/data/api/generated/models";
import { createStocktake, useListBranchStock, useListBranches, useListCatalog, useListStocktakes } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { ItemDialog } from "./item-dialog";
import { ItemDrawer } from "./item-drawer";
import { WasteDialog } from "./waste-dialog";
import { invalidateInventory, isOpenStocktake } from "./lib";
import { OnHand } from "./on-hand";

type Filter = "all" | "low" | "uncounted";

/** Ingredients: the org catalog, with this branch's book stock beside it. */
export function ItemsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId } = useScope();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<OrgIngredient | null>(null);
  const [drawerItem, setDrawerItem] = useState<OrgIngredient | null>(null);
  const [wasteOpen, setWasteOpen] = useState(false);
  const [wastePreset, setWastePreset] = useState<string | null>(null);

  const catalog = useListCatalog(orgId ?? "", { query: { enabled: !!orgId } });
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const stock = useListBranchStock(branchId ?? "", { query: { enabled: !!branchId } });
  const stocktakes = useListStocktakes(branchId ?? "", { query: { enabled: !!branchId } });

  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const stockByIngredient = useMemo(() => {
    const map = new Map<string, BranchStockRow>();
    for (const s of stock.data ?? []) map.set(s.org_ingredient_id, s);
    return map;
  }, [stock.data]);

  const rows = useMemo(() => {
    let items = catalog.data ?? [];
    if (branchId && filter === "low") items = items.filter((it) => stockByIngredient.get(it.id)?.below_par);
    if (branchId && filter === "uncounted") items = items.filter((it) => !stockByIngredient.get(it.id)?.last_counted_at);
    return items;
  }, [catalog.data, branchId, filter, stockByIngredient]);

  const drawerRow = drawerItem ? stockByIngredient.get(drawerItem.id) ?? null : null;
  const activeBranches = useMemo(() => (branches.data ?? []).filter((b) => b.is_active), [branches.data]);

  const openCreate = () => { setDialogItem(null); setDialogOpen(true); };
  const openEdit = (it: OrgIngredient) => { setDialogItem(it); setDialogOpen(true); };

  /** Count one item: join the open count, or start a one-item count. */
  const countItem = async (it: OrgIngredient) => {
    if (!branchId) return;
    try {
      const open = (stocktakes.data ?? []).find((s) => isOpenStocktake(s.status));
      if (!open) {
        await createStocktake(branchId, { note: null, category_id: null, org_ingredient_ids: [it.id] });
        await invalidateInventory();
      }
      setDrawerItem(null);
      void navigate({ to: "/inventory/counts" });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<OrgIngredient>[]>(() => {
    const base: ColumnDef<OrgIngredient>[] = [
      { accessorKey: "name", header: t("inventory.catalog.name", "Name"), meta: { label: t("inventory.catalog.name", "Name"), phone: "title" }, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      {
        accessorKey: "category_name",
        header: t("inventory.catalog.category", "Category"),
        meta: { label: t("inventory.catalog.category", "Category") },
        cell: ({ row }) => <Badge variant="secondary">{row.original.category_name}</Badge>,
      },
      {
        accessorKey: "cost_per_unit",
        header: t("inventory.catalog.standardCost", "Standard cost"),
        meta: { label: t("inventory.catalog.standardCost", "Standard cost"), numeric: true },
        cell: ({ row }) => fmtMoney(row.original.cost_per_unit),
      },
      {
        accessorKey: "supplier_name",
        header: t("inventory.catalog.supplier", "Supplier"),
        meta: { label: t("inventory.catalog.supplier", "Supplier") },
        cell: ({ row }) => row.original.supplier_name ?? <span className="text-muted-foreground">—</span>,
      },
    ];
    if (branchId) {
      base.push(
        {
          id: "on_hand",
          header: t("inventory.catalog.onHand", "On hand"),
          meta: { label: t("inventory.catalog.onHand", "On hand"), numeric: true },
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s) return <span className="text-muted-foreground">—</span>;
            return <OnHand qty={s.on_hand} unit={s.unit} />;
          },
        },
        {
          id: "par",
          header: t("inventory.catalog.reorderPoint", "Reorder point"),
          meta: { label: t("inventory.catalog.reorderPoint", "Reorder point"), numeric: true },
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s || s.par_min == null) return <span className="text-muted-foreground">—</span>;
            return `${fmtNumber(s.par_min)} ${fmtUnit(s.unit)}`;
          },
        },
        {
          id: "status",
          header: t("inventory.stock.status", "Status"),
          meta: { label: t("inventory.stock.status", "Status") },
          cell: ({ row }) => {
            const s = stockByIngredient.get(row.original.id);
            if (!s) return null;
            if (!s.last_counted_at) {
              return (
                <StatusPill tone="neutral" icon={CircleDashed}>{t("inventory.stock.neverCounted", "Never counted")}</StatusPill>
              );
            }
            return (
              s.below_par
                ? <StatusPill tone="warning">{t("inventory.stock.low", "Low")}</StatusPill>
                : <StatusPill tone="success">{t("inventory.stock.ok", "OK")}</StatusPill>
            );
          },
        },
      );
    }
    return base;
  }, [t, branchId, stockByIngredient]);

  // The catalog and the branch's stock both arrive unpaginated, so `rows` — the
  // catalog already narrowed by the low/uncounted filter — is the whole answer.
  const handleExport = async () => {
    const cols: ExcelColumn<OrgIngredient>[] = [
      { header: t("inventory.catalog.name", "Name"), accessor: (it) => it.name, type: "text", width: 28 },
      { header: t("inventory.catalog.category", "Category"), accessor: (it) => it.category_name, type: "text", width: 16 },
      { header: t("inventory.catalog.costPerUnit", "Cost / unit"), accessor: (it) => it.cost_per_unit ?? null, type: "money", width: 14 },
      { header: t("inventory.catalog.unit", "Unit"), accessor: (it) => fmtUnit(it.unit), type: "text", width: 10 },
      { header: t("inventory.catalog.supplier", "Supplier"), accessor: (it) => it.supplier_name ?? "—", type: "text", width: 22 },
    ];
    if (branchId) {
      cols.push(
        { header: t("inventory.catalog.onHand", "On hand"), accessor: (it) => stockByIngredient.get(it.id)?.on_hand ?? null, type: "number", width: 12 },
        { header: t("inventory.catalog.reorderPoint", "Reorder point"), accessor: (it) => stockByIngredient.get(it.id)?.par_min ?? null, type: "number", width: 14 },
        { header: t("inventory.stock.status", "Status"), accessor: (it) => { const s = stockByIngredient.get(it.id); return !s || !s.last_counted_at ? t("inventory.stock.neverCounted", "Never counted") : s.below_par ? t("inventory.stock.low", "Low") : t("inventory.stock.ok", "OK"); }, type: "text", width: 14 },
      );
    }
    setExporting(true);
    try {
      await exportToExcel({ filename: "Madar-Ingredients", logoUrl, sheets: [{ name: t("inventory.catalog.title", "Ingredients"), title: t("inventory.catalog.title", "Ingredients"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("inventory.catalog.title", "Ingredients")} />
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t("inventory.catalog.title", "Ingredients")}
        description={t("inventory.catalog.subtitle", "The organization's catalog. Every branch counts from this list.")}
        actions={
          <>
            <ExportButton onExport={handleExport} loading={exporting} disabled={!rows.length} />
            <Button onClick={openCreate}>
              <PackagePlus className="size-4" />
              {t("inventory.catalog.newItem", "New ingredient")}
            </Button>
          </>
        }
        below={
          branchId ? (
            <SegmentedControl<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: t("common.all", "All") },
                { value: "low", label: t("inventory.reports.lowStock", "Low stock") },
                { value: "uncounted", label: t("inventory.stock.neverCounted", "Never counted") },
              ]}
            />
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={catalog.isLoading}
        error={catalog.error}
        onRetry={() => void catalog.refetch()}
        getRowId={(it) => it.id}
        onRowClick={(it) => setDrawerItem(it)}
        searchPlaceholder={t("inventory.catalog.search", "Search ingredients")}
        emptyState={<EmptyState icon={Boxes} title={t("inventory.catalog.noItems", "No ingredients yet")} />}
      />

      <ItemDialog orgId={orgId} open={dialogOpen} onOpenChange={setDialogOpen} item={dialogItem} branches={activeBranches} />

      <ItemDrawer
        item={drawerItem}
        branchId={branchId}
        stockRow={drawerRow}
        open={!!drawerItem}
        onOpenChange={(o) => !o && setDrawerItem(null)}
        onEdit={() => { if (drawerItem) { openEdit(drawerItem); setDrawerItem(null); } }}
        onLogWaste={() => { if (drawerItem) { setWastePreset(drawerItem.id); setWasteOpen(true); setDrawerItem(null); } }}
        onCount={() => { if (drawerItem) void countItem(drawerItem); }}
      />

      {branchId ? (
        <WasteDialog branchId={branchId} open={wasteOpen} onOpenChange={setWasteOpen} presetIngredientId={wastePreset} />
      ) : null}
    </Page>
  );
}
