import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ItemImage } from "./item-image";
import { haptic } from "../lib/menu-format";

interface Props {
  orgName: string;
  logoUrl?: string | null;
  cartCount: number;
  onCartClick: () => void;
}

/** Sticky top bar: org logo + name + cart button. The cart button ref is
 *  forwarded so the page can target it for the fly-to-cart animation. */
export const MenuHeader = forwardRef<HTMLButtonElement, Props>(function MenuHeader(
  { orgName, logoUrl, cartCount, onCartClick },
  ref,
) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {logoUrl ? (
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
              <ItemImage src={logoUrl} alt="" className="h-full w-full" priority />
            </div>
          ) : (
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 flex-shrink-0">
              <Coffee size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight truncate">
              {orgName}
            </h1>
            <p className="text-xs text-slate-400 font-bold leading-tight truncate">
              {t("menu.header.subtitle")}
            </p>
          </div>
        </div>

        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className="rounded-2xl bg-slate-100/60 relative h-11 w-11 flex-shrink-0"
          onClick={() => {
            haptic("light");
            onCartClick();
          }}
          aria-label={t("menu.bar.yourOrder")}
        >
          <ShoppingBag size={20} className="text-slate-600" />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="absolute -top-1 -end-1 h-5 min-w-5 px-1 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center animate-in zoom-in-50 duration-300 tabular-nums"
            >
              {cartCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
});
