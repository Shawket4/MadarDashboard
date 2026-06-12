import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { fmtMoney } from "@/shared/lib/format";
import type { CartLine } from "../lib/types";
import { BottomSheet } from "./bottom-sheet";
import { ItemImage } from "./item-image";
import { AnimatedMoney } from "./animated-money";

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  total: number;
  onUpdateQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onShowToBarista: () => void;
}

export function CartSheet({
  open,
  onClose,
  cart,
  total,
  onUpdateQty,
  onRemove,
  onShowToBarista,
}: Props) {
  const { t } = useTranslation();
  const isEmpty = cart.length === 0;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={t("menu.cart.title", "Your order")} maxHeightClass="max-h-[85dvh]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Title */}
        <div className="px-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-[#0A2540]">{t("menu.cart.title", "Your order")}</h2>
        </div>

        {isEmpty ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-10 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
              <UtensilsCrossed size={24} className="text-neutral-300" />
            </div>
            <p className="font-semibold text-[#0A2540]">{t("menu.cart.empty", "Nothing here yet")}</p>
            <p className="text-sm text-neutral-400">{t("menu.cart.emptyHint", "Add items from the menu to start your order.")}</p>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-2 space-y-2 pm-sheet-inner">
              {cart.map((line) => (
                <div
                  key={line.lineId}
                  className="flex gap-3 bg-neutral-50 rounded-2xl p-3"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                    <ItemImage src={line.imageUrl} name={line.itemName} className="w-full h-full" skeleton={false} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-[#0A2540] leading-snug truncate">
                      {line.itemName}
                    </p>
                    {line.size && (
                      <p className="text-xs text-neutral-400">{line.size.name}</p>
                    )}
                    {line.addons.length > 0 && (
                      <p className="text-xs text-neutral-400 truncate">
                        {line.addons.map((a) => a.addonName).join(", ")}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-[#C25B3F] tabular-nums">
                      {fmtMoney(line.unitPrice * line.quantity, { fractionDigits: 0 })}
                    </p>
                  </div>

                  {/* Qty + remove */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <button
                      onClick={() => onRemove(line.lineId)}
                      className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQty(line.lineId, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 disabled:opacity-30 bg-white"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-sm font-semibold text-[#0A2540] w-4 text-center tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(line.lineId, line.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 bg-white"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-neutral-100 px-5 pt-4 pb-5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">{t("menu.cart.total", "Total")}</span>
                <AnimatedMoney value={total} className="text-lg font-bold text-[#0A2540] tabular-nums" />
              </div>
              <button
                onClick={() => { onClose(); onShowToBarista(); }}
                className="w-full h-13 rounded-2xl bg-[#C25B3F] text-white font-semibold text-sm active:opacity-90 active:scale-[0.98] transition-all duration-100"
              >
                {t("menu.cart.showToBarista", "Show to barista")} ☕
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
