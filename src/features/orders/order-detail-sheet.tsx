import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Ban, X } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrder, useListCatalog } from "@/data/api/generated/api";
import type { OrderFull } from "@/data/api/generated/models";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { fmtDateTimeFull, fmtMoney, fmtUnit } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { cn } from "@/lib/utils";

interface Deduction {
  ingredient_name: string;
  quantity: number;
  unit: string;
  source?: string;
  org_ingredient_id?: string | null;
  cost?: number | null;
}

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoid?: (order: OrderFull) => void;
}

export function OrderDetailSheet({ orderId, open, onOpenChange, onVoid }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const orgId = role === "super_admin" ? selectedOrgId : (userOrgId ?? null);

  const { data: order, isLoading } = useGetOrder(orderId ?? "", { query: { enabled: !!orderId && open } });
  const { data: catalog } = useListCatalog(orgId ?? "", {
    query: { enabled: open && !!orgId, staleTime: 5 * 60_000 },
  });

  // ingredient id → cost per unit (piastres), to price the deduction snapshot.
  const costPerUnit = useMemo(() => {
    const m = new Map<string, number>();
    for (const ing of catalog ?? []) if (ing.cost_per_unit != null) m.set(ing.id, ing.cost_per_unit);
    return m;
  }, [catalog]);

  const deductionCost = (d: Deduction): number | null => {
    if (d.cost != null) return d.cost;
    if (d.org_ingredient_id && costPerUnit.has(d.org_ingredient_id)) {
      return d.quantity * (costPerUnit.get(d.org_ingredient_id) as number);
    }
    return null;
  };

  const voided = order?.status === "voided";
  const items = order?.items ?? [];
  const isDelivery = order?.order_type === "delivery";
  const delivery = order?.delivery ?? null;
  const channelLabel = (channel: string) =>
    channel === "in_mall" ? t("delivery.channelInMall", "In-mall") : t("delivery.channelOutside", "Delivery");
  const addressParts = delivery
    ? [
        delivery.place_name,
        delivery.address_line,
        delivery.landmark,
        delivery.floor ? `${t("orders.floor", "Floor")} ${delivery.floor}` : null,
        delivery.unit_number ? `${t("orders.unit", "Unit")} ${delivery.unit_number}` : null,
      ].filter((p): p is string => !!p && p.trim().length > 0)
    : [];

  // COGS / gross-profit summary — missing line costs are a lower bound, never zero.
  const knownCogs = items.filter((li) => li.line_cost != null).reduce((s, li) => s + (li.line_cost ?? 0), 0);
  const anyMissing = items.some((li) => li.cost_missing || li.line_cost == null);
  const profit = (order?.total_amount ?? 0) - knownCogs;
  const profitPct = order && order.total_amount > 0 ? profit / order.total_amount : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 border-b bg-background">
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2">
              {order ? (order.order_ref ?? `#${order.order_number}`) : t("orders.order", "Order")}
              {order ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize",
                    voided ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
                  )}
                >
                  {t(`orderStatus.${order.status}`, order.status)}
                </Badge>
              ) : null}
              {isDelivery ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {delivery ? channelLabel(delivery.channel) : t("orders.delivery", "Delivery")}
                </Badge>
              ) : null}
            </SheetTitle>
            <SheetDescription>{order ? fmtDateTimeFull(order.created_at) : t("common.loading", "Loading…")}</SheetDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {order && order.status === "completed" && onVoid ? (
              <Button size="sm" variant="destructive" onClick={() => onVoid(order)}>
                <Ban className="size-4" />
                {t("orders.void", "Void order")}
              </Button>
            ) : null}
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t("common.close", "Close")}>
                <X className="size-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {isLoading || !order ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {voided && order.void_reason ? (
                <Card className="border-destructive/30 bg-destructive/5 py-0">
                  <CardContent className="flex items-center gap-2 p-4 text-sm">
                    <Ban className="size-4 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">{t("orderStatus.voided", "Voided")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`orders.voidReasons.${order.void_reason}`, { defaultValue: order.void_reason })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="py-0">
                <CardContent className="space-y-2 p-4 text-sm">
                  <Row label={t("common.date", "Date")} value={fmtDateTimeFull(order.created_at)} />
                  <Row label={t("shifts.teller", "Teller")} value={order.teller_name} />
                  {order.customer_name ? <Row label={t("orders.customer", "Customer")} value={order.customer_name} /> : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{t("orders.payment", "Payment")}</span>
                    <Badge variant="outline">{t(`payments.${order.payment_method}`, order.payment_method)}</Badge>
                  </div>
                </CardContent>
              </Card>

              {delivery ? (
                <Card className="border-primary/20 bg-primary/[0.03] py-0">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("orders.deliveryInfo", "Delivery")}
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {channelLabel(delivery.channel)}
                      </Badge>
                    </p>
                    <Row label={t("orders.phone", "Phone")} value={delivery.customer_phone} />
                    {addressParts.length > 0 ? (
                      <Row label={t("orders.address", "Address")} value={addressParts.join(" · ")} />
                    ) : null}
                    {delivery.delivery_notes ? (
                      <Row label={t("orders.deliveryNotes", "Notes")} value={delivery.delivery_notes} />
                    ) : null}
                    {delivery.zone_name ? <Row label={t("orders.zone", "Zone")} value={delivery.zone_name} /> : null}
                    {delivery.road_distance_meters != null ? (
                      <Row
                        label={t("orders.distance", "Distance")}
                        value={`${(delivery.road_distance_meters / 1000).toFixed(1)} ${t("delivery.kmUnit", "km")}`}
                      />
                    ) : null}
                    {delivery.delivery_ref ? (
                      <Row label={t("orders.deliveryRef", "Delivery ref")} value={delivery.delivery_ref} />
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {items.length > 0 ? (
                <Card className="py-0">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("menu.items", "Items")}
                    </p>
                    {items.map((it) => {
                      const deductions = (Array.isArray(it.deductions_snapshot) ? it.deductions_snapshot : []) as Deduction[];
                      return (
                        <div key={it.id} className="space-y-1 border-b py-2 last:border-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-1 text-sm font-semibold">
                                {getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang)}
                                {it.size_label ? <span className="text-muted-foreground">({it.size_label})</span> : null}
                                {it.bundle_id ? (
                                  <Badge className="px-1 py-0 text-[10px] uppercase">{t("orders.combo", "Combo")}</Badge>
                                ) : null}
                              </p>
                              <p className="text-xs text-muted-foreground tabular">
                                × {it.quantity} · {fmtMoney(it.unit_price)}
                              </p>

                              {it.addons.length > 0 ? (
                                <div className="mt-1 space-y-0.5 ps-2">
                                  {it.addons.map((a) => (
                                    <p key={a.id} className="text-xs">
                                      + {getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, lang)}
                                      {a.quantity > 1 ? ` ×${a.quantity}` : ""}
                                      {a.line_total > 0 ? (
                                        <span className="ms-1 text-muted-foreground tabular">({fmtMoney(a.line_total)})</span>
                                      ) : null}
                                    </p>
                                  ))}
                                </div>
                              ) : null}

                              {it.optionals?.length ? (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {it.optionals.map((o) => {
                                    const name = getTranslatedName({ name: o.field_name, name_translations: o.name_translations }, lang);
                                    if (!name) return null;
                                    return (
                                      <Badge key={o.id} className="rounded bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">
                                        {name}
                                        {o.price > 0 ? ` +${fmtMoney(o.price)}` : ""}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : null}

                              {it.bundle_components?.length ? (
                                <div className="mt-2 space-y-2 border-s-2 border-muted ps-3">
                                  {it.bundle_components.map((c, ci) => (
                                    <div key={ci} className="space-y-0.5">
                                      <p className="text-xs font-semibold">
                                        – {getTranslatedName({ name: c.item_name, name_translations: c.name_translations }, lang)}
                                        {c.size_label ? <span className="text-muted-foreground"> ({c.size_label})</span> : null}
                                        <span className="ms-1 text-muted-foreground tabular">× {c.quantity * it.quantity}</span>
                                      </p>
                                      {c.addons?.length ? (
                                        <div className="space-y-0.5 ps-2">
                                          {c.addons.map((a) => (
                                            <p key={a.id} className="text-xs text-muted-foreground">
                                              + {getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, lang)}
                                              {a.unit_price > 0 ? ` (${fmtMoney(a.unit_price * a.quantity)})` : ""}
                                            </p>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {it.notes ? <p className="mt-1 text-xs italic text-muted-foreground">{it.notes}</p> : null}
                            </div>

                            <div className="shrink-0 text-end">
                              <span className="block text-sm font-semibold tabular">{fmtMoney(it.line_total)}</span>
                              <span className="text-xs text-muted-foreground tabular">
                                {t("orders.cost", "Cost")}: {fmtMoney(it.line_cost)}
                                {it.cost_missing ? " ⚠" : ""}
                              </span>
                            </div>
                          </div>

                          {deductions.length > 0 ? (
                            <details className="mt-2 border-t pt-1 text-xs text-muted-foreground">
                              <summary className="cursor-pointer py-0.5 font-medium hover:text-foreground">
                                {t("orders.ingredientsUsed", "Ingredients used")} ({deductions.length})
                              </summary>
                              <div className="mt-2 space-y-0.5 ps-3">
                                {deductions.map((d, di) => {
                                  const dcost = deductionCost(d);
                                  return (
                                    <p key={di} className="flex items-center justify-between gap-2 tabular">
                                      <span>
                                        {d.ingredient_name}: {Number(d.quantity).toFixed(3)} {fmtUnit(d.unit)}
                                      </span>
                                      {dcost != null ? <span className="text-foreground/70">{fmtMoney(dcost)}</span> : null}
                                    </p>
                                  );
                                })}
                              </div>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="py-0">
                <CardContent className="space-y-2 p-4 text-sm">
                  <Row label={t("common.subtotal", "Subtotal")} value={fmtMoney(order.subtotal)} />
                  {order.discount_amount > 0 ? (
                    <Row label={t("orders.discount", "Discount")} value={`− ${fmtMoney(order.discount_amount)}`} className="text-success" />
                  ) : null}
                  {order.tax_amount > 0 ? <Row label={t("orders.tax", "Tax")} value={fmtMoney(order.tax_amount)} /> : null}
                  {order.tip_amount ? <Row label={t("orders.tip", "Tip")} value={fmtMoney(order.tip_amount)} /> : null}
                  {order.delivery_fee > 0 ? (
                    <Row label={t("orders.deliveryFee", "Delivery fee")} value={fmtMoney(order.delivery_fee)} />
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 text-base font-semibold">
                    <span>{t("common.total", "Total")}</span>
                    <span className="text-primary tabular">{fmtMoney(order.total_amount)}</span>
                  </div>
                  {items.length > 0 ? (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                      <span>
                        {t("orders.cogs", "COGS")}: {anyMissing ? "≥ " : ""}
                        {fmtMoney(knownCogs)}
                      </span>
                      <span className="tabular">
                        {t("orders.grossProfit", "Gross profit")}: {anyMissing ? "≤ " : ""}
                        {fmtMoney(profit)}
                        {profitPct !== null ? ` (${(profitPct * 100).toFixed(1)}%)` : ""}
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
