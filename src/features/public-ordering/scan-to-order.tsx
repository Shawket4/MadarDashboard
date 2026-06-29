import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { QrCode, ScanLine } from "lucide-react";

import { useOrderTheme } from "./use-order-theme";
import { StorefrontShell } from "./storefront-shell";

/**
 * The order app's landing / empty state at `/` (order.madar-pos.cloud root) — and
 * the fallback for any unrecognized path. There's no org/branch in the URL, so
 * there's nothing to order yet: this prompts the customer to scan the QR on their
 * table or at the branch. A brand surface (editorial, hospitable), bilingual, and
 * reduced-motion correct.
 */
export function ScanToOrder() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  // Scope the storefront (light-by-default) theme to this page like the rest of
  // the ordering flow, restoring the dashboard theme on unmount.
  useLayoutEffect(() => {
    useOrderTheme.getState().apply();
    return () => useOrderTheme.getState().restoreGlobal();
  }, []);

  return (
    <StorefrontShell>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex min-h-[58vh] flex-col items-center justify-center gap-8 text-center"
      >
        {/* QR viewfinder */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/15 blur-2xl"
          />
          <div className="relative grid size-44 place-items-center overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-lg">
            {/* viewfinder corner brackets (brand) */}
            <span aria-hidden className="absolute start-3 top-3 size-5 rounded-ss-lg border-s-2 border-t-2 border-brand" />
            <span aria-hidden className="absolute end-3 top-3 size-5 rounded-se-lg border-e-2 border-t-2 border-brand" />
            <span aria-hidden className="absolute bottom-3 start-3 size-5 rounded-es-lg border-s-2 border-b-2 border-brand" />
            <span aria-hidden className="absolute bottom-3 end-3 size-5 rounded-ee-lg border-e-2 border-b-2 border-brand" />

            <QrCode className="size-20 text-foreground/80" strokeWidth={1.25} aria-hidden />

            {/* scan line — sweeps under reduced-motion-off; otherwise rests centered */}
            <motion.span
              aria-hidden
              className="absolute inset-x-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent"
              initial={reduced ? { top: "50%" } : { top: "20%" }}
              animate={reduced ? { top: "50%" } : { top: ["20%", "80%", "20%"] }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance text-foreground">
            {t("order.scan.title", "Scan to order")}
          </h1>
          <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
            {t("order.scan.body", "Scan the QR code at your table or branch to start ordering.")}
          </p>
        </div>

        {/* Hint pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-xs">
          <ScanLine className="size-4 text-brand" />
          {t("order.scan.hint", "Point your phone's camera at the Madar code")}
        </div>
      </motion.div>
    </StorefrontShell>
  );
}
