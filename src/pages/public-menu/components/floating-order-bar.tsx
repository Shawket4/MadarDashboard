import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag } from "lucide-react";
import { AnimatedMoney } from "./animated-money";

interface Props {
  cartCount: number;
  total: number;
  onOpen: () => void;
}

export function FloatingOrderBar({ cartCount, total, onOpen }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  // Entrance animation on first mount
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = "pm-bar-rise 0.36s cubic-bezier(0.34,1.56,0.64,1) both";
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-5 inset-x-4 z-40 sm:max-w-md sm:mx-auto"
    >
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#0A2540] text-white shadow-xl active:opacity-90 active:scale-[0.98] transition-transform duration-100"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <ShoppingBag size={16} />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C25B3F] text-[10px] font-bold flex items-center justify-center leading-none">
              {cartCount}
            </span>
          </div>
          <span className="text-sm font-semibold">{t("menu.cart.viewOrder", "View order")}</span>
        </div>

        <AnimatedMoney
          value={total}
          className="text-sm font-bold tabular-nums"
        />
      </button>
    </div>
  );
}
