import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { ListCard, SummaryLine } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockMovement } from "@/data/api/generated/models";
import { listWaste, useBranchWasteReport, useListWaste } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useScope } from "@/data/scope/use-scope";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { WasteDialog } from "./waste-dialog";
import { wasteSource, wasteWhen } from "./lib";

export function WastePage() {
  const { t } = useTranslation();
  const { branchId, scopeBranchId, isAllBranches, from, to } = useScope();
  const [logOpen, setLogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();
  const canRecord = useCan(Cap.inventoryWasteRecord);

  // The waste log scopes to the selected branch or rolls up across the org
  // ("All branches"). Logging waste needs a concrete branch (gated below).
  const waste = useListWaste(scopeBranchId, undefined, { query: { enabled: !!scopeBranchId } });
  // The "by reason" report also rolls up org-wide for All branches (the
  // waste-report endpoint accepts the all-branches sentinel).
  const report = useBranchWasteReport(
    scopeBranchId,
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: !!scopeBranchId } },
  );

  const byReason = useMemo(() => {
    const map = new Map<string, { value: number; hasValue: boolean }>();
    for (const r of report.data ?? []) {
      const cur = map.get(r.reason) ?? { value: 0, hasValue: false };
      if (r.waste_value != null) {
        cur.value += r.waste_value;
        cur.hasValue = true;
      }
      map.set(r.reason, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].value - a[1].value);
  }, [report.data]);

  const totalValue = useMemo(
    () => (report.data ?? []).reduce((sum, r) => sum + (r.waste_value ?? 0), 0),
    [report.data],
  );

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: t("common.date", "Date"),
        meta: { label: t("common.date", "Date"), numeric: true, align: "start" },
        cell: ({ row }) => fmtDateTime(wasteWhen(row.original)),
      },
      ...(isAllBranches
        ? ([{
            accessorKey: "branch_name",
            header: t("inventory.waste.branch", "Branch"),
            meta: { label: t("inventory.waste.branch", "Branch") },
            cell: ({ row }) => <span>{row.original.branch_name ?? "—"}</span>,
          }] as ColumnDef<StockMovement>[])
        : []),
      {
        accessorKey: "ingredient_name",
        header: t("inventory.waste.ingredient", "Ingredient"),
        meta: { label: t("inventory.waste.ingredient", "Ingredient"), phone: "title" },
        cell: ({ row }) => {
          const m = row.original;
          // A menu item wasted at the till comes off stock as its recipe: say
          // which item each ingredient line came from.
          const fromItem = m.waste_subject_kind === "menu_item" && m.waste_subject_name;
          return (
            <span className="flex flex-col">
              <span className="font-medium">{m.ingredient_name}</span>
              {fromItem ? (
                <span className="text-xs text-muted-foreground">
                  {t("inventory.waste.fromItem", "From {{item}} × {{qty}}", {
                    item: m.waste_size_label ? `${m.waste_subject_name} (${m.waste_size_label})` : m.waste_subject_name,
                    qty: fmtNumber(m.waste_quantity ?? 0),
                  })}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: t("inventory.waste.quantity", "Quantity"),
        meta: { label: t("inventory.waste.quantity", "Quantity"), numeric: true },
        cell: ({ row }) => `${fmtNumber(Math.abs(row.original.quantity))} ${fmtUnit(row.original.unit)}`,
      },
      {
        accessorKey: "reason",
        header: t("inventory.waste.reason", "Reason"),
        meta: { label: t("inventory.waste.reason", "Reason") },
        cell: ({ row }) =>
          row.original.reason ? t(`inventory.waste.reasons.${row.original.reason}`, row.original.reason) : "—",
      },
      {
        accessorKey: "created_by_name",
        header: t("inventory.waste.by", "By"),
        meta: { label: t("inventory.waste.by", "By") },
        cell: ({ row }) => {
          const m = row.original;
          return (
            <span className="flex flex-col">
              <span>{m.created_by_name ?? "—"}</span>
              {m.approved_by_name ? (
                <span className="text-xs text-muted-foreground">
                  {t("inventory.waste.approvedBy", "Approved by {{name}}", { name: m.approved_by_name })}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        id: "source",
        header: t("inventory.waste.source", "Source"),
        meta: { label: t("inventory.waste.source", "Source") },
        cell: ({ row }) => {
          const m = row.original;
          const source = wasteSource(m);
          return (
            <span className="flex flex-col items-start gap-0.5">
              <Badge variant={source === "pos" ? "secondary" : "outline"}>
                {t(`inventory.waste.sources.${source}`)}
              </Badge>
              {m.device_name ? (
                <span className="text-xs text-muted-foreground">
                  {t("inventory.waste.device", "Device {{name}}", { name: m.device_name })}
                </span>
              ) : null}
            </span>
          );
        },
      },
    ],
    [t, isAllBranches],
  );

  /**
   * The log endpoint is offset-paged and the table asks for one page, so the
   * export re-runs the same branch-scoped query and walks it to the end. Taking
   * `waste.data` instead would file the first page under the whole log's name.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages<StockMovement>(async (offset, limit) => ({
        rows: await listWaste(scopeBranchId, { limit, offset }, EXPORT_REQUEST),
      }));
      const cols: ExcelColumn<StockMovement>[] = [
        { header: t("common.date", "Date"), accessor: (m) => wasteWhen(m), type: "dateTime", width: 20 },
        { header: t("inventory.waste.ingredient", "Ingredient"), accessor: (m) => m.ingredient_name, type: "text", width: 28 },
        { header: t("inventory.waste.quantity", "Quantity"), accessor: (m) => Math.abs(m.quantity), type: "number", width: 14 },
        { header: t("inventory.catalog.unit", "Unit"), accessor: (m) => fmtUnit(m.unit), type: "text", width: 10 },
        { header: t("inventory.waste.reason", "Reason"), accessor: (m) => (m.reason ? t(`inventory.waste.reasons.${m.reason}`, m.reason) : "—"), type: "text", width: 18 },
        { header: t("inventory.waste.by", "By"), accessor: (m) => m.created_by_name ?? "—", type: "text", width: 18 },
        { header: t("inventory.waste.approvedByColumn", "Approved by"), accessor: (m) => m.approved_by_name ?? "", type: "text", width: 18 },
        { header: t("inventory.waste.item", "Menu item"), accessor: (m) => (m.waste_subject_kind === "menu_item" ? m.waste_subject_name ?? "" : ""), type: "text", width: 22 },
        { header: t("inventory.waste.source", "Source"), accessor: (m) => t(`inventory.waste.sources.${wasteSource(m)}`), type: "text", width: 14 },
        { header: t("inventory.waste.deviceColumn", "Device"), accessor: (m) => m.device_name ?? "", type: "text", width: 12 },
      ];
      await exportToExcel({ filename: "Madar-Waste", logoUrl, sheets: [{ name: t("inventory.waste.title", "Waste log"), title: t("inventory.waste.title", "Waste log"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("inventory.waste.title", "Waste log")}
        actions={
          <>
          <ExportButton onExport={handleExport} loading={exporting} disabled={!(waste.data?.length)} />
          {branchId && canRecord ? (
            <Button onClick={() => setLogOpen(true)}>
              <Trash2 className="size-4" />
              {t("inventory.waste.record", "Record waste")}
            </Button>
          ) : null}
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={waste.data ?? []}
            loading={waste.isLoading}
            error={waste.error}
            onRetry={() => void waste.refetch()}
            getRowId={(m) => m.id}
            searchPlaceholder={t("common.search", "Search")}
            emptyState={<EmptyState icon={Trash2} title={t("inventory.waste.noWaste", "No waste recorded")} />}
          />
        </div>
        <section className="space-y-3">
          <SectionHeader title={t("inventory.waste.byReason", "By reason")} />
          {report.isError ? (
            <ErrorState
              title={t("inventory.waste.reportFailed", "Couldn't load waste by reason")}
              onRetry={() => void report.refetch()}
            />
          ) : report.isLoading ? (
            <ListCard className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </ListCard>
          ) : byReason.length === 0 ? (
            <EmptyState className="py-8" title={t("inventory.waste.noReasonData", "Waste by reason appears once waste is logged in this period.")} />
          ) : (
            <div className="rounded-2xl border bg-card px-5 py-3">
              {byReason.map(([reason, agg]) => (
                <SummaryLine
                  key={reason}
                  label={t(`inventory.waste.reasons.${reason}`, reason)}
                  value={agg.hasValue ? fmtMoney(agg.value) : "—"}
                />
              ))}
              <div className="my-2 border-t" />
              <SummaryLine emphasis label={t("inventory.waste.totalPeriod", "Total this period")} value={fmtMoney(totalValue)} />
            </div>
          )}
        </section>
      </div>

      <WasteDialog branchId={branchId ?? ""} open={logOpen} onOpenChange={setLogOpen} />
    </Page>
  );
}
