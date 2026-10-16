import { useTranslation } from "react-i18next";

import { ChartCard } from "@/components/app/chart-card";
import { ProgressBar } from "@/components/app/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_MODE_ICON, serviceModeRows } from "@/features/orders/service-mode";
import type { ServiceModeSales } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { Stagger } from "@/lib/motion";

/**
 * Sales split by how the customer takes the order (Pickup / Dine in), from the
 * sales report's `by_service_mode`. On every plan. The two rows add up to the
 * report's revenue; delivery orders are Pickup, as they are on the order.
 */
export function ServiceModeSplit({
  rows,
  loading,
}: {
  rows: ReadonlyArray<ServiceModeSales> | undefined;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const split = serviceModeRows(rows);
  return (
    <ChartCard title={t("analytics.byServiceMode", "Pickup and Dine in")}>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : (
        <Stagger asChild>
          <ul className="grid gap-4 sm:grid-cols-2">
            {split.map((r) => {
              const Icon = SERVICE_MODE_ICON[r.mode];
              const label = t(`orders.serviceMode.${r.mode}`);
              return (
                <li key={r.mode} className="space-y-2" data-service-mode={r.mode}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon aria-hidden className="size-4 text-muted-foreground" />
                    {label}
                    <span className="ms-auto font-mono text-xs tabular text-muted-foreground">{fmtPercent(r.share)}</span>
                  </div>
                  <ProgressBar value={r.share} max={1} ariaLabel={t("analytics.serviceModeShare", { mode: label, defaultValue: "{{mode}} share of revenue" })} />
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-mono font-semibold tabular">{fmtMoney(r.revenue)}</span>
                    <span className="text-xs text-muted-foreground tabular">
                      {t("analytics.serviceModeOrders", { orders: fmtNumber(r.orders), defaultValue: "{{orders}} orders" })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Stagger>
      )}
    </ChartCard>
  );
}
