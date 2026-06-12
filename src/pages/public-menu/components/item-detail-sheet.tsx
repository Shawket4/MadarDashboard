import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import type { PublicAddonItem, PublicMenuItem } from "@/shared/api/generated/models";
import { BottomSheet } from "./bottom-sheet";
import { ItemImage } from "./item-image";
import {
  getAddonPrice,
  getSizePrice,
  lineSignature,
  uid,
} from "../lib/menu-format";
import type { CartLine } from "../lib/types";

interface Props {
  item: PublicMenuItem | null;
  onClose: () => void;
  onAdd: (line: CartLine, sourceEl: HTMLElement | null) => void;
}

export function ItemDetailSheet({ item, onClose, onAdd }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const [selectedSizeId, setSelectedSizeId] = useState<string | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, Set<string>>>({});
  const [qty, setQty] = useState(1);
  const addBtnRef = { current: null as HTMLElement | null };

  // Reset selections when item changes
  const prevItemId = useMemo(() => item?.id, [item]);
  if (item && item.id !== prevItemId) {
    setSelectedSizeId(undefined);
    setSelectedAddons({});
    setQty(1);
  }

  const displayName = item
    ? (item.name_translations as Record<string, string>)?.[lang] || item.name
    : "";
  const displayDesc = item
    ? (item.description_translations as Record<string, string>)?.[lang] ||
      item.description
    : null;

  const activeSize = item?.sizes.find((s) => s.id === selectedSizeId) ?? item?.sizes[0];
  const unitPrice = item
    ? getSizePrice(item.base_price, activeSize) +
      Object.values(selectedAddons)
        .flatMap((ids) => [...ids])
        .reduce((sum, addonId) => {
          const slot = item.addon_slots.find((s) =>
            s.addon_items.some((a) => a.id === addonId)
          );
          const addon = slot?.addon_items.find((a) => a.id === addonId);
          return sum + (addon ? getAddonPrice(addon) : 0);
        }, 0)
    : 0;

  const lineTotal = unitPrice * qty;

  // Validation: required slots must have a selection
  const canAdd =
    item?.addon_slots
      .filter((s) => s.is_required && s.min_selections > 0)
      .every((s) => (selectedAddons[s.id]?.size ?? 0) >= s.min_selections) ?? false;

  const toggleAddon = (slotId: string, addon: PublicAddonItem, isMulti: boolean) => {
    setSelectedAddons((prev) => {
      const current = new Set(prev[slotId] ?? []);
      if (current.has(addon.id)) {
        current.delete(addon.id);
      } else {
        if (!isMulti) current.clear();
        const slot = item?.addon_slots.find((s) => s.id === slotId);
        const max = slot?.max_selections;
        if (max && current.size >= max) {
          const [first] = current;
          current.delete(first);
        }
        current.add(addon.id);
      }
      return { ...prev, [slotId]: current };
    });
  };

  const handleAdd = () => {
    if (!item) return;
    const addonLines = Object.entries(selectedAddons).flatMap(([slotId, ids]) => {
      const slot = item.addon_slots.find((s) => s.id === slotId);
      return [...ids].map((addonId) => {
        const addon = slot?.addon_items.find((a) => a.id === addonId)!;
        return {
          slotId,
          slotName: slot?.label ?? "",
          addonId,
          addonName: addon.name,
          price: getAddonPrice(addon),
        };
      });
    });

    const line: CartLine = {
      lineId: uid(),
      signature: lineSignature(
        item.id,
        activeSize?.id,
        addonLines.map((a) => a.addonId)
      ),
      itemId: item.id,
      itemName: displayName,
      imageUrl: item.image_url,
      size: activeSize ? { id: activeSize.id, name: activeSize.label } : undefined,
      addons: addonLines,
      unitPrice,
      quantity: qty,
    };

    onAdd(line, addBtnRef.current);
    setSelectedSizeId(undefined);
    setSelectedAddons({});
    setQty(1);
  };

  return (
    <BottomSheet open={!!item} onClose={onClose} ariaLabel={t("menu.item.detail", "Item detail")} maxHeightClass="max-h-[94dvh]">
      {item && (
        <div className="flex flex-col flex-1 min-h-0 pm-sheet-inner">
          {/* Hero image */}
          <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden bg-neutral-100">
            <ItemImage
              src={item.image_url}
              name={displayName}
              className="w-full h-full"
            />
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-4 space-y-5">
            {/* Name + description */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[#0A2540] leading-tight">{displayName}</h2>
              {displayDesc && (
                <p className="text-sm text-neutral-500 leading-relaxed">{displayDesc}</p>
              )}
            </div>

            {/* Sizes */}
            {item.sizes.length > 1 && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {t("menu.item.size", "Size")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.sizes.map((s) => {
                    const isActive = (activeSize?.id ?? "") === s.id;
                    const price = getSizePrice(item.base_price, s);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSizeId(s.id)}
                        className={cn(
                          "flex flex-col items-center px-4 py-2 rounded-2xl border text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-[#0A2540] text-white border-[#0A2540]"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <span>{s.label}</span>
                        <span className={cn("text-xs tabular-nums", isActive ? "text-white/70" : "text-neutral-400")}>
                          {fmtMoney(price, { fractionDigits: 0 })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addon slots */}
            {item.addon_slots.map((slot) => {
              const isMulti =
                slot.addon_type === "multi" ||
                (slot.max_selections !== null && (slot.max_selections ?? 1) > 1);
              const selected = selectedAddons[slot.id] ?? new Set<string>();

              const slotLabel =
                (slot.label_translations as Record<string, string>)?.[lang] ||
                slot.label ||
                "";

              return (
                <div key={slot.id} className="space-y-2.5">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      {slotLabel}
                    </p>
                    {slot.is_required && (
                      <span className="text-[10px] font-semibold text-[#C25B3F] uppercase tracking-wide">
                        {t("menu.item.required", "Required")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {slot.addon_items.map((addon) => {
                      const checked = selected.has(addon.id);
                      const price = getAddonPrice(addon);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddon(slot.id, addon, isMulti)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm transition-all duration-150",
                            checked
                              ? "border-[#0A2540] bg-[#0A2540]/5"
                              : "border-neutral-150 bg-white hover:border-neutral-300"
                          )}
                        >
                          {/* Indicator */}
                          <div
                            className={cn(
                              "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors",
                              isMulti ? "rounded-md" : "rounded-full",
                              checked
                                ? "bg-[#0A2540] border-[#0A2540]"
                                : "bg-white border-neutral-300"
                            )}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                {isMulti ? (
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                  <circle cx="6" cy="6" r="3" fill="currentColor" />
                                )}
                              </svg>
                            )}
                          </div>
                          <span className={cn("flex-1 text-start font-medium", checked ? "text-[#0A2540]" : "text-neutral-700")}>
                            {addon.name}
                          </span>
                          {price > 0 && (
                            <span className="text-xs text-neutral-400 tabular-nums flex-shrink-0">
                              +{fmtMoney(price, { fractionDigits: 0 })}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bottom spacing so footer doesn't overlap last addon */}
            <div className="h-2" />
          </div>

          {/* Sticky footer */}
          <div className="flex-shrink-0 border-t border-neutral-100 px-4 py-4 flex items-center gap-3 bg-white">
            {/* Qty */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 disabled:opacity-30 active:bg-neutral-50 transition-colors"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-[#0A2540] tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 active:bg-neutral-50 transition-colors"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Add button */}
            <button
              ref={(el) => { addBtnRef.current = el; }}
              onClick={handleAdd}
              disabled={!canAdd && item.addon_slots.some((s) => s.is_required)}
              className={cn(
                "flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-between px-4",
                "transition-all duration-150 active:scale-[0.98]",
                canAdd || !item.addon_slots.some((s) => s.is_required)
                  ? "bg-[#0A2540] text-white"
                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              )}
            >
              <span>{t("menu.item.addToCart", "Add to cart")}</span>
              <span className="tabular-nums">{fmtMoney(lineTotal, { fractionDigits: 0 })}</span>
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
