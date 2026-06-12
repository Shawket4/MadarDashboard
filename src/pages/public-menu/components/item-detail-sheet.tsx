import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Minus, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney } from "@/shared/lib/format";
import type { PublicAddonSlot, PublicMenuItem } from "@/shared/api/generated/models";
import { BottomSheet } from "./bottom-sheet";
import { ItemImage } from "./item-image";
import { AnimatedMoney } from "./animated-money";
import { Section } from "./section";
import { getAddonPrice, getSizePrice, haptic, lineSignature, uid } from "../lib/menu-format";
import type { CartLine, ID } from "../lib/types";

/**
 * Shell that keeps the sheet mounted through the close transition while the
 * inner body is keyed by item id (so it resets cleanly on every open).
 */
export function ItemDetailSheet({
  item,
  onClose,
  onAdd,
}: {
  item: PublicMenuItem | null;
  onClose: () => void;
  onAdd: (line: CartLine, sourceEl: HTMLElement | null) => void;
}) {
  const [localItem, setLocalItem] = useState<PublicMenuItem | null>(null);

  useEffect(() => {
    if (item) setLocalItem(item);
  }, [item]);

  return (
    <BottomSheet open={!!item} onClose={onClose} ariaLabel={localItem?.name}>
      {localItem && (
        <ItemDetailBody key={String(localItem.id)} item={localItem} onClose={onClose} onAdd={onAdd} />
      )}
    </BottomSheet>
  );
}

function ItemDetailBody({
  item,
  onClose,
  onAdd,
}: {
  item: PublicMenuItem;
  onClose: () => void;
  onAdd: (line: CartLine, sourceEl: HTMLElement | null) => void;
}) {
  const { t } = useTranslation();
  const [sizeId, setSizeId] = useState<ID | undefined>(item.sizes?.[0]?.id);
  const [selected, setSelected] = useState<Map<ID, Set<ID>>>(new Map());
  const [qty, setQty] = useState(1);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const size = useMemo(() => item.sizes?.find((s) => s.id === sizeId), [item.sizes, sizeId]);
  const sizePrice = useMemo(() => getSizePrice(item.base_price, size), [item.base_price, size]);

  const addonsCost = useMemo(() => {
    if (!item.addon_slots) return 0;
    let total = 0;
    for (const slot of item.addon_slots) {
      const picks = selected.get(slot.id);
      if (!picks) continue;
      for (const addonId of picks) {
        const a = slot.addon_items.find((x) => x.id === addonId);
        if (a) total += getAddonPrice(a);
      }
    }
    return total;
  }, [item.addon_slots, selected]);

  const unitPrice = sizePrice + addonsCost;
  const lineTotal = unitPrice * qty;

  const toggleAddon = (slot: PublicAddonSlot, addonId: ID) => {
    haptic("light");
    setSelected((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(slot.id) ?? []);
      const max = slot.max_selections ?? Infinity;
      const isRadio = max === 1;

      if (current.has(addonId)) {
        current.delete(addonId);
      } else if (isRadio) {
        current.clear();
        current.add(addonId);
      } else if (current.size < max) {
        current.add(addonId);
      } else {
        return prev;
      }
      next.set(slot.id, current);
      return next;
    });
  };

  const handleAdd = () => {
    const addonLines: CartLine["addons"] = [];
    const addonIds: ID[] = [];
    for (const slot of item.addon_slots ?? []) {
      for (const aid of selected.get(slot.id) ?? []) {
        const a = slot.addon_items.find((x) => x.id === aid);
        if (!a) continue;
        addonIds.push(a.id);
        addonLines.push({
          slotId: slot.id,
          slotName: slot.label ?? "",
          addonId: a.id,
          addonName: a.name,
          price: getAddonPrice(a),
        });
      }
    }

    const line: CartLine = {
      lineId: uid(),
      signature: lineSignature(item.id, size?.id, addonIds),
      itemId: item.id,
      itemName: item.name,
      imageUrl: item.image_url,
      size: size ? { id: size.id, name: size.label } : undefined,
      addons: addonLines,
      unitPrice,
      quantity: qty,
    };
    onAdd(line, imageRef.current);
  };

  return (
    <>
      {/* Hero — real image or typographic mockup */}
      <div className="relative" ref={imageRef}>
        <ItemImage
          src={item.image_url}
          alt={item.name}
          fallbackName={item.name}
          fallbackVariant="hero"
          className="w-full h-48 sm:h-64 bg-slate-100"
          priority
        />
        {item.image_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/0 to-transparent pointer-events-none" />
        )}

        <button
          onClick={() => {
            haptic("light");
            onClose();
          }}
          aria-label={t("menu.detail.close")}
          className="absolute top-2 end-3 sm:top-4 sm:end-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition"
        >
          <X size={20} className="text-slate-800" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pt-3 pb-6 space-y-6 sm:space-y-7">
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{item.name}</h2>
          {item.description && (
            <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Sizes */}
        {item.sizes && item.sizes.length > 0 && (
          <Section title={t("menu.detail.size")}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.sizes.map((s) => {
                const active = sizeId === s.id;
                const price = getSizePrice(item.base_price, s);
                return (
                  <button
                    key={String(s.id)}
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setSizeId(s.id);
                    }}
                    className={cn(
                      "rounded-2xl border-2 px-4 py-3 text-start transition-all active:scale-[0.97] min-h-[60px]",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{s.label}</span>
                      {active && (
                        <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 animate-in zoom-in-50 duration-200">
                          <Check size={12} strokeWidth={4} />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-1 block tabular-nums">
                      {fmtMoney(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Addon slots */}
        {item.addon_slots?.map((slot) => {
          const max = slot.max_selections ?? Infinity;
          const min = slot.min_selections ?? 0;
          const picks = selected.get(slot.id) ?? new Set<ID>();
          const isRadio = max === 1;
          const reachedMax = picks.size >= max;

          let subtitle: string;
          if (isRadio && min > 0) {
            subtitle = t("menu.detail.requiredChooseOne");
          } else if (min > 0 && Number.isFinite(max)) {
            subtitle =
              min === max
                ? t("menu.detail.requiredChooseExact", { count: min })
                : t("menu.detail.requiredChooseRange", { min, max });
          } else if (Number.isFinite(max)) {
            subtitle = t("menu.detail.chooseUpTo", { max });
          } else {
            subtitle = t("menu.detail.optional");
          }

          return (
            <Section key={String(slot.id)} title={slot.label ?? ""} subtitle={subtitle}>
              <div className="space-y-2">
                {slot.addon_items.map((a) => {
                  const checked = picks.has(a.id);
                  const disabled = !checked && reachedMax && !isRadio;
                  const price = getAddonPrice(a);
                  return (
                    <button
                      key={String(a.id)}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleAddon(slot, a.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border-2 transition-all active:scale-[0.99] min-h-[56px]",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-white hover:border-slate-300",
                        disabled && "opacity-40 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex-shrink-0 flex items-center justify-center transition-all h-5 w-5 border-2",
                            isRadio ? "rounded-full" : "rounded-md",
                            checked ? "border-primary bg-primary text-white" : "border-slate-300 bg-white",
                          )}
                        >
                          {checked &&
                            (isRadio ? (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            ) : (
                              <Check size={12} strokeWidth={4} />
                            ))}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm text-start">{a.name}</span>
                      </div>
                      {price > 0 && (
                        <span className="text-xs font-black text-slate-500 tabular-nums">
                          +{fmtMoney(price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>
          );
        })}

        {/* Quantity */}
        <Section title={t("menu.detail.quantity")}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic("light");
                setQty((q) => Math.max(1, q - 1));
              }}
              className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black transition active:scale-90 disabled:opacity-40"
              disabled={qty <= 1}
              aria-label={t("menu.detail.decrease")}
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="text-2xl font-black w-10 text-center tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => {
                haptic("light");
                setQty((q) => Math.min(99, q + 1));
              }}
              className="h-12 w-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-black transition active:scale-90"
              aria-label={t("menu.detail.increase")}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </Section>
      </div>

      {/* Sticky footer with animated price */}
      <div
        className="border-t border-slate-100 bg-white px-4 sm:px-5 py-3 sm:py-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)" }}
      >
        <button
          onClick={handleAdd}
          className="w-full h-14 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-between px-5 sm:px-6 font-black text-sm sm:text-base transition-all active:scale-[0.98] bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
        >
          <span className="tracking-tight">{t("menu.detail.addToOrder", { count: qty })}</span>
          <AnimatedMoney value={lineTotal} className="tracking-tight tabular-nums ms-3 flex-shrink-0" />
        </button>
      </div>
    </>
  );
}
