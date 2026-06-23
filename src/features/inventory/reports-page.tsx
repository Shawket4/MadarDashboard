import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, Store } from "lucide-react";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useBranchConsumption, useBranchInventoryValuation, useBranchMenuEngineering, useBranchShrinkage,
  useBranchWasteReport, useListCatalog, useOrgConsumption, useOrgInventoryValuation, useOrgShrinkage,
  useOrgWasteReport,
} from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope, ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtShare, fmtUnit } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";

type ReportScope = "branch" | "org";
type CostBasis = "snapshot" | "current";

export function ReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, from, to } = useScope();

  const [scope, setScope] = useState<ReportScope>(branchId ? "branch" : "org");
  const [tab, setTab] = useState("valuation");
  const [costBasis, setCostBasis] = useState<CostBasis>("snapshot");

  const isBranch = scope === "branch";
  const scopeId = isBranch ? branchId : orgId;
  const range = { from: from ?? undefined, to: to ?? undefined };
  const on = (key: string) => tab === key && !!scopeId;

  // Valuation
  const branchVal = useBranchInventoryValuation(branchId ?? "", { query: { enabled: isBranch && on("valuation") && !!branchId } });
  const orgVal = useOrgInventoryValuation(orgId ?? "", { query: { enabled: !isBranch && on("valuation") && !!orgId } });
  const valuation = isBranch ? branchVal : orgVal;
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: on("valuation") && !!orgId } });

  // COGS / menu engineering has no org variant — in org scope the all-branches
  // sentinel gives the org-wide roll-up; in branch scope it's that branch.
  const cogsBranch = isBranch ? (branchId ?? "") : ALL_BRANCHES_ID;
  const cogs = useBranchMenuEngineering(cogsBranch, { ...range, cost_basis: costBasis }, { query: { enabled: on("cogs") && !!cogsBranch } });

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
    for (const c of catalog.data ?? []) cat.set(c.id, c.category);
    const sums = new Map<string, number>();
    for (const it of valuation.data?.items ?? []) {
      if (it.value == null) continue;
      const key = cat.get(it.org_ingredient_id) ?? "general";
      sums.set(key, (sums.get(key) ?? 0) + it.value);
    }
    const rows = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    const max = rows.reduce((m, [, v]) => Math.max(m, v), 0);
    return { rows, max };
  }, [catalog.data, valuation.data]);

  // Export the currently-visible report tab.
  const handleExport = () => {
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
      rows = byCategory.rows.map(([cat, val]) => ({ category: t(`inventory.catalog.cat_${cat}`, cat), value: val }));
    } else if (tab === "cogs") {
      title = t("inventory.reports.cogs", "COGS & margins");
      cols = [
        { header: item, accessor: (r) => r.item, type: "text", width: 28 },
        { header: t("inventory.reports.sold", "Sold"), accessor: (r) => r.sold, type: "number", width: 12 },
        { header: t("inventory.reports.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money", width: 14 },
        { header: t("inventory.reports.cost", "Cost"), accessor: (r) => r.cost, type: "money", width: 14 },
        { header: t("inventory.reports.profit", "Profit"), accessor: (r) => r.profit, type: "money", width: 14 },
      ];
      rows = (cogs.data?.rows ?? []).map((r) => ({
        item: r.size_label !== "one_size" ? `${r.item_name} · ${r.size_label}` : r.item_name,
        sold: r.quantity_sold, revenue: r.sales, cost: r.total_cost, profit: r.total_profit,
      }));
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
    void exportToExcel({ filename: `Sufrix-${title}`, sheets: [{ name: title, title, subtitle: scopeLabel, rows: rows as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  const currentCount =
    tab === "valuation" ? byCategory.rows.length
      : tab === "cogs" ? (cogs.data?.rows?.length ?? 0)
        : tab === "consumption" ? (consumption.data?.length ?? 0)
          : tab === "shrinkage" ? (shrinkage.data?.length ?? 0)
            : (wasteReport.data?.length ?? 0);

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.reports.title", "Inventory reports")}</h1>
        </div>
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  const branchGate = isBranch && !branchId;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("inventory.reports.title", "Inventory reports")}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={branchGate || !currentCount} />
          <SegmentedControl<ReportScope>
            value={scope}
            onChange={setScope}
            options={[
              { value: "branch", label: t("inventory.reports.branch", "This branch") },
              { value: "org", label: t("inventory.reports.org", "Whole organization") },
            ]}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <PageTabsList>
          <PageTabsTrigger value="valuation">{t("inventory.reports.valuation", "Valuation")}</PageTabsTrigger>
          <PageTabsTrigger value="cogs">{t("inventory.reports.cogs", "COGS & margins")}</PageTabsTrigger>
          <PageTabsTrigger value="consumption">{t("inventory.reports.consumption", "Consumption")}</PageTabsTrigger>
          <PageTabsTrigger value="shrinkage">{t("inventory.reports.shrinkage", "Shrinkage")}</PageTabsTrigger>
          <PageTabsTrigger value="waste">{t("inventory.reports.wasteReport", "Waste")}</PageTabsTrigger>
        </PageTabsList>

        {branchGate ? (
          <EmptyState icon={Store} title={t("inventory.pickBranch", "Select a branch to manage its stock")} />
        ) : (
          <>
            {/* Valuation */}
            <TabsContent value="valuation" className="space-y-4">
              <LedgerStrip
                className="sm:max-w-md"
                items={[
                  { key: "value", label: t("inventory.reports.totalValue", "Total value"), value: valuation.data?.total_value ?? 0, formatType: "money", accent: "brand", loading: valuation.isLoading },
                  { key: "unknown", label: t("inventory.reports.unknownCost", { count: valuation.data?.unknown_cost_count ?? 0, defaultValue: "unknown cost" }), value: valuation.data?.unknown_cost_count ?? 0, loading: valuation.isLoading },
                ] satisfies LedgerItem[]}
              />
              <Card>
                <CardHeader><CardTitle className="text-base">{t("inventory.reports.byCategory", "By category")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {byCategory.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("inventory.reports.noData", "No data")}</p>
                  ) : byCategory.rows.map(([cat, val]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{t(`inventory.catalog.cat_${cat}`, cat)}</span>
                        <span className="tabular">{fmtMoney(val)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${byCategory.max ? (val / byCategory.max) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COGS & margins */}
            <TabsContent value="cogs" className="space-y-3">
              {!scopeId ? (
                <EmptyState icon={Store} title={t("inventory.pickBranch", "Select a branch to manage its stock")} description={t("inventory.reports.branch", "This branch")} />
              ) : (
                <>
                  <SegmentedControl<CostBasis>
                    value={costBasis}
                    onChange={setCostBasis}
                    options={[
                      { value: "snapshot", label: t("inventory.reports.snapshot", "Snapshot") },
                      { value: "current", label: t("inventory.reports.current", "Current") },
                    ]}
                  />
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("inventory.reports.ingredient", "Item")}</TableHead>
                          <TableHead className="text-end">{t("inventory.reports.sold", "Sold")}</TableHead>
                          <TableHead className="text-end">{t("inventory.reports.revenue", "Revenue")}</TableHead>
                          <TableHead className="text-end">{t("inventory.reports.cost", "Cost")}</TableHead>
                          <TableHead className="text-end">{t("inventory.reports.margin", "Margin")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(cogs.data?.rows ?? []).map((r) => (
                          <TableRow key={`${r.menu_item_id}-${r.size_label}`}>
                            <TableCell>{r.item_name}{r.size_label !== "one_size" ? <span className="text-muted-foreground"> · {r.size_label}</span> : null}</TableCell>
                            <TableCell className="text-end tabular">{fmtNumber(r.quantity_sold)}</TableCell>
                            <TableCell className="text-end tabular">{fmtMoney(r.sales)}</TableCell>
                            <TableCell className="text-end tabular">{fmtMoney(r.total_cost)}</TableCell>
                            <TableCell className="text-end tabular">{r.sales > 0 ? fmtShare(r.total_profit, r.sales) : "—"}</TableCell>
                          </TableRow>
                        ))}
                        {(cogs.data?.rows ?? []).length === 0 && !cogs.isLoading ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("inventory.reports.noData", "No data")}</TableCell></TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Consumption */}
            <TabsContent value="consumption">
              <ReportTable
                loading={consumption.isLoading}
                empty={t("inventory.reports.noData", "No data")}
                head={[t("inventory.reports.ingredient", "Item"), t("inventory.reports.qty", "Quantity"), t("inventory.reports.consumedValue", "Consumed value")]}
                rows={(consumption.data ?? []).map((r) => ({
                  key: r.org_ingredient_id,
                  cells: [r.ingredient_name, `${fmtNumber(r.consumed_qty)} ${fmtUnit(r.unit)}`, fmtMoney(r.consumed_value)],
                }))}
              />
            </TabsContent>

            {/* Shrinkage */}
            <TabsContent value="shrinkage">
              <ReportTable
                loading={shrinkage.isLoading}
                empty={t("inventory.reports.noData", "No data")}
                head={[t("inventory.reports.ingredient", "Item"), t("inventory.reports.reason", "Reason"), t("inventory.reports.qty", "Quantity"), t("inventory.reports.value", "Value")]}
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
                loading={wasteReport.isLoading}
                empty={t("inventory.reports.noData", "No data")}
                head={[t("inventory.reports.ingredient", "Item"), t("inventory.reports.reason", "Reason"), t("inventory.reports.qty", "Quantity"), t("inventory.reports.wasteValue", "Waste value")]}
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

function ReportTable({ head, rows, loading, empty }: {
  head: string[];
  rows: { key: string; cells: (string | number)[] }[];
  loading?: boolean;
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>{head.map((h, i) => <TableHead key={i} className={i === 0 ? "" : "text-end"}>{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, ri) => (
              <TableRow key={`sk-${ri}`}>
                {head.map((_, ci) => <TableCell key={ci}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={head.length} className="text-center text-muted-foreground">{empty}</TableCell></TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.key}>
                {r.cells.map((c, i) => <TableCell key={i} className={i === 0 ? "" : "text-end tabular"}>{c}</TableCell>)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
