import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Ban, Bike, Check, Info, MapPin, Store, X } from "lucide-react";

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
import { SummaryLine } from "@/components/app/list-row";
import { StatusPill, toneFor } from "@/components/app/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDeliveryOrder, useGetOrder, useListCatalog } from "@/data/api/generated/api";
import type { DeliveryOrder, OrderFull } from "@/data/api/generated/models";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { fmtDateTimeFull, fmtMoney, fmtNumber, fmtPercent, fmtUnit } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { cn } from "@/lib/utils";

import { orderRewards } from "./reward-lines";

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
  const side = i18n.dir() === "rtl" ? "left" : "right";

  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const orgId = role === "super_admin" ? selectedOrgId : (userOrgId ?? null);

  const { data: order, isLoading } = useGetOrder(orderId ?? "", { query: { enabled: !!orderId && open } });
  const { data: catalog } = useListCatalog(orgId ?? "", {
    query: { enabled: open && !!orgId, staleTime: 5 * 60_000 },
  });
  // The step timestamps live on the delivery order, not the materialized sale —
  // fetch it to render the read-only progress timeline.
  const { data: deliveryOrder } = useGetDeliveryOrder(order?.delivery_order_id ?? "", {
    query: { enabled: open && order?.order_type === "delivery" && !!order?.delivery_order_id },
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
  const rewards = orderRewards(order);
  const items = order?.items ?? [];
  const isDelivery = order?.order_type === "delivery";
  const delivery = order?.delivery ?? null;
  const channelLabel = (channel: string) =>
    channel === "in_mall" ? t("delivery.channelInMall", "In-mall") : t("orders.deliveryOutside", "Outside");
  const mapsUrl =
    order?.delivery_lat != null && order?.delivery_lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : null;
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
      <SheetContent side={side} showCloseButton={false} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 border-b bg-background">
          <div className="min-w-0">
            <SheetTitle className="flex flex-wrap items-center gap-2 text-lg">
              <span className={cn(order && "font-mono tabular-nums")}>{order ? (order.order_ref ?? `#${order.display_number ?? order.order_number}`) : t("orders.order", "Order")}</span>
              {order ? (
                <StatusPill tone={toneFor(order.status, "success")}>
                  {t(`orderStatus.${order.status}`, order.status)}
                </StatusPill>
              ) : null}
              {isDelivery ? (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  {delivery?.channel === "in_mall" ? <Store aria-hidden className="size-3" /> : <Bike aria-hidden className="size-3" />}
                  {delivery ? channelLabel(delivery.channel) : t("orders.delivery", "Delivery")}
                </Badge>
              ) : null}
            </SheetTitle>
            <SheetDescription>{order ? fmtDateTimeFull(order.created_at) : t("common.loading", "Loading…")}</SheetDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {order && order.status === "completed" && onVoid ? (
              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onVoid(order)}>
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
                <Card className="border-destructive/30 bg-destructive/5 py-0 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <Ban aria-hidden className="size-4 shrink-0 text-destructive" />
                    <div>
                      <p className="font-semibold">{t("orderStatus.voided", "Voided")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`orders.voidReasons.${order.void_reason}`, { defaultValue: order.void_reason })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {rewards.refused ? (
                <Card role="alert" data-testid="reward-refused" className="border-warning/40 bg-warning/10 py-0 shadow-none">
                  <CardContent className="flex items-start gap-2 p-4 text-sm">
                    <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]" />
                    <div>
                      <p className="font-semibold">
                        {t("orders.rewardRefusedTitle", "Reward refused when this sale synced")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "orders.rewardRefusedBody",
                          "The till gave the reward offline, but the member's balance could not pay for it. No points were taken and the order is flagged.",
                        )}
                      </p>
                      <p className="mt-1 text-xs" dir="auto">
                        “{rewards.refused}”
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="py-0 shadow-none">
                <CardContent className="space-y-2 p-4 text-sm">
                  {rewards.memberId ? (
                    <Row
                      label={t("orders.loyaltyMember", "Loyalty member")}
                      value={rewards.memberName ?? t("orders.loyaltyMemberForgotten", "Deleted member")}
                    />
                  ) : null}
                  <Row label={t("common.date", "Date")} value={fmtDateTimeFull(order.created_at)} />
                  <Row label={t("tills.teller", "Teller")} value={order.teller_name} />
                  {order.waiter_name ? <Row label={t("tills.waiter", "Waiter")} value={order.waiter_name} /> : null}
                  {order.customer_name ? <Row label={t("orders.customer", "Customer")} value={order.customer_name} /> : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{t("orders.payment", "Payment")}</span>
                    {/* Split sales carry the nominal "mixed" label; the legs are
                        what every money report actually buckets by. */}
                    {(order.payment_legs ?? []).length > 1 ? (
                      <span className="flex flex-wrap justify-end gap-1">
                        {order.payment_legs.map((leg, i) => (
                          <Badge key={`${leg.method}-${i}`} variant="outline">
                            {t(`payments.${leg.method}`, leg.method)}
                            <span className="ms-1 tabular">{fmtMoney(leg.amount)}</span>
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <Badge variant="outline">{t(`payments.${order.payment_method}`, order.payment_method)}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {delivery ? (
                <Card className="py-0 shadow-none">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {t("orders.deliveryInfo", "Delivery")}
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
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
                        value={`${fmtNumber(delivery.road_distance_meters / 1000, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ${t("delivery.kmUnit", "km")}`}
                      />
                    ) : null}
                    {delivery.delivery_ref ? (
                      <Row label={t("orders.deliveryRef", "Delivery ref")} value={delivery.delivery_ref} />
                    ) : null}
                    {mapsUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{t("orders.location", "Location")}</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
                        >
                          <MapPin className="size-3.5" />
                          {t("orders.openInMaps", "Open in Maps")}
                        </a>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {deliveryOrder ? <DeliveryTimeline order={deliveryOrder} /> : null}

              {items.length > 0 ? (
                <Card className="py-0 shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm font-semibold">
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
                                  <Badge className="px-1 py-0 text-xs uppercase">{t("orders.combo", "Combo")}</Badge>
                                ) : null}
                                {rewards.lines.has(it.id) ? (
                                  <StatusPill tone="success" size="sm">
                                    {t("orders.reward", "Reward")}
                                  </StatusPill>
                                ) : null}
                              </p>
                              {rewards.lines.has(it.id) ? (
                                <p className="text-xs text-muted-foreground tabular">
                                  {t("orders.rewardCovers", {
                                    defaultValue: "Reward covers {{units}} · {{amount}}",
                                    units: rewards.lines.get(it.id)?.units ?? "—",
                                    amount: fmtMoney(-(rewards.lines.get(it.id)?.covered ?? 0)),
                                  })}
                                </p>
                              ) : null}
                              <p className="text-xs text-muted-foreground tabular">
                                <bdi>× {fmtNumber(it.quantity)} · {fmtMoney(it.unit_price)}</bdi>
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
                                      <Badge key={o.id} variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">
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
                              <span className="block font-mono text-sm font-semibold tabular-nums">{fmtMoney(it.line_total)}</span>
                              <span className="text-xs text-muted-foreground tabular">
                                {t("orders.cost", "Cost")}: {fmtMoney(it.line_cost)}
                                {it.cost_missing ? ` · ${t("orders.costMissing", "cost missing")}` : ""}
                              </span>
                            </div>
                          </div>

                          {deductions.length > 0 ? (
                            <details className="mt-2 border-t pt-1 text-xs text-muted-foreground">
                              <summary className="cursor-pointer rounded py-0.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                                {t("orders.ingredientsUsed", "Ingredients used")} ({deductions.length})
                              </summary>
                              <div className="mt-2 space-y-0.5 ps-3">
                                {deductions.map((d, di) => {
                                  const dcost = deductionCost(d);
                                  return (
                                    <p key={di} className="flex items-center justify-between gap-2 tabular">
                                      <span>
                                        {d.ingredient_name}: <bdi>{fmtNumber(Number(d.quantity), { maximumFractionDigits: 3 })} {fmtUnit(d.unit)}</bdi>
                                      </span>
                                      {dcost != null ? <span className="text-muted-foreground">{fmtMoney(dcost)}</span> : null}
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

              <Card className="py-0 shadow-none">
                <CardContent className="p-4 pt-2 text-sm">
                  <SummaryLine label={t("common.subtotal", "Subtotal")} value={fmtMoney(order.subtotal)} />
                  {rewards.totalCovered > 0 || rewards.memberId ? (
                    <SummaryLine
                      label={
                        rewards.memberName
                          ? t("orders.loyaltyRewardsFor", { defaultValue: "Loyalty rewards · {{name}}", name: rewards.memberName })
                          : t("orders.loyaltyRewards", "Loyalty rewards")
                      }
                      value={rewards.totalCovered > 0 ? fmtMoney(-rewards.totalCovered) : "—"}
                    />
                  ) : null}
                  {order.discount_amount > 0 ? (
                    <SummaryLine label={t("orders.discount", "Discount")} value={fmtMoney(-order.discount_amount)} />
                  ) : null}
                  {order.tax_amount > 0 ? <SummaryLine label={t("orders.tax", "Tax")} value={fmtMoney(order.tax_amount)} /> : null}
                  {order.tip_amount ? <SummaryLine label={t("orders.tip", "Tip")} value={fmtMoney(order.tip_amount)} /> : null}
                  {order.delivery_fee > 0 ? (
                    <SummaryLine label={t("orders.deliveryFee", "Delivery fee")} value={fmtMoney(order.delivery_fee)} />
                  ) : null}
                  <SummaryLine
                    emphasis
                    className={cn("mt-1 border-t pt-1", voided && "text-muted-foreground line-through")}
                    label={t("common.total", "Total")}
                    value={fmtMoney(order.total_amount)}
                  />
                  {items.length > 0 ? (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                      <span>
                        {t("orders.cogs", "COGS")}: <bdi className="font-mono tabular-nums">{anyMissing ? "≥ " : ""}{fmtMoney(knownCogs)}</bdi>
                      </span>
                      <span>
                        {t("orders.grossProfit", "Gross profit")}:{" "}
                        <bdi className="font-mono tabular-nums">
                          {anyMissing ? "≤ " : ""}
                          {fmtMoney(profit)}
                          {profitPct !== null ? ` (${fmtPercent(profitPct)})` : ""}
                        </bdi>
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
      <span className="min-w-0 text-end" dir="auto">{value}</span>
    </div>
  );
}

const DELIVERY_STEP_KEYS = ["received", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"] as const;

const DELIVERY_STEPS: { key: string; tsKey: keyof DeliveryOrder; labelKey: string; fallback: string }[] = [
  { key: "received", tsKey: "created_at", labelKey: "deliveryTimeline.received", fallback: "Received" },
  { key: "confirmed", tsKey: "confirmed_at", labelKey: "deliveryTimeline.confirmed", fallback: "Confirmed" },
  { key: "preparing", tsKey: "preparing_at", labelKey: "deliveryTimeline.preparing", fallback: "Preparing" },
  { key: "ready", tsKey: "ready_at", labelKey: "deliveryTimeline.ready", fallback: "Ready" },
  { key: "out_for_delivery", tsKey: "out_for_delivery_at", labelKey: "deliveryTimeline.outForDelivery", fallback: "Out for delivery" },
  { key: "delivered", tsKey: "delivered_at", labelKey: "deliveryTimeline.delivered", fallback: "Delivered" },
];

/**
 * Read-only delivery progress. Renders filled up to the order's current status;
 * step timestamps are shown where present. Because the POS clears non-landed
 * step stamps on a jump, intermediate timestamps may be absent even though the
 * line shows them as passed — the hint explains this.
 */
function DeliveryTimeline({ order }: { order: DeliveryOrder }) {
  const { t } = useTranslation();
  const currentIdx = DELIVERY_STEP_KEYS.indexOf(order.status as (typeof DELIVERY_STEP_KEYS)[number]);
  const terminalOff = order.status === "cancelled" || order.status === "rejected";

  return (
    <Card className="py-0 shadow-none">
      <CardContent className="p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          {t("deliveryTimeline.title", "Delivery progress")}
          <span title={t("deliveryTimeline.hint", "Skipped steps may be cleared; only reached milestones are timestamped.")} className="inline-flex">
            <Info className="size-3.5" />
          </span>
        </p>
        {terminalOff ? (
          <StatusPill tone="danger">{t(`orderStatus.${order.status}`, order.status)}</StatusPill>
        ) : (
          DELIVERY_STEPS.map((step, i) => {
            const reached = currentIdx >= 0 && i <= currentIdx;
            const ts = order[step.tsKey] as string | null | undefined;
            const isLast = i === DELIVERY_STEPS.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      reached ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background",
                    )}
                  >
                    {reached ? <Check className="size-3" /> : null}
                  </span>
                  {!isLast ? <span className={cn("min-h-4 w-0.5 flex-1", i < currentIdx ? "bg-primary" : "bg-muted")} /> : null}
                </div>
                <div className={cn("pb-3", isLast && "pb-0")}>
                  <p className={cn("text-sm", reached ? "font-medium" : "text-muted-foreground")}>{t(step.labelKey, step.fallback)}</p>
                  {ts ? <p className="font-mono text-xs text-muted-foreground tabular-nums">{fmtDateTimeFull(ts)}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
