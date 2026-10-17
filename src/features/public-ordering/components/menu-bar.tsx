/**
 * The two pieces of the menu step's frame that sit outside `MenuStep`: the
 * floating basket bar (phones and tablets) and the desktop header search.
 *
 * Shared by the ordering flow and the shop's menu without prices
 * (`features/menu-display`), so both menus are one surface. With prices off
 * (`useShowPrices`) the bar carries the count and no figure.
 */
import { useTranslation } from "react-i18next";
import { ArrowRight, Search, ShoppingBag } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AnimatedNumber, Reveal, recipes } from "@/lib/motion";

import { fmtMoneyFigure } from "../ordering-motion";
import { useShowPrices } from "../price-mode";
import { CartCount } from "./cart-count";

/** The floating "N items · total →" bar that opens the basket. */
export function CartBar({
  count: itemCount,
  total,
  onOpen,
}: {
  count: number;
  /** The basket's figure (piastres); not read when prices are off. */
  total: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const showPrices = useShowPrices();
  return (
    <Reveal asChild recipe={recipes.pop}>
      <button
        type="button"
        onClick={onOpen}
        data-press="brand"
        className="flex w-full items-center justify-between rounded-full bg-foreground px-5 py-3.5 text-background shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="inline-flex items-center gap-2.5">
          <CartCount
            count={itemCount}
            className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand px-2 py-0.5 text-xs font-bold tabular-nums text-brand-foreground"
          />
          <span className="text-sm">{t("order.cart.units", { count: itemCount, defaultValue: "items" })}</span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold tabular-nums">
          {showPrices ? <AnimatedNumber value={total} format={fmtMoneyFigure} /> : t("order.cart.view", "View cart")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
      </button>
    </Reveal>
  );
}

/** Where the basket bar will be, while the basket is empty. */
export function CartEmptyHint() {
  const { t } = useTranslation();
  return (
    // In the same floating slot as the cart bar it turns into, so the page
    // keeps room for it — laid over the page, it sat on the footer's links.
    <div className="pointer-events-none flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
      <ShoppingBag className="size-3.5" />
      {t("order.cart.emptyHint")}
    </div>
  );
}

/** The menu search, as the wide header carries it on desktop. */
export function HeaderSearch({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("order.menu.search")}
        className="ps-9 rounded-full"
        inputMode="search"
      />
    </div>
  );
}
