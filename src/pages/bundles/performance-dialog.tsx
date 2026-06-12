import { useTranslation } from "react-i18next";
import { TrendingUp, DollarSign, ShoppingBag, Award, Layers, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Cell } from "recharts";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

import { useBundlePerformance } from "@/shared/api/generated/api";
import { fmtMoney } from "@/shared/lib/format";
import type { BundleWithComponents } from "@/shared/api/generated/models/bundleWithComponents";

// ── Interactive Performance Metrics Dialog ───────────────────────────────────
interface PerformanceDialogProps {
  open: boolean;
  onClose: () => void;
  bundle: BundleWithComponents | null;
}

export function PerformanceDialog({ open, onClose, bundle }: PerformanceDialogProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { data: perf, isLoading } = useBundlePerformance(bundle?.id ?? "", undefined, { query: { enabled: !!bundle?.id } });

  const componentData = perf?.component_popularity.map((c) => ({
    name: c.item_name,
    sales: c.quantity_sold,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="text-primary animate-pulse" /> {bundle?.name} — {t("bundles.performance.title")}
          </DialogTitle>
          <DialogDescription>{t("bundles.subtitle")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Activity className="animate-spin text-primary" size={32} />
              <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              {/* Three Stat Cards inside Performance Panel */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">{t("bundles.performance.sales")}</span>
                    <span className="text-2xl font-black mt-1 block tabular">{perf?.sales_volume ?? 0}</span>
                  </div>
                  <ShoppingBag size={24} className="absolute end-2 bottom-2 text-muted-foreground/10" />
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">{t("bundles.performance.revenue")}</span>
                    <span className="text-2xl font-black mt-1 block tabular text-primary">{fmtMoney(perf?.gross_revenue)}</span>
                  </div>
                  <DollarSign size={24} className="absolute end-2 bottom-2 text-primary/10" />
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">{t("bundles.performance.profit")}</span>
                    <span className="text-2xl font-black mt-1 block tabular text-emerald-500">{fmtMoney(perf?.net_profit)}</span>
                  </div>
                  <Award size={24} className="absolute end-2 bottom-2 text-emerald-500/10" />
                </div>
              </div>

              {/* Component Popularity Horizontal Bar Chart */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers size={13} /> {t("bundles.performance.popularity")}
                </h4>
                {componentData.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8 border rounded-xl bg-muted/10">{t("common.noResults")}</p>
                ) : (
                  <div className="h-64 border rounded-xl p-4 bg-muted/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={componentData} layout="vertical" margin={{ left: isAr ? 0 : 20, right: isAr ? 20 : 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="p-2 border rounded-lg bg-background text-foreground text-xs shadow-md font-medium">
                                  <p>{payload[0].payload.name}</p>
                                  <p className="text-primary font-bold mt-0.5">{t("bundles.performance.sold", { qty: payload[0].value })}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="sales" fill="var(--color-primary, #c25b3f)" radius={[0, 4, 4, 0]}>
                          {componentData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(22, 60%, ${50 - index * 6}%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

