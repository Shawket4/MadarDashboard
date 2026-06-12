import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AnimatedMoney } from "./animated-money";
import { prefersReducedMotion } from "../lib/motion";

/** Fixed bottom CTA that opens the cart. Bumps when the count increases. */
export function FloatingOrderBar({
  cartCount,
  total,
  onOpen,
}: {
  cartCount: number;
  total: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const lastCountRef = useRef(cartCount);
  const barRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (cartCount > lastCountRef.current && barRef.current && !prefersReducedMotion()) {
      barRef.current.animate(
        [
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-4px) scale(1.02)" },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    }
    lastCountRef.current = cartCount;
  }, [cartCount]);

  return (
    <div
      className="fixed start-4 end-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-8 fade-in duration-500"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}
    >
      <button
        ref={barRef}
        onClick={onOpen}
        className="w-full h-[68px] sm:h-20 bg-slate-900 text-white rounded-[1.75rem] sm:rounded-[2rem] font-bold flex items-center justify-between ps-5 pe-2 sm:ps-7 sm:pe-3 shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-[0.98] border border-white/10 overflow-hidden relative"
      >
        <div className="flex flex-col items-start relative z-10 min-w-0">
          <span className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">
            {t("menu.bar.yourOrder")}
          </span>
          <span className="text-base sm:text-lg tracking-tight font-black">
            {t("menu.bar.items", { count: cartCount })}
          </span>
        </div>
        <div className="h-12 sm:h-14 px-4 sm:px-6 bg-primary rounded-2xl flex items-center gap-2 sm:gap-3 text-white font-black text-sm tracking-tight shadow-lg shadow-primary/30 relative z-10 flex-shrink-0">
          <span className="hidden sm:inline">{t("menu.bar.viewOrder")}</span>
          <span className="sm:hidden">{t("menu.bar.view")}</span>
          <span className="opacity-60">•</span>
          <AnimatedMoney value={total} className="tabular-nums" />
        </div>
      </button>
    </div>
  );
}
