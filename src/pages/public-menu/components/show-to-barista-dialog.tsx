import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { fmtMoney } from "@/shared/lib/format";
import { haptic } from "../lib/menu-format";
import type { CartLine } from "../lib/types";

export const loadDotLottie = () => import("@lottiefiles/dotlottie-react");
const DotLottie = lazy(() => loadDotLottie().then((m) => ({ default: m.DotLottieReact })));

export function ShowToBaristaDialog({
  open,
  onClose,
  cart,
  total,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  total: number;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="light-theme p-0 gap-0 sm:max-w-md max-h-[92dvh] rounded-t-[28px] sm:rounded-[28px] overflow-hidden border-0 flex flex-col bg-white"
        showClose={false}
      >
        <DialogTitle className="sr-only">{t("menu.teller.title")}</DialogTitle>

        <div className="flex-1 overflow-y-auto overscroll-contain pm-sheet-inner">
          {/* Hero */}
          <div className="bg-cream px-8 pt-8 pb-14 text-center relative overflow-hidden">
            <div className="relative h-36 w-36 mx-auto mb-4 animate-in zoom-in-90 duration-500">
              <Suspense fallback={<LottieFallback />}>
                <DotLottieRender />
              </Suspense>
            </div>

            <h2 className="text-2xl font-black text-[#0A2540] tracking-tight mb-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {t("menu.teller.title")}
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-[18rem] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
              {t("menu.teller.subtitle")}
            </p>
          </div>

          {/* Total card — overlaps hero */}
          <div className="px-5 -mt-8 relative z-10">
            <div className="bg-white rounded-3xl shadow-lg border border-neutral-100 p-5 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                {t("menu.teller.total")}
              </p>
              <p className="text-3xl font-black text-[#0A2540] tabular-nums mt-1">
                {fmtMoney(total)}
              </p>
            </div>
          </div>

          {/* Order lines */}
          <div className="px-5 pt-6 pb-2">
            <ul className="space-y-3.5">
              {cart.map((line, i) => (
                <li
                  key={line.lineId}
                  className="flex justify-between gap-4 animate-in fade-in slide-in-from-bottom-1 duration-400"
                  style={{ animationDelay: `${Math.min(i * 40, 240)}ms`, animationFillMode: "backwards" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#C25B3F] bg-[#C25B3F]/10 px-2 py-0.5 rounded-md tabular-nums">
                        {line.quantity}×
                      </span>
                      <span className="font-semibold text-[#0A2540] text-sm leading-tight truncate">
                        {line.itemName}
                      </span>
                    </div>
                    {(line.size || line.addons.length > 0) && (
                      <div className="mt-1 ms-9 space-y-0.5">
                        {line.size && (
                          <p className="text-xs text-neutral-500">{line.size.name}</p>
                        )}
                        {line.addons.length > 0 && (
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {line.addons.map((a) => a.addonName).join(" · ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#0A2540] tabular-nums whitespace-nowrap flex-shrink-0">
                    {fmtMoney(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Friendly note */}
          <div className="px-5 pt-5 pb-6">
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-neutral-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white shadow-sm border border-neutral-100 flex items-center justify-center text-[#0A2540] flex-shrink-0">
                <Coffee size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0A2540] uppercase tracking-wide">
                  {t("menu.teller.noteTitle")}
                </p>
                <p className="text-xs text-neutral-500 leading-snug mt-0.5">
                  {t("menu.teller.noteBody")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-neutral-100 bg-white">
          <button
            onClick={() => { haptic("light"); onClose(); }}
            className="w-full h-13 bg-[#0A2540] text-white rounded-2xl font-semibold text-sm active:opacity-90 active:scale-[0.98] transition-all duration-100"
          >
            {t("menu.teller.done")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LottieFallback() {
  return (
    <div className="h-full w-full bg-neutral-100 rounded-full flex items-center justify-center animate-pulse">
      <Coffee size={32} className="text-neutral-300" strokeWidth={2} />
    </div>
  );
}

function DotLottieRender() {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {(!loaded || failed) && <LottieFallback />}
      {!failed && (
        <DotLottie
          src="/ShowTellerCup.lottie"
          loop
          autoplay
          className="w-full h-full"
          style={{
            width: "100%",
            height: "100%",
            display: loaded ? "block" : "none",
          }}
          renderConfig={{
            devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
            autoResize: true,
          }}
          dotLottieRefCallback={(instance) => {
            if (!instance) return;
            instance.addEventListener("load", () => setLoaded(true));
            instance.addEventListener("loadError", () => setFailed(true));
          }}
        />
      )}
    </div>
  );
}
