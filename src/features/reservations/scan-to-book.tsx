import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { CalendarCheck, ScanLine } from "lucide-react";

import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";

/**
 * The reservations app's landing at `/` (reservations.madar-pos.cloud root),
 * and the fallback for any unrecognized path. There is no org or branch in the
 * URL, so there is no availability to show yet: this prompts the guest to scan
 * the code on the table tent or the door.
 *
 * The ordering app has its own version of this (`ScanToOrder`). They are
 * deliberately NOT the same component: these are separately built, separately
 * deployed bundles, and this one must say "book a table", not "start ordering"
 * — which is what the reservations app used to say, because it imported the
 * ordering one.
 */
export function ScanToBook() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  // Scope the storefront (light-by-default) theme to this page, restoring the
  // dashboard theme on unmount.
  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
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
            <span aria-hidden className="absolute start-3 top-3 size-5 rounded-ss-lg border-s-2 border-t-2 border-brand" />
            <span aria-hidden className="absolute end-3 top-3 size-5 rounded-se-lg border-e-2 border-t-2 border-brand" />
            <span aria-hidden className="absolute bottom-3 start-3 size-5 rounded-es-lg border-s-2 border-b-2 border-brand" />
            <span aria-hidden className="absolute bottom-3 end-3 size-5 rounded-ee-lg border-e-2 border-b-2 border-brand" />

            <CalendarCheck className="size-20 text-foreground/80" strokeWidth={1.25} aria-hidden />

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

        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance text-foreground">
            {t("reservations.scan.title", "Scan to book a table")}
          </h1>
          <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
            {t(
              "reservations.scan.body",
              "Scan the code at the door or on your table to see what times are free.",
            )}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-xs">
          <ScanLine className="size-4 text-brand" />
          {t("reservations.scan.hint", "Point your phone's camera at the Madar code")}
        </div>
      </motion.div>
    </StorefrontShell>
  );
}
