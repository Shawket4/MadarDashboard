import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Boxes, CircleHelp, Store, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ProgressBar } from "@/components/app/progress-bar";
import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useBranchConsumption, useBranchInventoryValuation, useBranchShrinkage,
  useBranchWasteReport, useListCatalog, useOrgConsumption, useOrgInventoryValuation, useOrgShrinkage,
  useOrgWasteReport,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";

type ReportScope = "branch" | "org";

export function ReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, from, to } = useScope();

  const [scope, setScope] = useState<ReportScope>(branchId ? "branch" : "org");
  const [tab, setTab] = useState("valuation");
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  const isBranch = scope === "branch";
  const scopeId = isBranch ? branchId : orgId;
  const range = { from: from ?? undefined, to: to ?? undefined };
  const on = (key: string) => tab === key && !!scopeId;

  // Valuation
  const branchVal = useBranchInventoryValuation(branchId ?? "", { query: { enabled: isBranch && on("valuation") && !!branchId } });
  const orgVal = useOrgInventoryValuation(orgId ?? "", { query: { enabled: !isBranch && on("valuation") && !!orgId } });
  const valuation = isBranch ? branchVal : orgVal;
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: on("valuation") && !!orgId } });

  // Consumption
  const branchCons = useBranchConsumption(branchId ?? "", range, { query: { enabled: isBranch && on("consumption") && !!branchId } });
  const orgCons = useOrgConsumption(orgId ?? "", range, { query: { enabled: !isBranch && on("consumption") && !!orgId } });
  const consumption = isBranch ? branchCons : orgCons;

  // Shrinkage
  const branchShr = useBranchShrinkage(branchId ?? "", range, { query: { enabled: isBranch && on("shrinkage") && !!branchId } });
  const orgShr = useOrgShrinkage(orgId ?? "", range, { query: { enabled: !isBranch && on("shrinkage") && !!orgId } });
  const shrinkage = isBranch ? branchShr : orgShr;

  // Waste
  const branchWaste = useBranchWasteReport(branchId ?? "", range, { query: { enabled: isBranch && on("waste") && !!branchId } });
  const orgWaste = useOrgWasteReport(orgId ?? "", range, { query: { enabled: !isBranch && on("waste") && !!orgId } });
  const wasteReport = isBranch ? branchWaste : orgWaste;

  const byCategory = useMemo(() => {
    const cat = new Map<string, string>();
    for (const c of catalog.data ?? []) cat.set(c.id, c.category_name);
    const sums = new Map<string, number>();
    for (const it of valuation.data?.items ?? []) {
      if (it.value == null) continue;
      const key = cat.get(it.org_ingredient_id) ?? t("inventory.catalog.uncategorized", "Uncategorized");
      sums.set(key, (sums.get(key) ?? 0) + it.value);
    }
    const rows = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    const max = rows.reduce((m, [, v]) => Math.max(m, v), 0);
    return { rows, max };
  }, [catalog.data, valuation.data, t]);

  // Export the currently-visible report tab. Every one of these endpoints
  // returns its whole aggregate for the scope and date range in one response —
  // they are roll-ups, not row listings — so there is no paging to walk.
  const handleExport = async () => {
    type Row = Record<string, string | number | null>;
    let title = "";
    let cols: ExcelColumn<Row>[] = [];
    let rows: Row[] = [];
    const item = t("inventory.reports.ingredient", "Item");
    const reasonH = t("inventory.reports.reason", "Reason");
    const qtyH = t("inventory.reports.qty", "Quantity");
    const unitH = t("inventory.catalog.unit", "Unit");

    if (tab === "valuation") {
      title = t("inventory.reports.valuation", "Valuation");
      cols = [
        { header: t("inventory.reports.byCategory", "By category"), accessor: (r) => r.category, type: "text", width: 24 },
        { header: t("inventory.reports.totalValue", "Total value"), accessor: (r) => r.value, type: "money", width: 16 },
      ];
      rows = byCategory.rows.map(([cat, val]) => ({ category: cat, value: val }));
    } else if (tab === "consumption") {
      title = t("inventory.reports.consumption", "Consumption");
      cols = [
        { header: item, accessor: (r) => r.item, type: "text", width: 28 },
        { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
        { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
        { header: t("inventory.reports.consumedValue", "Consumed value"), accessor: (r) => r.value, type: "money", width: 16 },
      ];
      rows = (consumption.data ?? []).map((r) => ({ item: r.ingredient_name, qty: r.consumed_qty, unit: fmtUnit(r.unit), value: r.consumed_value ?? null }));
    } else if (tab === "shrinkage") {
      title = t("inventory.reports.shrinkage", "Shrinkage");
      cols = [
        { header: item, accessor: (r) => r.item, type: "text", width: 28 },
        { header: reasonH, accessor: (r) => r.reason, type: "text", width: 18 },
        { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
        { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
        { header: t("inventory.reports.value", "Value"), accessor: (r) => r.value, type: "money", width: 14 },
      ];
      rows = (shrinkage.data ?? []).map((r) => ({
        item: r.ingredient_name,
        reason: r.reason === "unexplained" ? t("inventory.varianceReasons.other", "Other") : t(`inventory.varianceReasons.${r.reason}`, r.reason),
        qty: r.shrinkage_qty, unit: fmtUnit(r.unit), value: r.shrinkage_value ?? null,
      }));
    } else {
      title = t("inventory.reports.wasteReport", "Waste");
      cols = [
        { header: item, accessor: (r) => r.item, type: "text", width: 28 },
        { header: reasonH, accessor: (r) => r.reason, type: "text", width: 18 },
        { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
        { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
        { header: t("inventory.reports.wasteValue", "Waste value"), accessor: (r) => r.value, type: "money", width: 14 },
      ];
      rows = (wasteReport.data ?? []).map((r) => ({
        item: r.ingredient_name, reason: t(`inventory.waste.reasons.${r.reason}`, r.reason),
        qty: r.waste_qty, unit: fmtUnit(r.unit), value: r.waste_value ?? null,
      }));
    }
    const scopeLabel = isBranch ? t("inventory.reports.branch", "This branch") : t("inventory.reports.org", "Whole organization");
    setExporting(true);
    try {
      await exportToExcel({ filename: `Madar-${title}`, logoUrl, sheets: [{ name: title, title, subtitle: scopeLabel, rows: rows as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const currentCount =
    tab === "valuation" ? byCategory.rows.length
      : tab === "consumption" ? (consumption.data?.length ?? 0)
        : tab === "shrinkage" ? (shrinkage.data?.length ?? 0)
          : (wasteReport.data?.length ?? 0);

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("inventory.reports.title", "Inventory reports")} />
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  const branchGate = isBranch && !branchId;
  const noData = t("inventory.reports.noDataPeriod", "Nothing recorded for this scope and period.");

  return (
    <Page>
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <PageHeader
          title={t("inventory.reports.title", "Inventory reports")}
          actions={<ExportButton onExport={handleExport} loading={exporting} disabled={branchGate || !currentCount} />}
          below={
            <>
              <PageTabsList>
                <PageTabsTrigger value="valuation" className="first:ps-0">{t("inventory.reports.valuation", "Valuation")}</PageTabsTrigger>
                <PageTabsTrigger value="consumption">{t("inventory.reports.consumption", "Consumption")}</PageTabsTrigger>
                <PageTabsTrigger value="shrinkage">{t("inventory.reports.shrinkage", "Shrinkage")}</PageTabsTrigger>
                <PageTabsTrigger value="waste">{t("inventory.reports.wasteReport", "Waste")}</PageTabsTrigger>
              </PageTabsList>
              <SegmentedControl<ReportScope>
                value={scope}
                onChange={setScope}
                options={[
                  { value: "branch", label: t("inventory.reports.branch", "This branch") },
                  { value: "org", label: t("inventory.reports.org", "Whole organization") },
                ]}
              />
            </>
          }
        />

        {branchGate ? (
          <EmptyState icon={Store} title={t("inventory.pickBranch", "Select a branch to manage its stock")} />
        ) : (
          <>
            {/* Valuation */}
            <TabsContent value="valuation" className="space-y-6">
              {valuation.isError ? (
                <ErrorState
                  title={t("inventory.reports.valuationFailed", "Couldn't load stock valuation")}
                  onRetry={() => void valuation.refetch()}
                />
              ) : (
                <>
                  <LedgerStrip
                    className="lg:max-w-2xl"
                    items={[
                      { key: "value", label: t("inventory.reports.totalValue", "Total value"), value: valuation.data?.total_value ?? 0, formatType: "money", icon: Wallet, loading: valuation.isLoading },
                      { key: "unknown", label: t("inventory.reports.unknownCostLabel", "Unknown cost"), value: valuation.data?.unknown_cost_count ?? 0, icon: CircleHelp, accent: (valuation.data?.unknown_cost_count ?? 0) > 0 ? "warning" : "neutral", loading: valuation.isLoading },
                    ] satisfies LedgerItem[]}
                  />
                  <section className="space-y-3">
                    <SectionHeader title={t("inventory.reports.byCategory", "By category")} />
                    {valuation.isLoading || catalog.isLoading ? (
                      <div className="space-y-4 rounded-2xl border bg-card p-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-20" /></div>
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : byCategory.rows.length === 0 ? (
                      <EmptyState className="py-8" title={t("inventory.reports.noValuation", "Stock value by category appears after a branch is counted.")} />
                    ) : (
                      <div className="space-y-4 rounded-2xl border bg-card p-5">
                        {byCategory.rows.map(([cat, val]) => (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="font-medium">{cat}</span>
                              <bdi className="font-mono tabular">{fmtMoney(val)}</bdi>
                            </div>
                            <ProgressBar value={val} max={byCategory.max} ariaLabel={cat} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </TabsContent>

            {/* Consumption */}
            <TabsContent value="consumption">
              <ReportTable
                query={consumption}
                empty={noData}
                head={[
                  { label: t("inventory.reports.ingredient", "Item") },
                  { label: t("inventory.reports.qty", "Quantity"), numeric: true },
                  { label: t("inventory.reports.consumedValue", "Consumed value"), numeric: true },
                ]}
                rows={(consumption.data ?? []).map((r) => ({
                  key: r.org_ingredient_id,
                  cells: [r.ingredient_name, `${fmtNumber(r.consumed_qty)} ${fmtUnit(r.unit)}`, fmtMoney(r.consumed_value)],
                }))}
              />
            </TabsContent>

            {/* Shrinkage */}
            <TabsContent value="shrinkage">
              <ReportTable
                query={shrinkage}
                empty={noData}
                head={[
                  { label: t("inventory.reports.ingredient", "Item") },
                  { label: t("inventory.reports.reason", "Reason") },
                  { label: t("inventory.reports.qty", "Quantity"), numeric: true },
                  { label: t("inventory.reports.value", "Value"), numeric: true },
                ]}
                rows={(shrinkage.data ?? []).map((r, i) => ({
                  key: `${r.org_ingredient_id}-${r.reason}-${i}`,
                  cells: [
                    r.ingredient_name,
                    r.reason === "unexplained" ? t("inventory.varianceReasons.other", "Other") : t(`inventory.varianceReasons.${r.reason}`, r.reason),
                    `${fmtNumber(r.shrinkage_qty)} ${fmtUnit(r.unit)}`,
                    fmtMoney(r.shrinkage_value),
                  ],
                }))}
              />
            </TabsContent>

            {/* Waste */}
            <TabsContent value="waste">
              <ReportTable
                query={wasteReport}
                empty={noData}
                head={[
                  { label: t("inventory.reports.ingredient", "Item") },
                  { label: t("inventory.reports.reason", "Reason") },
                  { label: t("inventory.reports.qty", "Quantity"), numeric: true },
                  { label: t("inventory.reports.wasteValue", "Waste value"), numeric: true },
                ]}
                rows={(wasteReport.data ?? []).map((r, i) => ({
                  key: `${r.org_ingredient_id}-${r.reason}-${i}`,
                  cells: [r.ingredient_name, t(`inventory.waste.reasons.${r.reason}`, r.reason), `${fmtNumber(r.waste_qty)} ${fmtUnit(r.unit)}`, fmtMoney(r.waste_value)],
                }))}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </Page>
  );
}

type ReportRow = { key: string; cells: string[] };

function ReportTable({ head, rows, query, empty }: {
  head: { label: string; numeric?: boolean }[];
  rows: ReportRow[];
  query: { isLoading: boolean; error: unknown; refetch: () => unknown };
  empty: string;
}) {
  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () =>
      head.map((h, i) => ({
        id: `c${i}`,
        header: h.label,
        accessorFn: (r) => r.cells[i],
        meta: { label: h.label, numeric: h.numeric, phone: i === 0 ? "title" : undefined },
        cell: ({ row }) => (i === 0 ? <span className="font-medium">{row.original.cells[i]}</span> : row.original.cells[i]),
      })),
    [head],
  );
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      getRowId={(r) => r.key}
      pageSize={25}
      hideViewOptions
      emptyState={<EmptyState icon={BarChart3} title={empty} />}
    />
  );
}
