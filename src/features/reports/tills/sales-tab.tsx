import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Receipt, TrendingUp, Wallet } from "lucide-react";

import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ProgressBar } from "@/components/app/progress-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtNumber, fmtShare } from "@/lib/format";
import type { TillSessionRow } from "@/data/api/generated/models";
import { fmtBusinessDate, salesStats } from "./lib";

/** A quarter of tills is thousands of sessions; the ranking is about its head. */
const TOP = 20;

export interface TillTabProps {
  rows: TillSessionRow[];
  loading: boolean;
  /** The failed load, if any (or a ready message) — an error must not read as "no sessions". */
  error?: unknown;
  onRetry?: () => void;
}

/**
 * What each drawer actually took. The ranked list is the point: a manager
 * wants to see which sessions carried the period, and a bar per row makes
 * "twice as much" legible without reading two figures and dividing.
 */
export function SalesTab({ rows, loading, error, onRetry }: TillTabProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const s = useMemo(() => salesStats(rows), [rows]);
  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.net_sales - a.net_sales),
    [rows],
  );

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <ErrorState message={typeof error === "string" ? error : getErrorMessage(error)} onRetry={onRetry} />;
  if (rows.length === 0) {
    return <EmptyState title={t("reports.tills.empty", "No till sessions opened in this period")} />;
  }

  const strip: LedgerItem[] = [
    {
      key: "sales",
      label: t("reports.tills.totalSales", "Net sales"),
      value: s.sales,
      formatType: "money",
      icon: Coins,
      accent: "brand",
    },
    {
      key: "orders",
      label: t("reports.tills.totalOrders", "Orders"),
      value: s.orders,
      formatType: "number",
      icon: Receipt,
    },
    {
      key: "aov",
      label: t("reports.tills.avgOrderValue", "Average bill"),
      value: s.avgOrderValue,
      formatType: "money",
      icon: TrendingUp,
    },
    {
      key: "perTill",
      label: t("reports.tills.avgPerTill", "Average per till"),
      value: s.avgSalesPerTill,
      formatType: "money",
      icon: Wallet,
      hint: t("reports.tills.acrossTills", {
        count: s.tills,
        defaultValue: "across {{count}} sessions",
      }),
    },
  ];

  const top = ranked[0]?.net_sales ?? 0;
  const shown = showAll ? ranked : ranked.slice(0, TOP);

  return (
    <div className="space-y-4">
      <LedgerStrip items={strip} />

      <Card className="py-0">
        <CardHeader className="pt-4">
          <CardTitle className="text-base">
            {t("reports.tills.bySession", "By session")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ul className="divide-y text-sm">
            {shown.map((r) => (
              <li key={r.till_id} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {r.teller_name}
                    {/* The day too: one teller opens many tills in a period. */}
                    <span className="font-normal text-muted-foreground">
                      {" · "}{r.branch_name}{" · "}{fmtBusinessDate(r.business_date)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{fmtMoney(r.net_sales)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {/* Against the best session, so the bars compare like with like. */}
                  <ProgressBar
                    className="flex-1"
                    value={r.net_sales}
                    max={top}
                    ariaLabel={t("reports.tills.barLabel", {
                      share: fmtShare(r.net_sales, top),
                      defaultValue: "{{share}} of the best session",
                    })}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {t("reports.tills.ordersShare", {
                      orders: fmtNumber(r.orders_count),
                      share: s.sales > 0 ? fmtShare(r.net_sales, s.sales) : "—",
                      defaultValue: "{{orders}} orders · {{share}}",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {ranked.length > TOP ? (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll((v) => !v)}>
              {showAll
                ? t("reports.tills.showTop", { count: TOP, defaultValue: "Show the top {{count}}" })
                : t("reports.tills.showAll", { count: ranked.length, defaultValue: "Show all {{count}} sessions" })}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
