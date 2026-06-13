import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Store, Trash2 } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BranchInventoryMovement } from "@/data/api/generated/models";
import { useBranchWasteReport, useListWaste } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { WasteDialog } from "./waste-dialog";

export function WastePage() {
  const { t } = useTranslation();
  const { branchId, from, to } = useScope();
  const [logOpen, setLogOpen] = useState(false);

  const waste = useListWaste(branchId ?? "", { query: { enabled: !!branchId } });
  const report = useBranchWasteReport(
    branchId ?? "",
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: !!branchId } },
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

  const columns = useMemo<ColumnDef<BranchInventoryMovement>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: t("common.date", "Date"),
        cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.created_at)}</span>,
      },
      { accessorKey: "ingredient_name", header: t("inventory.waste.ingredient", "Ingredient") },
      {
        accessorKey: "quantity",
        header: t("inventory.waste.quantity", "Quantity"),
        cell: ({ row }) => (
          <span className="tabular">{fmtNumber(Math.abs(row.original.quantity))} {fmtUnit(row.original.unit)}</span>
        ),
      },
      {
        accessorKey: "reason",
        header: t("inventory.waste.reason", "Reason"),
        cell: ({ row }) =>
          row.original.reason ? t(`inventory.waste.reasons.${row.original.reason}`, row.original.reason) : "—",
      },
      {
        accessorKey: "created_by_name",
        header: t("inventory.waste.by", "By"),
        cell: ({ row }) => row.original.created_by_name ?? "—",
      },
    ],
    [t],
  );

  const handleExport = () => {
    const rows = waste.data ?? [];
    const cols: ExcelColumn<BranchInventoryMovement>[] = [
      { header: t("common.date", "Date"), accessor: (m) => m.created_at, type: "dateTime", width: 20 },
      { header: t("inventory.waste.ingredient", "Ingredient"), accessor: (m) => m.ingredient_name, type: "text", width: 28 },
      { header: t("inventory.waste.quantity", "Quantity"), accessor: (m) => Math.abs(m.quantity), type: "number", width: 14 },
      { header: t("inventory.catalog.unit", "Unit"), accessor: (m) => fmtUnit(m.unit), type: "text", width: 10 },
      { header: t("inventory.waste.reason", "Reason"), accessor: (m) => (m.reason ? t(`inventory.waste.reasons.${m.reason}`, m.reason) : "—"), type: "text", width: 18 },
      { header: t("inventory.waste.by", "By"), accessor: (m) => m.created_by_name ?? "—", type: "text", width: 18 },
    ];
    void exportToExcel({ filename: "Sufrix-Waste", sheets: [{ name: t("inventory.waste.title", "Waste log"), title: t("inventory.waste.title", "Waste log"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!branchId) {
    return (
      <Page>
        <PageHeader title={t("inventory.waste.title", "Waste log")} />
        <EmptyState icon={Store} title={t("inventory.pickBranch", "Select a branch to manage its stock")} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t("inventory.waste.title", "Waste log")}
        actions={
          <>
            <ExportButton onExport={handleExport} disabled={!(waste.data?.length)} />
            <Button onClick={() => setLogOpen(true)}>
              <Trash2 className="size-4" />
              {t("inventory.waste.record", "Record waste")}
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={waste.data ?? []}
            loading={waste.isLoading}
            getRowId={(m) => m.id}
            searchPlaceholder={t("common.search", "Search")}
            emptyState={<EmptyState icon={Trash2} title={t("inventory.waste.noWaste", "No waste recorded")} />}
          />
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("inventory.waste.byReason", "By reason")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading", "Loading")}</p>
            ) : byReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("inventory.reports.noData", "No data")}</p>
            ) : (
              <>
                {byReason.map(([reason, agg]) => (
                  <div key={reason} className="flex items-center justify-between text-sm">
                    <span>{t(`inventory.waste.reasons.${reason}`, reason)}</span>
                    <span className="tabular">{agg.hasValue ? fmtMoney(agg.value) : "—"}</span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex items-center justify-between font-medium">
                  <span>{t("inventory.waste.totalPeriod", "Total this period")}</span>
                  <span className="tabular">{fmtMoney(totalValue)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <WasteDialog branchId={branchId} open={logOpen} onOpenChange={setLogOpen} />
    </Page>
  );
}
