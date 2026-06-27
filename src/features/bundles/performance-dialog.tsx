import { useTranslation } from "react-i18next";
import { AlertCircle, Award, DollarSign, Layers, ShoppingBag } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useBundlePerformance } from "@/data/api/generated/api";
import type { BundleWithComponents } from "@/data/api/generated/models";

export function PerformanceDialog({ bundle, onClose }: { bundle: BundleWithComponents; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const reducedMotion = useReducedMotion();
  const { data: perf, isLoading, isError, refetch } = useBundlePerformance(bundle.id, undefined, { query: { enabled: !!bundle.id } });

  const data = (perf?.component_popularity ?? []).map((c) => ({ name: c.item_name, sales: c.quantity_sold }));

  const metrics: LedgerItem[] = [
    { key: "sales", label: t("bundles.performance.sales", "Sales"), value: perf?.sales_volume ?? 0, formatType: "number", icon: ShoppingBag, accent: "info", loading: isLoading },
    { key: "revenue", label: t("bundles.performance.revenue", "Revenue"), value: perf?.gross_revenue ?? 0, formatType: "money", icon: DollarSign, accent: "primary", loading: isLoading },
    { key: "profit", label: t("bundles.performance.profit", "Profit"), value: perf?.net_profit ?? 0, formatType: "money", icon: Award, accent: "success", loading: isLoading },
  ];

  // RTL: filled end is on the left, so radius flips to [4,0,0,4] in Arabic.
  const barRadius: [number, number, number, number] = isAr ? [4, 0, 0, 4] : [0, 4, 4, 0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bundle.name} — {t("bundles.performance.title", "Performance")}</DialogTitle>
          <DialogDescription>{t("bundles.subtitle", "Combo deals that group items at a special price")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <LedgerStrip items={metrics} />
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm font-medium">{t("bundles.performance.loadError", "Could not load performance data")}</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>{t("common.retry", "Retry")}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers className="size-3.5" /> {t("bundles.performance.popularity", "Component popularity")}
              </h4>
              {data.length === 0 ? (
                <p className="rounded-xl border bg-muted/10 py-8 text-center text-xs text-muted-foreground">{t("common.noResults", "No results found")}</p>
              ) : (
                <div className="h-64 rounded-xl border bg-muted/5 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: isAr ? 0 : 20, right: isAr ? 20 : 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                      <ReTooltip
                        cursor={{ fill: "var(--muted)" }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border bg-background p-2 text-xs font-medium shadow-md">
                              <p>{payload[0].payload.name}</p>
                              <p className="mt-0.5 font-bold text-primary">{t("bundles.performance.sold", { qty: payload[0].value, defaultValue: `${payload[0].value} sold` })}</p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="sales" radius={barRadius} isAnimationActive={!reducedMotion}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${(i % 6) + 1})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.close", "Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
