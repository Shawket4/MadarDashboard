import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Receipt, TrendingUp, Wallet } from "lucide-react";

import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney, fmtNumber, fmtShare } from "@/lib/format";
import type { TillSessionRow } from "@/data/api/generated/models";
import { salesStats } from "./lib";

/**
 * What each drawer actually took. The ranked list is the point: a manager
 * wants to see which sessions carried the period, and a bar per row makes
 * "twice as much" legible without reading two figures and dividing.
 */
export function SalesTab({ rows, loading }: { rows: TillSessionRow[]; loading: boolean }) {
  const { t } = useTranslation();
  const s = useMemo(() => salesStats(rows), [rows]);
  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.gross_sales - a.gross_sales),
    [rows],
  );

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (rows.length === 0) {
    return <EmptyState title={t("reports.tills.empty", "No till sessions opened in this period")} />;
  }

  const strip: LedgerItem[] = [
    {
      key: "sales",
      label: t("reports.tills.totalSales", "Sales"),
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

  const top = ranked[0]?.gross_sales ?? 0;

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
            {ranked.map((r) => (
              <li key={r.till_id} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {r.teller_name}
                    <span className="text-muted-foreground"> · {r.branch_name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{fmtMoney(r.gross_sales)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {/* Share of the best session, so the bars compare like with like. */}
                  <div
                    aria-hidden
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: top > 0 ? `${(r.gross_sales / top) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {t("reports.tills.ordersShare", {
                      orders: fmtNumber(r.orders_count),
                      share: s.sales > 0 ? fmtShare(r.gross_sales, s.sales) : "—",
                      defaultValue: "{{orders}} orders · {{share}}",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
