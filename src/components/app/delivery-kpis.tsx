import { useTranslation } from "react-i18next";
import { Bike, Coins, PackageX, Receipt, Store, Truck, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConciseValue, LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtMoneyCompact, fmtNumber } from "@/lib/format";
import type { DeliverySalesReport } from "@/data/api/generated/models/deliverySalesReport";

const accentChip: Record<string, string> = {
  brand: "bg-brand/10 text-brand",
  primary: "bg-primary/10 text-primary",
};

const CHANNEL_META: Record<string, { labelKey: string; fallback: string; icon: typeof Store; accent: string }> = {
  in_mall: { labelKey: "delivery.inMall", fallback: "In-mall delivery", icon: Store, accent: "brand" },
  outside: { labelKey: "delivery.outside", fallback: "Outside delivery", icon: Bike, accent: "primary" },
};

/**
 * Delivery + per-channel KPIs. Pure presentation — the caller fetches the
 * `DeliverySalesReport` (via `useBranchDeliverySales`) and passes it in, so the
 * same block renders identically on the dashboard and the Orders screen.
 */
export function DeliveryKpis({
  data,
  loading,
  className,
}: {
  data?: DeliverySalesReport;
  loading?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  // Totals reuse the shared ledger strip — which renders concise numbers on
  // narrow/mobile cells and full numbers on wider ones.
  const totals: LedgerItem[] = [
    { key: "rev", label: t("delivery.revenue", "Delivery revenue"), icon: Coins, accent: "brand", value: data?.total_revenue ?? 0, formatType: "money", loading },
    { key: "orders", label: t("delivery.deliveredOrders", "Delivered orders"), icon: Receipt, accent: "primary", value: data?.total_orders ?? 0, formatType: "number", loading },
    { key: "avg", label: t("dashboard.avgTicket", "Avg ticket"), icon: TrendingUp, accent: "info", value: data?.avg_order_value ?? 0, formatType: "money", loading },
    { key: "fees", label: t("delivery.fees", "Delivery fees"), icon: Truck, accent: "success", value: data?.total_delivery_fees ?? 0, formatType: "money", loading },
  ];

  const channels = data?.channels ?? [];
  const maxRev = Math.max(1, ...channels.map((c) => c.revenue));

  return (
    <div className={cn("space-y-4", className)}>
      <LedgerStrip items={totals} />

      {/* Per-channel breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(loading ? [{ channel: "in_mall" }, { channel: "outside" }] : channels).map((c) => {
          const meta = CHANNEL_META[c.channel] ?? { labelKey: "", fallback: c.channel, icon: Store, accent: "brand" };
          const full = "revenue" in c ? c : undefined;
          const share = full ? Math.round((full.revenue / (data?.total_revenue || 1)) * 100) : 0;
          return (
            <Card key={c.channel} className="gap-3 p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", accentChip[meta.accent] ?? accentChip.brand)}>
                  <meta.icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t(meta.labelKey, meta.fallback)}</p>
                  <p className="text-xs text-muted-foreground">
                    {loading ? "—" : `${fmtNumber(full?.orders ?? 0)} ${t("delivery.deliveredOrders", "Delivered orders").toLowerCase()}`}
                  </p>
                </div>
                <span className="shrink-0 tabular text-xs text-muted-foreground">{loading ? "" : `${share}%`}</span>
              </div>

              <div className="truncate text-2xl font-semibold tabular">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <ConciseValue full={fmtMoney(full?.revenue ?? 0)} compact={fmtMoneyCompact(full?.revenue ?? 0)} />
                )}
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                {!loading && full ? (
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, (full.revenue / maxRev) * 100)}%` }} />
                ) : null}
              </div>

              {!loading && full ? (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="size-3.5" /> {t("delivery.fees", "Delivery fees")}: <span className="tabular text-foreground">{fmtMoney(full.delivery_fees)}</span>
                  </span>
                  {full.cancelled_orders > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-warning">
                      <PackageX className="size-3.5" /> {fmtNumber(full.cancelled_orders)} {t("delivery.cancelled", "cancelled")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
