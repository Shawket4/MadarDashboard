import { useTranslation } from "react-i18next";
import { AlertTriangle, BarChart2, Calculator, History, LayoutGrid, Receipt, Table2, TrendingUp, Wallet } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { useBranchMenuEngineering } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { usePageSearch } from "@/data/scope/use-page-search";
import { ScatterView } from "./scatter-view";
import { TableView } from "./table-view";

type View = "scatter" | "table";
type CostBasis = "snapshot" | "current";

function Toggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; icon: typeof Receipt; label: string; title?: string }[] }) {
  return (
    <div className="flex rounded-lg border bg-muted p-0.5">
      {options.map(({ key, icon: Icon, label, title }) => (
        <button key={key} type="button" title={title} onClick={() => onChange(key)}
          className={cn("flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors", value === key ? "bg-background font-semibold shadow-sm" : "text-muted-foreground")}>
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

export function MenuEngineeringPage() {
  const { t } = useTranslation();
  const { scopeBranchId, from, to } = useScope();
  const [s, update] = usePageSearch<{ view: View; basis: CostBasis }>();
  const view = s.view ?? "scatter";
  const costBasis = s.basis ?? "snapshot";

  // Specific branch or the all-branches roll-up — the endpoint accepts both.
  const { data: report, isLoading } = useBranchMenuEngineering(
    scopeBranchId,
    { from: from ?? undefined, to: to ?? undefined, cost_basis: costBasis === "current" ? "current" : undefined },
    { query: { enabled: !!scopeBranchId } },
  );

  return (
    <Page>
      <PageHeader title={t("menuEngineering.title", "Menu Engineering")} description={t("menuEngineering.subtitle", "Profit vs popularity for every item")} />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      ) : !report || report.rows.length === 0 ? (
        <EmptyState icon={BarChart2} title={t("menuEngineering.empty", "No sales in this period")} description={t("menuEngineering.emptyHint", "Pick a different period or branch from the scope bar.")} />
      ) : (
        <div className="space-y-4">
          <LedgerStrip
            items={[
              { key: "sales", label: t("menuEngineering.totalSales", "Total Sales"), value: report.total_sales, formatType: "money", icon: Receipt, accent: "success" },
              { key: "cogs", label: t("menuEngineering.totalCogs", "Total COGS"), value: report.total_cost, formatType: "money", icon: Wallet, accent: "info" },
              { key: "profit", label: t("menuEngineering.grossProfit", "Gross Profit"), value: report.total_profit, formatType: "money", icon: TrendingUp, accent: "primary" },
              {
                key: "missing",
                label: t("menuEngineering.missingCosts", "Items missing costs"),
                value: report.rows_cost_missing,
                formatType: "number",
                icon: AlertTriangle,
                accent: "warning",
                hint: report.excluded_sales > 0 ? t("menuEngineering.excludedRevenue", { amount: fmtMoney(report.excluded_sales), defaultValue: `${fmtMoney(report.excluded_sales)} in sales excluded` }) : undefined,
              } satisfies LedgerItem,
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Toggle<View> value={view} onChange={(v) => update({ view: v })} options={[
              { key: "scatter", icon: LayoutGrid, label: t("menuEngineering.views.scatter", "Quadrant") },
              { key: "table", icon: Table2, label: t("menuEngineering.views.table", "Table") },
            ]} />
            <Toggle<CostBasis> value={costBasis} onChange={(v) => update({ basis: v })} options={[
              { key: "snapshot", icon: History, label: t("menuEngineering.costBasis.snapshot", "As sold") },
              { key: "current", icon: Calculator, label: t("menuEngineering.costBasis.current", "Current costs"), title: t("menuEngineering.costBasis.currentHint", "Reclassified with today's ingredient costs") },
            ]} />
          </div>

          {view === "scatter" ? <ScatterView rows={report.rows} /> : <TableView rows={report.rows} />}
        </div>
      )}
    </Page>
  );
}
