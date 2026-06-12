import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { fmtMoney } from "@/shared/lib/format";
import { haptic } from "../lib/menu-format";
import type { CartLine } from "../lib/types";

/* Lazy-load Lottie — only fetched when this dialog opens. */
export const loadDotLottie = () => import("@lottiefiles/dotlottie-react");
const DotLottie = lazy(() => loadDotLottie().then((m) => ({ default: m.DotLottieReact })));

/** Order summary the customer shows to the barista (no order is submitted). */
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
        className="light-theme p-0 gap-0 sm:max-w-md max-h-[92vh] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden border-0 flex flex-col bg-white transform-gpu"
        showClose={false}
      >
        <DialogTitle className="sr-only">{t("menu.teller.title")}</DialogTitle>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Hero — Lottie + welcome copy */}
          <div className="bg-slate-50 px-8 pt-8 pb-14 text-slate-900 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.02),transparent_55%)] pointer-events-none" />

            <div className="relative h-36 w-36 sm:h-40 sm:w-40 mx-auto mb-3 animate-in zoom-in-90 duration-500">
              <Suspense fallback={<LottieFallback />}>
                <DotLottieRender />
              </Suspense>
            </div>

            <h2 className="text-2xl font-black tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {t("menu.teller.title")}
            </h2>
            <p className="text-slate-500 font-medium text-[13px] sm:text-sm leading-relaxed max-w-[18rem] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
              {t("menu.teller.subtitle")}
            </p>
          </div>

          {/* Total card (overlapping the hero) */}
          <div className="px-5 sm:px-6 -mt-8 relative z-10">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-5 flex items-center justify-center animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {t("menu.teller.total")}
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-primary tabular-nums mt-1">
                  {fmtMoney(total)}
                </p>
              </div>
            </div>
          </div>

          {/* Order lines */}
          <div className="px-5 sm:px-6 pt-6 pb-2">
            <ul className="space-y-4">
              {cart.map((line, i) => (
                <li
                  key={line.lineId}
                  className="flex justify-between gap-4 animate-in fade-in slide-in-from-bottom-1 duration-500"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: "backwards" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg tabular-nums">
                        {line.quantity}×
                      </span>
                      <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate">
                        {line.itemName}
                      </h4>
                    </div>
                    <div className="mt-1.5 ms-10 space-y-0.5">
                      {line.size && <p className="text-xs text-slate-500 font-bold">{line.size.name}</p>}
                      {line.addons.length > 0 && (
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          {line.addons.map((a) => a.addonName).join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 tabular-nums whitespace-nowrap">
                    {fmtMoney(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Friendly note */}
          <div className="px-5 sm:px-6 pt-6 pb-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-primary flex-shrink-0">
                <Coffee size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {t("menu.teller.noteTitle")}
                </p>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  {t("menu.teller.noteBody")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-5 pt-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)" }}
        >
          <button
            onClick={() => {
              haptic("light");
              onClose();
            }}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black tracking-tight transition active:scale-[0.98]"
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
    <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center border border-slate-200/50 animate-pulse">
      <Coffee size={32} className="text-slate-400" strokeWidth={2} />
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
          className="w-full h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!object-contain"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
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
