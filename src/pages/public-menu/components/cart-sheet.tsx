import { useTranslation } from "react-i18next";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { fmtMoney } from "@/shared/lib/format";
import { ItemImage } from "./item-image";
import { AnimatedMoney } from "./animated-money";
import { haptic } from "../lib/menu-format";
import type { CartLine } from "../lib/types";

/** Reviewable cart with per-line qty controls and the show-to-barista CTA. */
export function CartSheet({
  open,
  onClose,
  cart,
  total,
  onUpdateQty,
  onRemove,
  onShowToBarista,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  total: number;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onShowToBarista: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="light-theme p-0 gap-0 sm:max-w-md max-h-[90vh] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden border-0 flex flex-col bg-white transform-gpu"
        showClose={false}
      >
        <header className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {t("menu.cart.title")}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {t("menu.cart.lines", { count: cart.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("menu.detail.close")}
            className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition active:scale-90"
          >
            <X size={18} className="text-slate-700" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="h-16 w-16 rounded-3xl bg-slate-100 mx-auto flex items-center justify-center text-slate-300">
                <ShoppingBag size={28} />
              </div>
              <p className="text-sm text-slate-500 font-bold px-6">{t("menu.cart.empty")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => (
                <li
                  key={line.lineId}
                  className="bg-slate-50 rounded-2xl p-3 sm:p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  <ItemImage
                    src={line.imageUrl}
                    alt={line.itemName}
                    fallbackName={line.itemName}
                    fallbackVariant="thumb"
                    className="h-16 w-16 rounded-2xl flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {line.itemName}
                        </h4>
                        {line.size && <p className="text-xs text-slate-500 mt-0.5">{line.size.name}</p>}
                        {line.addons.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {line.addons.map((a) => a.addonName).join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemove(line.lineId)}
                        className="text-slate-400 hover:text-red-500 transition p-1 -m-1"
                        aria-label={t("menu.cart.remove")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
                        <button
                          onClick={() => {
                            haptic("light");
                            onUpdateQty(line.lineId, line.quantity - 1);
                          }}
                          className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:scale-90"
                          aria-label={t("menu.detail.decrease")}
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-5 text-center text-sm font-black tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => {
                            haptic("light");
                            onUpdateQty(line.lineId, line.quantity + 1);
                          }}
                          className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:scale-90"
                          aria-label={t("menu.detail.increase")}
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {fmtMoney(line.unitPrice * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <footer
            className="border-t border-slate-100 px-5 sm:px-6 pt-4 space-y-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("menu.cart.total")}
              </span>
              <AnimatedMoney
                value={total}
                className="text-2xl font-black tracking-tight text-slate-900 tabular-nums"
              />
            </div>
            <button
              onClick={() => {
                haptic("medium");
                onClose();
                onShowToBarista();
              }}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black tracking-tight transition active:scale-[0.98] shadow-lg shadow-slate-900/20"
            >
              {t("menu.cart.showToBarista")}
            </button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
