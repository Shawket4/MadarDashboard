import { useTranslation } from "react-i18next";
import { Award, DollarSign, Layers, ShoppingBag } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useBundlePerformance } from "@/data/api/generated/api";
import type { BundleWithComponents } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";

function Metric({ label, value, icon: Icon, className }: { label: string; value: string | number; icon: typeof Award; className?: string }) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted/20 p-3.5">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`mt-1 block text-2xl font-bold tabular ${className ?? ""}`}>{value}</span>
      <Icon className="absolute bottom-2 end-2 size-6 text-muted-foreground/10" />
    </div>
  );
}

export function PerformanceDialog({ bundle, onClose }: { bundle: BundleWithComponents; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const { data: perf, isLoading } = useBundlePerformance(bundle.id, undefined, { query: { enabled: !!bundle.id } });

  const data = (perf?.component_popularity ?? []).map((c) => ({ name: c.item_name, sales: c.quantity_sold }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bundle.name} — {t("bundles.performance.title", "Performance")}</DialogTitle>
          <DialogDescription>{t("bundles.subtitle", "Combo deals that group items at a special price")}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Metric label={t("bundles.performance.sales", "Sales")} value={perf?.sales_volume ?? 0} icon={ShoppingBag} />
              <Metric label={t("bundles.performance.revenue", "Revenue")} value={fmtMoney(perf?.gross_revenue ?? 0)} icon={DollarSign} className="text-primary" />
              <Metric label={t("bundles.performance.profit", "Profit")} value={fmtMoney(perf?.net_profit ?? 0)} icon={Award} className="text-success" />
            </div>
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
                      <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${(i % 6) + 1})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t("common.close", "Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
