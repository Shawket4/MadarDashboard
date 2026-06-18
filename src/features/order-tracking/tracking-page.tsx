import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bike,
  Check,
  ChefHat,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";

import { useTrackDeliveryOrder } from "@/data/api/generated/api";
import type { DeliveryTracking } from "@/data/api/generated/models/deliveryTracking";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import { fadeInUp, spring } from "@/lib/motion";

import { Totals } from "../public-ordering/components/cart-sheet";
import { useOrderTheme } from "../public-ordering/use-order-theme";

interface OrderTrackingPageProps {
  id: string;
  /** Pre-submit estimate (piastres) carried from checkout, to flag a reprice. */
  estimate?: number | null;
}

/** The forward delivery line, in order, with the timestamp field each step stamps. */
const STEPS = [
  { key: "received", at: "created_at", icon: ShoppingBag },
  { key: "confirmed", at: "confirmed_at", icon: Check },
  { key: "preparing", at: "preparing_at", icon: ChefHat },
  { key: "ready", at: "ready_at", icon: PackageCheck },
  { key: "out_for_delivery", at: "out_for_delivery_at", icon: Truck },
  { key: "delivered", at: "delivered_at", icon: Check },
] as const;

const TERMINAL = new Set(["delivered", "cancelled", "rejected"]);

/**
 * Public, live order tracking page (the dynamic link sent in WhatsApp and routed
 * to right after placement). Polls the public tracking endpoint — the public
 * surface has no SSE — and stops once the order reaches a terminal state.
 */
export function OrderTrackingPage({ id, estimate = null }: OrderTrackingPageProps) {
  const { t, i18n } = useTranslation();

  // Scope the storefront (light-by-default) theme to this page, like the ordering
  // flow, restoring the dashboard theme on unmount.
  useLayoutEffect(() => {
    useOrderTheme.getState().apply();
    return () => useOrderTheme.getState().restoreGlobal();
  }, []);

  const { data, isLoading, isError } = useTrackDeliveryOrder(id, {
    query: {
      // Poll every 15s while the order is in flight; stop once terminal.
      refetchInterval: (query) => {
        const status = (query.state.data as DeliveryTracking | undefined)?.status;
        return status && TERMINAL.has(status) ? false : 15_000;
      },
      retry: false,
    },
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">{t("order.track.loading", "Loading your order…")}</p>
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <XCircle className="size-10 text-muted-foreground" />
          <h1 className="font-serif text-xl">{t("order.track.notFoundTitle", "Order not found")}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("order.track.notFoundBody", "We couldn't find this order. The link may be incorrect or the order may have been removed.")}
          </p>
        </div>
      </Shell>
    );
  }

  const order = data;
  const cancelled = order.status === "cancelled" || order.status === "rejected";
  const delivered = order.status === "delivered";
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const priceChanged = estimate != null && estimate !== order.total;

  return (
    <Shell>
      <motion.div variants={fadeInUp} initial="hidden" animate="show" className="space-y-5">
        {/* Headline + ref */}
        <div className="text-center">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={spring}
            className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${
              cancelled ? "bg-destructive/10 text-destructive" : "bg-brand/10 text-brand"
            }`}
          >
            {cancelled ? <XCircle className="size-8" /> : delivered ? <Check className="size-8" /> : <Bike className="size-8" />}
          </motion.span>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t(`order.track.status.${order.status}`, statusFallback(order.status))}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.branch_name}
            {!cancelled && !delivered && order.estimated_prep_minutes > 0 && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {t("order.track.eta", { minutes: order.estimated_prep_minutes, defaultValue: "~{{minutes}} min" })}
                </span>
              </>
            )}
          </p>
          {order.delivery_ref && (
            <p className="mt-3 font-serif text-2xl font-semibold tracking-wider tabular-nums text-foreground" dir="ltr">
              {order.delivery_ref}
            </p>
          )}
        </div>

        {/* Cancelled / rejected banner, or the live timeline */}
        {cancelled ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center text-destructive">
            <p className="font-semibold">{t("order.track.cancelledTitle", "This order was cancelled")}</p>
            {order.cancel_reason && <p className="mt-1 text-sm opacity-90">{order.cancel_reason}</p>}
          </div>
        ) : (
          <ol className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            {STEPS.map((stepDef, idx) => {
              const done = currentIdx >= 0 && idx <= currentIdx;
              const active = idx === currentIdx;
              const Icon = stepDef.icon;
              const ts = order[stepDef.at as keyof DeliveryTracking] as string | null | undefined;
              const last = idx === STEPS.length - 1;
              return (
                <li key={stepDef.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        done ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                      } ${active ? "ring-4 ring-brand/20" : ""}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    {!last && <span className={`my-1 w-0.5 flex-1 ${idx < currentIdx ? "bg-brand" : "bg-border"}`} />}
                  </div>
                  <div className={`pb-5 ${last ? "pb-0" : ""}`}>
                    <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {t(`order.track.step.${stepDef.key}`, stepFallback(stepDef.key))}
                    </p>
                    {ts && <p className="text-xs tabular-nums text-muted-foreground">{fmtTime(ts, i18n.language)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Items */}
        {(order as DeliveryTracking & { items?: { name: string; quantity: number }[] }).items && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("order.track.items", "Your order")}
            </p>
            <ul className="space-y-1.5">
              {(order as DeliveryTracking & { items?: { name: string; quantity: number }[] }).items!.map(
                (item, i) => (
                  <li key={i} className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span className="tabular-nums text-muted-foreground">×{item.quantity}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <Totals
            subtotal={order.subtotal}
            deliveryFee={order.delivery_fee}
            total={order.total}
            discount={order.discount_amount}
          />
        </div>

        {priceChanged && estimate != null && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <p className="font-semibold">{t("order.done.priceUpdatedTitle", "Final price updated")}</p>
            <p className="text-xs opacity-90">
              {t("order.done.wasNow", { old: fmtMoney(estimate), new: fmtMoney(order.total), defaultValue: "Was {{old}}, now {{new}}" })}
            </p>
          </div>
        )}

        {/* Destination + payment */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 text-start shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-brand" />
            {t(`order.track.channel.${order.channel}`, order.channel === "outside" ? "Delivery" : "In-mall")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{destination(order)}</p>
          {order.payment_method_hint && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4" />
              {t(`order.track.pay.${order.payment_method_hint}`, order.payment_method_hint === "card" ? "Card on delivery" : "Cash on delivery")}
            </p>
          )}
        </div>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/order/$orgId" params={{ orgId: order.org_id }}>
            {t("order.track.orderAgain", "Order again")}
          </Link>
        </Button>
      </motion.div>
    </Shell>
  );
}

/** Centered, storefront-styled page frame matching the ordering flow's width. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-[480px]">{children}</div>
    </div>
  );
}

function destination(o: DeliveryTracking): string {
  if (o.channel === "outside") return o.address_line || "—";
  return [o.place_name, o.floor && `Floor ${o.floor}`, o.unit_number]
    .filter(Boolean)
    .join(" · ");
}

function fmtTime(iso: string, lang: string): string {
  try {
    return new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function statusFallback(status: string): string {
  switch (status) {
    case "received":
      return "Order received";
    case "confirmed":
      return "Order accepted";
    case "preparing":
      return "Preparing your order";
    case "ready":
      return "Ready";
    case "out_for_delivery":
      return "On the way";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Cancelled";
    default:
      return status;
  }
}

function stepFallback(key: string): string {
  switch (key) {
    case "received":
      return "Received";
    case "confirmed":
      return "Accepted";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "out_for_delivery":
      return "On the way";
    case "delivered":
      return "Delivered";
    default:
      return key;
  }
}
