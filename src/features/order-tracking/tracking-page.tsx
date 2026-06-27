import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bike,
  Check,
  ChefHat,
  Clock,
  Languages,
  Loader2,
  MapPin,
  Moon,
  PackageCheck,
  ShoppingBag,
  Sun,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";

import { useTrackDeliveryOrder } from "@/data/api/generated/api";
import type { DeliveryTracking } from "@/data/api/generated/models/deliveryTracking";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import { listItem, riseIn, spring, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";

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
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground" role="status">
          <Loader2 className="size-6 animate-spin motion-reduce:animate-none" />
          <p className="text-sm">{t("order.track.loading", "Loading your order…")}</p>
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <XCircle className="size-12 text-destructive" />
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t("order.track.notFoundTitle", "Order not found")}
          </h1>
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
      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-5">
        {/* Headline + ref */}
        <motion.div variants={riseIn} className="text-center">
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
        </motion.div>

        {/* Cancelled / rejected banner, or the live timeline */}
        {cancelled ? (
          <motion.div variants={listItem} className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center text-destructive">
            <p className="font-semibold">{t("order.track.cancelledTitle", "This order was cancelled")}</p>
            {order.cancel_reason && <p className="mt-1 text-sm opacity-90">{order.cancel_reason}</p>}
          </motion.div>
        ) : (
          <motion.ol variants={listItem} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
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
          </motion.ol>
        )}

        {/* Items */}
        {(order as DeliveryTracking & { items?: { name: string; quantity: number }[] }).items && (
          <motion.div variants={listItem} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">
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
          </motion.div>
        )}

        {/* Totals */}
        <motion.div variants={listItem} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <Totals
            subtotal={order.subtotal}
            deliveryFee={order.delivery_fee}
            total={order.total}
            discount={order.discount_amount}
          />
        </motion.div>

        {priceChanged && estimate != null && (
          <motion.div variants={listItem} className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <p className="font-semibold">{t("order.done.priceUpdatedTitle", "Final price updated")}</p>
            <p className="text-xs opacity-90">
              {t("order.done.wasNow", { old: fmtMoney(estimate), new: fmtMoney(order.total), defaultValue: "Was {{old}}, now {{new}}" })}
            </p>
          </motion.div>
        )}

        {/* Destination + payment */}
        <motion.div variants={listItem} className="rounded-2xl border border-border/70 bg-card p-5 text-start shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-brand" />
            {t(`order.track.channel.${order.channel}`, order.channel === "outside" ? "Delivery" : "In-mall")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{destination(order, t)}</p>
          {order.payment_method_hint && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4" />
              {t(`order.track.pay.${order.payment_method_hint}`, order.payment_method_hint === "card" ? "Card on delivery" : "Cash on delivery")}
            </p>
          )}
        </motion.div>

        <motion.div variants={listItem}>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/order/$orgId" params={{ orgId: order.org_id }}>
              {t("order.track.orderAgain", "Order again")}
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </Shell>
  );
}

/** A circular, bordered header icon button — matches the ordering flow's chrome. */
function HeaderIcon({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

/**
 * Storefront-styled brand chrome matching the ordering flow's StepShell: a
 * sticky header carrying the theme/language toggles and a footer with the
 * Madar mark, wrapping a focused mobile-width column.
 */
function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const toggleLang = () => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar");
  const mode = useOrderTheme((s) => s.mode);
  const toggleTheme = useOrderTheme((s) => s.toggle);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 px-4 py-3">
          <span aria-hidden className="size-9 shrink-0" />
          <span aria-hidden className="flex-1" />
          <HeaderIcon onClick={toggleTheme} label={t("order.theme")}>
            {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </HeaderIcon>
          <HeaderIcon onClick={toggleLang} label={t("order.language")}>
            <Languages className="size-4" />
          </HeaderIcon>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-10 pt-5">
        <div className="flex-1">{children}</div>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border/60 pt-6 text-center">
          <img
            src={lang.startsWith("ar") ? "/madar_ar.svg" : "/madar.svg"}
            alt={t("app.name")}
            className="h-6 opacity-80 dark:brightness-0 dark:invert"
          />
          <p className="text-xs text-muted-foreground">{t("order.footer.poweredBy")}</p>
          <p className="text-[11px] text-muted-foreground/70">
            {t("order.footer.rights", {
              year: new Date().getFullYear(),
              name: t("app.name"),
              defaultValue: "© {{year}} {{name}}. All rights reserved.",
            })}
          </p>
        </footer>
      </main>
    </div>
  );
}

function destination(o: DeliveryTracking, t: TFunction): string {
  if (o.channel === "outside") return o.address_line || "—";
  return [
    o.place_name,
    o.floor && t("order.track.floor", { floor: o.floor, defaultValue: "Floor {{floor}}" }),
    o.unit_number,
  ]
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
