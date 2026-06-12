import { memo, useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import type { PublicMenuItem } from "@/shared/api/generated/models";
import { ItemImage } from "./item-image";
import { useInView } from "../hooks/use-in-view";
import { haptic } from "../lib/menu-format";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Refined product card. Memoised so cart/search state changes elsewhere don't
 * re-render the whole grid — only cards whose props actually change re-render.
 * `onSelect` must be stable (the page passes a useCallback).
 */
function MenuItemCardBase({
  item,
  onSelect,
  isRTL,
}: {
  item: PublicMenuItem;
  onSelect: (item: PublicMenuItem) => void;
  isRTL: boolean;
}) {
  const { t } = useTranslation();
  const [ref, inView] = useInView<HTMLButtonElement>({ rootMargin: "0px 0px -5% 0px" });
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const canTiltRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    canTiltRef.current =
      !prefersReducedMotion() &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!canTiltRef.current || !tiltRef.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRef.current.style.setProperty("--rx", `${-y * 5}deg`);
    tiltRef.current.style.setProperty("--ry", `${x * 5}deg`);
  };

  const handleMouseLeave = () => {
    if (!tiltRef.current) return;
    tiltRef.current.style.setProperty("--rx", "0deg");
    tiltRef.current.style.setProperty("--ry", "0deg");
  };

  const multiSize = item.sizes && item.sizes.length > 1;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        haptic("light");
        onSelect(item);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group text-start bg-white rounded-[1.75rem] sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-sm relative overflow-hidden flex gap-4 sm:gap-5 cursor-pointer",
        "hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]",
        "transition-[opacity,transform,box-shadow] duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="flex-1 flex flex-col justify-between py-0.5 sm:py-1 min-w-0">
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-[13px] sm:text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed min-h-[2.25rem] sm:min-h-[2.5rem]">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {multiSize ? t("menu.card.startsAt") : t("menu.card.price")}
            </span>
            <span className="text-lg sm:text-xl font-black text-primary leading-none mt-0.5 tabular-nums">
              {fmtMoney(item.base_price)}
            </span>
          </div>
          <div
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20",
              isRTL && "rotate-180",
            )}
          >
            <ChevronRight size={20} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Tilt wrapper — only the image tilts, keeps text legible */}
      <div
        ref={tiltRef}
        className="relative flex-shrink-0 transition-transform duration-300 ease-out"
        style={{
          transform: "perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <ItemImage
          src={item.image_url}
          alt={item.name}
          fallbackName={item.name}
          fallbackVariant="card"
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.5rem] sm:rounded-[1.75rem] shadow-xl shadow-slate-200/60 bg-slate-50 group-hover:scale-[1.03] transition-transform duration-500"
        />
        {item.image_url && (
          <div className="absolute inset-0 rounded-[1.5rem] sm:rounded-[1.75rem] bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
      </div>
    </button>
  );
}

export const MenuItemCard = memo(MenuItemCardBase);
