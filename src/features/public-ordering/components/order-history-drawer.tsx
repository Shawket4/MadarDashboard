import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink, MapPin, Package, ReceiptText } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { OrderHistorySummary } from "@/data/api/generated/models/orderHistorySummary";

interface OrderHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OrderHistorySummary[];
}

function statusTone(status: string): "ok" | "warn" | "neutral" {
  if (status === "delivered") return "ok";
  if (status === "cancelled" || status === "rejected") return "warn";
  return "neutral";
}

export function OrderHistoryDrawer({ open, onOpenChange, orders }: OrderHistoryDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-3xl pb-safe-bottom">
        <SheetHeader className="pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <ReceiptText className="size-4" />
            </span>
            <SheetTitle className="font-serif text-lg font-semibold">
              {t("order.history.title", "Your orders")}
            </SheetTitle>
          </div>
        </SheetHeader>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <Package className="size-10 opacity-40" />
            <p className="text-sm">{t("order.history.empty", "No past orders yet.")}</p>
          </div>
        ) : (
          <ul className="space-y-3 pb-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OrderCard({ order }: { order: OrderHistorySummary }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const tone = statusTone(order.status);

  const items = (() => {
    try {
      const arr = Array.isArray(order.items) ? order.items : JSON.parse(order.items as string);
      return arr as { name: string; quantity: number }[];
    } catch {
      return [];
    }
  })();

  const date = new Date(order.created_at).toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const destination = (() => {
    if (order.channel === "outside") return order.address_line ?? null;
    const parts = [
      order.place_name,
      (order as unknown as Record<string, string | null>).floor
        ? `Fl. ${(order as unknown as Record<string, string | null>).floor}`
        : null,
      (order as unknown as Record<string, string | null>).unit_number,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  })();

  const hasDiscount =
    (order.discount_amount ?? 0) > 0;

  return (
    <li className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-foreground">{order.branch_name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {order.delivery_ref && <span dir="ltr">{order.delivery_ref}</span>}
            {order.delivery_ref && <span className="opacity-40">·</span>}
            <span>{date}</span>
          </div>
        </div>
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            tone === "ok" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            tone === "warn" && "bg-destructive/10 text-destructive",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          {t(`order.status.${order.status}`, order.status)}
        </span>
      </div>

      {/* Items preview (always visible) */}
      {items.length > 0 && (
        <div className="border-t border-border/50 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("order.history.items", "Your order")}
          </p>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex items-baseline justify-between text-sm">
                <span className="text-foreground">{item.name}</span>
                <span className="tabular-nums text-muted-foreground">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable receipt section */}
      <div className="border-t border-border/50">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          aria-expanded={expanded}
        >
          <span className="font-serif text-base font-semibold tabular-nums text-foreground">
            {fmtMoney(order.total)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Receipt breakdown */}
            <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("order.history.subtotal", "Subtotal")}</span>
                <span className="tabular-nums">{fmtMoney(order.subtotal)}</span>
              </div>
              {(order.delivery_fee ?? 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("order.history.fee", "Delivery fee")}</span>
                  <span className="tabular-nums">{fmtMoney(order.delivery_fee)}</span>
                </div>
              )}
              {hasDiscount && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{t("cart.discount", "Discount")}</span>
                  <span className="tabular-nums">−{fmtMoney(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/50 pt-1.5 font-semibold text-foreground">
                <span>{t("cart.total", "Total")}</span>
                <span className="tabular-nums">{fmtMoney(order.total)}</span>
              </div>
            </div>

            {/* Destination */}
            {destination && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    {t("order.history.destination", "Destination")}
                  </p>
                  <p className="text-foreground">{destination}</p>
                </div>
              </div>
            )}

            {/* Track link */}
            <a
              href={`/track/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5 transition-colors"
            >
              {t("order.history.track", "Track this order")}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>
    </li>
  );
}
