import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, BarChart2, Calculator, History, LayoutGrid, Receipt, Table2, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/shared/ui/stat-card";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import { useBranchMenuEngineering } from "@/shared/api/generated/api";
import { useScopedParams } from "@/shared/scope/use-scoped-params";
import { ScatterView } from "./scatter-view";
import { TableView } from "./table-view";

type View = "scatter" | "table";
type CostBasis = "snapshot" | "current";

/**
 * Menu Engineering — Foodics-style quadrant analysis over the scoped
 * branch + period. All monetary fields arrive as piastres and are
 * formatted via fmtMoney (÷100).
 *
 * Cost basis: "snapshot" (default) classifies on sale-time costs; "current"
 * reclassifies the same realized sales under today's ingredient costs —
 * useful right after editing costs in inventory.
 */
export function MenuEngineeringScreen() {
  const { t } = useTranslation();
  const { branchId, from, to } = useScopedParams();
  const [view, setView] = useState<View>("scatter");
  const [costBasis, setCostBasis] = useState<CostBasis>("snapshot");

  const { data: report, isLoading } = useBranchMenuEngineering(
    branchId ?? "",
    {
      from: from ?? undefined,
      to: to ?? undefined,
      // omit for the default so the URL stays clean
      cost_basis: costBasis === "current" ? "current" : undefined,
    },
    { query: { enabled: !!branchId } },
  );

  if (!branchId) return <EmptyState icon={BarChart2} title={t("orders.selectBranch")} />;
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }
  if (!report || report.rows.length === 0) {
    return <EmptyState icon={BarChart2} title={t("menuEngineering.empty")} description={t("menuEngineering.emptyHint")} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label={t("menuEngineering.totalSales")} value={report.total_sales} formatType="money" icon={Receipt} accent="success" />
        <StatCard label={t("menuEngineering.totalCogs")} value={report.total_cost} formatType="money" icon={Wallet} accent="info" />
        <StatCard label={t("menuEngineering.grossProfit")} value={report.total_profit} formatType="money" icon={TrendingUp} accent="violet" />
        {/* Informational only: cost-missing items are excluded from the
            report server-side — fix them via recipes/inventory. The sub
            shows the revenue those items carry, which is also why totals
            differ between the two cost bases. */}
        <StatCard
          label={t("menuEngineering.missingCosts")}
          value={report.rows_cost_missing}
          icon={AlertTriangle}
          accent="warning"
          sub={
            report.excluded_sales > 0
              ? t("menuEngineering.excludedRevenue", { amount: fmtMoney(report.excluded_sales) })
              : undefined
          }
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border p-0.5 bg-muted">
            {(
              [
                { key: "scatter", icon: LayoutGrid, label: t("menuEngineering.views.scatter") },
                { key: "table", icon: Table2, label: t("menuEngineering.views.table") },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded",
                  view === key ? "bg-background shadow-sm font-semibold" : "text-muted-foreground",
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border p-0.5 bg-muted">
            {(
              [
                { key: "snapshot", icon: History, label: t("menuEngineering.costBasis.snapshot") },
                { key: "current", icon: Calculator, label: t("menuEngineering.costBasis.current") },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setCostBasis(key)}
                title={key === "current" ? t("menuEngineering.costBasis.currentHint") : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded",
                  costBasis === key ? "bg-background shadow-sm font-semibold" : "text-muted-foreground",
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "scatter" ? <ScatterView rows={report.rows} /> : <TableView rows={report.rows} />}
    </div>
  );
}
