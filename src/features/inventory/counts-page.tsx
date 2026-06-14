import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Stocktake } from "@/data/api/generated/models";
import { createStocktake, useListStocktakes } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { CountEditor } from "./count-editor";
import { VarianceReportDialog } from "./variance-report-dialog";
import { STOCKTAKE_STATUS_STYLES, invalidateInventory, isOpenStocktake } from "./lib";

export function CountsPage() {
  const { t } = useTranslation();
  const { branchId, scopeBranchId, isAllBranches } = useScope();
  const [starting, setStarting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  // The list scopes to the selected branch or rolls up across the org ("All
  // branches"). Starting a stocktake is a branch-specific action, so it stays
  // tied to a concrete branch below.
  const stocktakes = useListStocktakes(scopeBranchId, { query: { enabled: !!scopeBranchId } });
  const openCount = useMemo(() => (stocktakes.data ?? []).find((s) => isOpenStocktake(s.status)) ?? null, [stocktakes.data]);
  const history = useMemo(() => (stocktakes.data ?? []).filter((s) => !isOpenStocktake(s.status)), [stocktakes.data]);

  const start = async () => {
    if (!branchId) return;
    setStarting(true);
    try {
      await createStocktake(branchId, { note: null });
      await invalidateInventory();
      toast.success(t("inventory.stocktakes.start", "Start stocktake"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const columns = useMemo<ColumnDef<Stocktake>[]>(() => [
    {
      accessorKey: "started_at",
      header: t("inventory.stocktakes.started", "Started"),
      cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.started_at)}</span>,
    },
    ...(isAllBranches
      ? ([{
          accessorKey: "branch_name",
          header: t("shifts.branch", "Branch"),
          cell: ({ row }) => <span>{row.original.branch_name ?? "—"}</span>,
        }] as ColumnDef<Stocktake>[])
      : []),
    {
      accessorKey: "started_by_name",
      header: t("inventory.transfers.by", "By"),
      cell: ({ row }) => row.original.started_by_name ?? "—",
    },
    {
      accessorKey: "status",
      header: t("inventory.stocktakes.status", "Status"),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn(STOCKTAKE_STATUS_STYLES[row.original.status] ?? "")}>
          {t(`inventory.stocktakes.st_${row.original.status}`, row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "finalized_at",
      header: t("inventory.stocktakes.finalized", "Finalized"),
      cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.finalized_at)}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) =>
        row.original.status === "finalized" ? (
          <div className="text-end">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setReportId(row.original.id); }}>
              {t("inventory.stocktakes.viewReport", "View report")}
            </Button>
          </div>
        ) : null,
    },
  ], [t, isAllBranches]);

  const handleExport = () => {
    const cols: ExcelColumn<Stocktake>[] = [
      { header: t("inventory.stocktakes.started", "Started"), accessor: (s) => s.started_at, type: "dateTime", width: 20 },
      { header: t("inventory.transfers.by", "By"), accessor: (s) => s.started_by_name ?? "—", type: "text", width: 20 },
      { header: t("inventory.stocktakes.status", "Status"), accessor: (s) => t(`inventory.stocktakes.st_${s.status}`, s.status), type: "text", width: 14 },
      { header: t("inventory.stocktakes.finalized", "Finalized"), accessor: (s) => s.finalized_at ?? "", type: "dateTime", width: 20 },
      { header: t("inventory.transfers.note", "Note"), accessor: (s) => s.note ?? "", type: "text", width: 30 },
    ];
    void exportToExcel({ filename: "Sufrix-Stocktakes", sheets: [{ name: t("inventory.stocktakes.title", "Stocktakes"), title: t("inventory.stocktakes.title", "Stocktakes"), rows: history as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  return (
    <Page>
      <PageHeader
        title={t("inventory.stocktakes.title", "Stocktakes")}
        actions={
          <>
            <ExportButton onExport={handleExport} disabled={!history.length} />
            {branchId && !openCount ? (
              <Button loading={starting} onClick={() => void start()}>
                <PlusCircle className="size-4" />
                {t("inventory.stocktakes.start", "Start stocktake")}
              </Button>
            ) : null}
          </>
        }
      />

      {branchId && openCount ? (
        // The live count editor is branch-specific — only take over the page for
        // a concrete branch. In the all-branches roll-up we always show the list
        // (open stocktakes appear there too).
        <CountEditor
          stocktakeId={openCount.id}
          onFinalized={(id) => setReportId(id)}
          onCancelled={() => void invalidateInventory()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={branchId ? history : (stocktakes.data ?? [])}
          loading={stocktakes.isLoading}
          getRowId={(s) => s.id}
          onRowClick={(s) => s.status === "finalized" && setReportId(s.id)}
          emptyState={<EmptyState icon={ClipboardList} title={t("inventory.stocktakes.noStocktakes", "No stocktakes yet")} description={t("inventory.stocktakes.startHint", "Start a count to reconcile this branch's stock.")} />}
        />
      )}

      <VarianceReportDialog stocktakeId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </Page>
  );
}
