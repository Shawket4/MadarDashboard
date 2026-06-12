import { useTranslation } from "react-i18next";
import { Ban, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { useGetOrder } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { getTranslatedName } from "@/shared/lib/translation";
import { fmtDateTime, fmtMoney, fmtUnit } from "@/shared/lib/format";
import type { OrderFull } from "@/shared/api/generated/models/orderFull";

export function OrderDetailDrawer({ open, onClose, orderId, onVoid }: { open: boolean; onClose: () => void; orderId: string | null; onVoid: (o: OrderFull) => void }) {
  const { t, i18n } = useTranslation();
  const { getLabel } = usePaymentMethods();
  const { data: order, isLoading } = useGetOrder(orderId ?? "", { query: { enabled: !!orderId } });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent sheet="right" showClose={false} className="p-0">
        <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("orders.title")}</p>
            {order && <p className="font-bold">{t("orders.orderNumber", { n: order.order_number })}</p>}
          </div>
          <div className="flex gap-1">
            {order && order.status === "completed" && (
              <Button size="sm" variant="destructive" onClick={() => onVoid(order)}><Ban /> {t("orders.voidOrder")}</Button>
            )}
            <Button variant="ghost" size="iconSm" onClick={onClose}><X /></Button>
          </div>
        </div>

        {isLoading || !order ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : (
          <div className="p-4 space-y-4">
            {order.status === "voided" && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-2 text-sm">
                  <Ban className="text-destructive" size={16} />
                  <div>
                    <p className="font-bold text-destructive">{t("orderStatus.voided")}</p>
                    {order.void_reason && <p className="text-xs text-muted-foreground">{t(`orders.voidReasons.${order.void_reason}`, { defaultValue: order.void_reason })}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.date")}</span><span>{fmtDateTime(order.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("dashboard.teller")}</span><span>{order.teller_name}</span></div>
                {order.customer_name && <div className="flex justify-between"><span className="text-muted-foreground">{t("orders.customer")}</span><span>{order.customer_name}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">{t("orders.payment")}</span><Badge variant="outline">{getLabel(order.payment_method)}</Badge></div>
              </CardContent>
            </Card>

            {order.items && order.items.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("menu.items")}</p>
                  {order.items.map((it) => {
                    // Group deductions by bundle component
                    const groupedDeductions: Record<string, any[]> = {};
                    if (it.deductions_snapshot && Array.isArray(it.deductions_snapshot)) {
                      it.deductions_snapshot.forEach((d: any) => {
                        let grpName = "";
                        if (d.source && d.source.startsWith("bundle_component:")) {
                          grpName = d.source.substring("bundle_component:".length);
                        } else {
                          grpName = it.item_name;
                        }
                        if (!groupedDeductions[grpName]) {
                          groupedDeductions[grpName] = [];
                        }
                        groupedDeductions[grpName].push(d);
                      });
                    }

                    return (
                      <div key={it.id} className="py-2 border-b last:border-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm flex items-center flex-wrap gap-1">
                              {getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, i18n.language)}
                              {it.size_label && <span className="text-muted-foreground">({it.size_label})</span>}
                              {it.bundle_id && (
                                <Badge variant="default" className="px-1 py-0 text-xs uppercase font-bold tracking-wider leading-none">
                                  Combo
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">× {it.quantity} · {fmtMoney(it.unit_price)}</p>
                            {it.addons.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {it.addons.map((a) => (
                                  <p key={a.id} className="text-xs ps-2">+ {getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, i18n.language)} {a.quantity > 1 && `×${a.quantity}`}{a.line_total > 0 && <span className="text-muted-foreground ms-1">({fmtMoney(a.line_total)})</span>}</p>
                                ))}
                              </div>
                            )}
                            {it.optionals && it.optionals.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {it.optionals.map((o, idx) => {
                                  const optionName = getTranslatedName({ name: o.field_name || '', name_translations: o.name_translations }, i18n.language);
                                  if (!optionName) return null;
                                  const hasPrice = o.price > 0;
                                  return (
                                    <Badge
                                      key={idx}
                                      variant="warning"
                                      className="px-1.5 py-0.5 text-xs font-semibold rounded"
                                    >
                                      {optionName}{hasPrice && ` +${fmtMoney(o.price)}`}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            {it.bundle_components && it.bundle_components.length > 0 && (
                              <div className="mt-2 ps-3 border-l-2 border-muted space-y-2">
                                {it.bundle_components.map((c, cIdx) => (
                                  <div key={cIdx} className="space-y-0.5">
                                    <p className="text-xs font-semibold text-foreground">
                                      – {getTranslatedName({ name: c.item_name, name_translations: c.name_translations }, i18n.language)} {c.size_label && <span className="text-muted-foreground">({c.size_label})</span>}
                                      <span className="text-muted-foreground ms-1">× {c.quantity * it.quantity}</span>
                                    </p>
                                    {c.addons && c.addons.length > 0 && (
                                      <div className="space-y-0.5 ps-2">
                                        {c.addons.map((a, aIdx) => (
                                          <p key={aIdx} className="text-xs text-muted-foreground">
                                            + {getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, i18n.language)} {a.quantity > 1 && `×${a.quantity}`}{a.unit_price > 0 && <span className="ms-1">({fmtMoney(a.unit_price * a.quantity)})</span>}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                    {c.optionals && c.optionals.length > 0 && (
                                      <div className="flex flex-wrap gap-1 ps-2 mt-0.5">
                                        {c.optionals.map((o, oIdx) => (
                                          <Badge
                                            key={oIdx}
                                            variant="warning"
                                            className="px-1 py-0 text-[9px] font-semibold rounded"
                                          >
                                            {o.field_name}{o.price > 0 && ` +${fmtMoney(o.price)}`}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {it.notes && <p className="text-xs italic text-muted-foreground mt-1">{it.notes}</p>}
                          </div>
                          <div className="flex-shrink-0 text-end">
                            <span className="font-semibold tabular text-sm block">{fmtMoney(it.line_total)}</span>
                            <span className="text-xs text-muted-foreground tabular" title={it.cost_missing ? t("orders.costMissing") : undefined}>
                              {t("orders.cost")}: {fmtMoney(it.line_cost)}{it.cost_missing && " ⚠"}
                            </span>
                          </div>
                        </div>
                        {Array.isArray(it.deductions_snapshot) && it.deductions_snapshot.length > 0 && (
                          <details className="text-xs text-muted-foreground mt-2 border-t pt-1">
                            <summary className="cursor-pointer font-medium hover:text-foreground transition-colors py-0.5">
                              {t("orders.ingredientsUsed")} ({(it.deductions_snapshot as any[]).length})
                            </summary>
                            <div className="ps-3 mt-2 space-y-3">
                              {Object.entries(groupedDeductions).map(([compName, deductions]) => (
                                <div key={compName} className="space-y-1">
                                  <p className="font-semibold text-xs text-foreground flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {compName}
                                  </p>
                                  <div className="ps-2.5 border-l-2 border-muted space-y-0.5">
                                    {deductions.map((d: any, dIdx: number) => (
                                      <p key={dIdx} className="tabular text-xs">
                                        {d.ingredient_name}: {Number(d.quantity).toFixed(3)} {fmtUnit(d.unit)}
                                        <span className="text-xs text-muted-foreground ms-1.5 opacity-80">
                                          ({d.source === "drink_recipe" || d.source === "base"
                                            ? "base"
                                            : d.source.startsWith("bundle_component:")
                                            ? "combo base"
                                            : d.source.startsWith("optional:")
                                            ? d.source.substring("optional:".length)
                                            : d.source.startsWith("addon_swap:")
                                            ? d.source.substring("addon_swap:".length)
                                            : d.source})
                                        </span>
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><span className="tabular">{fmtMoney(order.subtotal)}</span></div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-success"><span>{t("orders.discountAmount")}</span><span className="tabular">−{fmtMoney(order.discount_amount)}</span></div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("orders.tax")}</span><span className="tabular">{fmtMoney(order.tax_amount)}</span></div>
                )}
                {order.tip_amount ? (
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("orders.tip")}</span><span className="tabular">{fmtMoney(order.tip_amount)}</span></div>
                ) : null}
                <div className="flex justify-between pt-2 mt-2 border-t font-bold">
                  <span>{t("common.total")}</span>
                  <span className="tabular text-primary text-lg">{fmtMoney(order.total_amount)}</span>
                </div>
                {order.amount_tendered && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>{t("orders.cashTendered")}</span><span className="tabular">{fmtMoney(order.amount_tendered)}</span></div>
                )}
                {order.change_given ? (
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{t("orders.changeGiven")}</span><span className="tabular">{fmtMoney(order.change_given)}</span></div>
                ) : null}
                {(() => {
                  const items = order.items ?? [];
                  if (items.length === 0) return null;
                  // missing cost is NEVER treated as zero — known lines form a lower bound
                  const knownCogs = items
                    .filter((li) => li.line_cost != null)
                    .reduce((s2, li) => s2 + (li.line_cost as number), 0);
                  const anyMissing = items.some((li) => li.cost_missing || li.line_cost == null);
                  const profit = order.total_amount - knownCogs;
                  const profitPct = order.total_amount > 0 ? profit / order.total_amount : null;
                  const missingCount = items.filter((li) => li.cost_missing || li.line_cost == null).length;
                  return (
                    <div
                      className="flex justify-between text-xs text-muted-foreground pt-2 mt-2 border-t"
                      title={anyMissing ? t("orders.costMissingLines", { count: missingCount }) : undefined}
                    >
                      <span>
                        {t("orders.cogs")}: {anyMissing ? "≥ " : ""}{fmtMoney(knownCogs)}
                      </span>
                      <span className="tabular">
                        {t("orders.grossProfit")}: {anyMissing ? "≤ " : ""}{fmtMoney(profit)}
                        {profitPct !== null && ` (${(profitPct * 100).toFixed(1)}%)`}
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

