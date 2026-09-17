/** Read-only low-stock report for Reports ▸ Operations — the same rows as
 *  Inventory ▸ Today's low-stock table, minus the reorder-PO actions (this is
 *  a report tab, not an ops tool). */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { StatusPill } from "@/components/app/status-pill";
import { useBranchLowStock, useOrgLowStock } from "@/data/api/generated/api";
import type { LowStockRow } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, exportToCsv, type ExcelColumn } from "@/lib/excel";
import { fmtNumber, fmtUnit } from "@/lib/format";

export function LowStockTab({ orgId, branchId }: { orgId: string; branchId: string | null }) {
  const { t } = useTranslation();
  const branchLow = useBranchLowStock(branchId ?? "", { query: { enabled: !!branchId } });
  const orgLow = useOrgLowStock(orgId, { query: { enabled: !branchId && !!orgId } });
  const q = branchId ? branchLow : orgLow;
  const rows = useMemo(() => q.data ?? [], [q.data]);

  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const columns = useMemo<ColumnDef<LowStockRow>[]>(() => [
    {
      id: "name",
      header: t("inventory.catalog.name", "Name"),
      meta: { label: t("inventory.catalog.name", "Name"), phone: "title" },
      cell: ({ row: { original: r } }) => (
        <span className="flex items-center gap-2 font-medium">
          {r.ingredient_name}
          {r.on_hand <= 0
            ? <StatusPill tone="danger" size="sm">{t("inventory.today.statusCritical", "Critical")}</StatusPill>
            : <StatusPill tone="warning" size="sm">{t("inventory.today.statusLow", "Low")}</StatusPill>}
        </span>
      ),
    },
    ...(branchId ? [] : [{
      id: "branch", header: t("inventory.reports.branchName", "Branch"),
      meta: { label: t("inventory.reports.branchName", "Branch") },
      cell: ({ row }: { row: { original: LowStockRow } }) => row.original.branch_name,
    } as ColumnDef<LowStockRow>]),
    { id: "onHand", header: t("inventory.today.onHand", "On hand"), meta: { label: t("inventory.today.onHand", "On hand"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.on_hand)} ${fmtUnit(r.unit)}` },
    { id: "par", header: t("inventory.today.reorderPoint", "Reorder point"), meta: { label: t("inventory.today.reorderPoint", "Reorder point"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.par_min)} ${fmtUnit(r.unit)}` },
    { id: "suggested", header: t("inventory.today.suggested", "Order"), meta: { label: t("inventory.today.suggested", "Order"), numeric: true }, cell: ({ row: { original: r } }) => `${fmtNumber(r.suggested_qty)} ${fmtUnit(r.unit)}` },
    { id: "supplier", header: t("inventory.catalog.supplier", "Supplier"), meta: { label: t("inventory.catalog.supplier", "Supplier") }, cell: ({ row }) => row.original.supplier_name ?? <span className="text-muted-foreground">—</span> },
  ], [t, branchId]);

  const buildSheet = () => {
    type Row = Record<string, string | number | null>;
    const cols: ExcelColumn<Row>[] = [
      { header: t("inventory.catalog.name", "Name"), accessor: (r) => r.name, type: "text", width: 26 },
      ...(branchId ? [] : [{ header: t("inventory.reports.branchName", "Branch"), accessor: (r: Row) => r.branch, type: "text" as const, width: 20 }]),
      { header: t("inventory.today.onHand", "On hand"), accessor: (r) => r.onHand, type: "number", width: 14 },
      { header: t("inventory.today.reorderPoint", "Reorder point"), accessor: (r) => r.parMin, type: "number", width: 16 },
      { header: t("inventory.today.suggested", "Order"), accessor: (r) => r.suggested, type: "number", width: 14 },
      { header: t("inventory.catalog.unit", "Unit"), accessor: (r) => r.unit, type: "text", width: 10 },
      { header: t("inventory.catalog.supplier", "Supplier"), accessor: (r) => r.supplier, type: "text", width: 20 },
    ];
    const data: Row[] = rows.map((r) => ({
      name: r.ingredient_name, branch: r.branch_name, onHand: r.on_hand, parMin: r.par_min,
      suggested: r.suggested_qty, unit: fmtUnit(r.unit), supplier: r.supplier_name ?? "",
    }));
    const title = t("reports.operations.tabs.lowStock", "Low stock");
    return { title, rows: data as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] };
  };

  const handleExport = async () => {
    const sheet = buildSheet();
    setExporting(true);
    try {
      await exportToExcel({ filename: `Madar-${sheet.title}`, logoUrl, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    const sheet = buildSheet();
    try {
      await exportToCsv({ filename: `Madar-${sheet.title}`, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={q.isLoading}
      error={q.error}
      onRetry={() => void q.refetch()}
      getRowId={(r) => `${r.branch_id}-${r.org_ingredient_id}`}
      pageSize={50}
      toolbar={<ExportButton size="sm" onExport={handleExport} onExportCsv={handleExportCsv} loading={exporting} disabled={rows.length === 0} />}
      emptyState={<EmptyState title={t("inventory.today.noLowStock", "Nothing below its reorder point")} />}
    />
  );
}
