import { useTranslation } from "react-i18next";
import { Clock, ShoppingBag, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import type { Channel } from "../types";
import { ChannelStep } from "./channel-step";

interface CheckoutChannelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: PublicBranch;
  /** Items currently in the cart (drives the saved-cart reassurance). */
  itemCount: number;
  /** Estimated subtotal in piastres (shown on the closed state). */
  subtotal: number;
  /** Customer picked an open channel — proceed to the gated checkout flow. */
  onChoose: (channel: Channel) => void;
}

/**
 * Shown when a customer taps "Checkout" from the menu preview (browse mode),
 * where no channel has been chosen yet. If a channel is open it offers the
 * channel chooser; if everything is closed it shows a warm, reassuring state
 * confirming the cart is saved for when ordering reopens.
 */
export function CheckoutChannelSheet({
  open,
  onOpenChange,
  branch,
  itemCount,
  subtotal,
  onChoose,
}: CheckoutChannelSheetProps) {
  const { t } = useTranslation();
  const anyOpen =
    branch.in_mall_open_now ||
    branch.outside_open_now ||
    branch.umbrella_open_now ||
    branch.pickup_open_now;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[90dvh] max-w-[480px]">
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 pb-3 pt-1 text-start">
          <div>
            <DrawerTitle className="font-serif text-xl">
              {anyOpen
                ? t("order.channel.heading", "How would you like it?")
                : t("order.browse.checkoutClosedTitle", "Ordering is closed right now")}
            </DrawerTitle>
            <DrawerDescription className="mt-0.5">
              {anyOpen
                ? t("order.browse.checkoutChooseHint", "Choose how to get your order to finish checking out.")
                : t("order.browse.checkoutClosedHint", "Your cart is saved — pick up right where you left off.")}
            </DrawerDescription>
          </div>
          <DrawerClose
            aria-label={t("common.close", "Close")}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-muted"
          >
            <X className="size-4" />
          </DrawerClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {anyOpen ? (
            <ChannelStep branch={branch} onSelect={onChoose} />
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Clock className="size-6" />
              </span>
              <p className="font-serif text-lg leading-tight">
                {t("order.browse.checkoutClosedTitle", "Ordering is closed right now")}
              </p>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                {t(
                  "order.browse.checkoutClosedBody",
                  "Every channel is closed at the moment. We've saved your cart — come back when we reopen and check out in a tap.",
                )}
              </p>

              {itemCount > 0 && (
                <div className="mt-5 flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="size-4" />
                    {itemCount} {t("order.cart.units", { count: itemCount, defaultValue: "items" })}
                  </span>
                  <span className="font-semibold tabular-nums">{fmtMoney(subtotal)}</span>
                </div>
              )}

              <Button variant="brand" className="mt-5 w-full" size="lg" onClick={() => onOpenChange(false)}>
                {t("order.browse.keepBrowsing", "Keep browsing")}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
