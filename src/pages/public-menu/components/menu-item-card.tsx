import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import type { PublicMenuItem } from "@/shared/api/generated/models";
import { useInView } from "../hooks/use-in-view";
import { ItemImage } from "./item-image";

interface Props {
  item: PublicMenuItem;
  index: number;
  onSelect: (item: PublicMenuItem) => void;
}

export const MenuItemCard = memo(function MenuItemCard({ item, index, onSelect }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const [ref, inView] = useInView<HTMLButtonElement>();

  const displayName =
    (item.name_translations as Record<string, string>)?.[lang] || item.name;

  // Base price or minimum price across sizes
  const displayPrice =
    item.sizes.length > 0
      ? Math.min(...item.sizes.map((s) => s.price_override), item.base_price)
      : item.base_price;

  const hasMultiplePrices =
    item.sizes.length > 1 ||
    item.sizes.some((s) => s.price_override !== item.base_price);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(item)}
      className={cn(
        "group text-start w-full rounded-2xl overflow-hidden bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        inView ? "opacity-100" : "opacity-0"
      )}
      style={
        inView
          ? {
              animation: `pm-card-rise 0.32s cubic-bezier(0.22,1,0.36,1) ${Math.min(index * 45, 300)}ms both`,
            }
          : undefined
      }
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <ItemImage
          src={item.image_url}
          name={displayName}
          className="w-full h-full"
        />

        {/* Quick-add button */}
        <div
          className={cn(
            "absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-[#0A2540] text-white",
            "flex items-center justify-center shadow-md",
            "transition-transform duration-150 group-hover:scale-110 group-active:scale-90"
          )}
          aria-hidden="true"
        >
          <Plus size={16} strokeWidth={2.5} />
        </div>
      </div>

      {/* Details */}
      <div className="px-3 py-2.5 space-y-0.5">
        <p className="text-[13px] font-semibold text-[#0A2540] leading-snug line-clamp-2">
          {displayName}
        </p>
        <p className="text-[12px] font-medium text-[#C25B3F] tabular-nums">
          {hasMultiplePrices ? "from " : ""}
          {fmtMoney(displayPrice, { fractionDigits: 0 })}
        </p>
      </div>
    </button>
  );
});
