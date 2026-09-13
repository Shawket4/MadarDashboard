import { useTranslation } from "react-i18next";
import { Bike, Coins, Receipt, Store, TrendingUp, Truck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConciseValue, LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatusPill } from "@/components/app/status-pill";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtShare } from "@/lib/format";
import type { DeliverySalesReport } from "@/data/api/generated/models/deliverySalesReport";

const CHANNEL_META: Record<string, { labelKey: string; fallback: string; icon: typeof Store }> = {
  in_mall: { labelKey: "delivery.inMall", fallback: "In-mall delivery", icon: Store },
  outside: { labelKey: "delivery.outside", fallback: "Outside delivery", icon: Bike },
};

/**
 * The Orders screen's delivery block: totals as quiet stat cards, then one
 * card per channel. No coloured tiles — the glyph is a muted mark, and the
 * only tint is a cancellation count, which means something.
 */
export function DeliveryChannels({ data, loading }: { data?: DeliverySalesReport; loading?: boolean }) {
  const { t } = useTranslation();

  const totals: LedgerItem[] = [
    { key: "rev", label: t("delivery.revenue", "Delivery revenue"), icon: Coins, value: data?.total_revenue ?? 0, formatType: "money", loading },
    { key: "orders", label: t("delivery.deliveredOrders", "Delivered orders"), icon: Receipt, value: data?.total_orders ?? 0, formatType: "number", loading },
    { key: "avg", label: t("dashboard.avgTicket", "Avg ticket"), icon: TrendingUp, value: data?.avg_order_value ?? 0, formatType: "money", loading },
    { key: "fees", label: t("delivery.fees", "Delivery fees"), icon: Truck, value: data?.total_delivery_fees ?? 0, formatType: "money", loading },
  ];

  const channels = data?.channels ?? [];
  const maxRev = Math.max(1, ...channels.map((c) => c.revenue));

  return (
    <div className="space-y-3">
      <LedgerStrip items={totals} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {loading
          ? [0, 1].map((i) => (
              <Card key={i} className="gap-3 rounded-2xl p-5 shadow-none">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-1.5 w-full" />
              </Card>
            ))
          : channels.map((c) => {
              const meta = CHANNEL_META[c.channel] ?? { labelKey: "", fallback: c.channel, icon: Store };
              return (
                <Card key={c.channel} className="gap-3 rounded-2xl p-5 shadow-none">
                  <div className="flex items-center gap-2">
                    <meta.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                      {t(meta.labelKey, meta.fallback)}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {fmtShare(c.revenue, data?.total_revenue ?? 0)}
                    </span>
                  </div>

                  <div className="truncate font-mono text-2xl leading-none font-semibold tracking-tight tabular-nums">
                    <ConciseValue full={fmtMoney(c.revenue)} compact={fmtMoneyCompact(c.revenue)} />
                  </div>

                  <ProgressBar
                    value={Math.max(maxRev * 0.02, c.revenue)}
                    max={maxRev}
                    accent="primary"
                    ariaLabel={t("delivery.revenueShare", "Revenue share")}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {t("delivery.deliveredOrders", "Delivered orders")}{" "}
                        <bdi className="font-mono text-foreground tabular-nums">{fmtNumber(c.orders)}</bdi>
                      </span>
                      <span>
                        {t("delivery.fees", "Delivery fees")}{" "}
                        <bdi className="font-mono text-foreground tabular-nums">{fmtMoney(c.delivery_fees)}</bdi>
                      </span>
                    </span>
                    {c.cancelled_orders > 0 ? (
                      <StatusPill tone="warning" size="sm">
                        <bdi className="font-mono tabular-nums">{fmtNumber(c.cancelled_orders)}</bdi> {t("delivery.cancelled", "cancelled")}
                      </StatusPill>
                    ) : null}
                  </div>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
