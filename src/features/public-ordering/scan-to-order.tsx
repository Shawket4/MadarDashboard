import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, ScanLine } from "lucide-react";

import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { useScanSweep } from "@/features/public-shell/use-scan-sweep";
import { Reveal } from "@/lib/motion";

/**
 * The order app's landing / empty state at `/` (order.madar-pos.cloud root) — and
 * the fallback for any unrecognized path. There's no org/branch in the URL, so
 * there's nothing to order yet: this prompts the customer to scan the QR on their
 * table or at the branch. A brand surface (editorial, hospitable), bilingual, and
 * reduced-motion correct.
 */
export function ScanToOrder() {
  const { t } = useTranslation();
  const line = useRef<HTMLSpanElement>(null);
  useScanSweep(line);

  // Nothing in this URL says which shop, so the only thing that can: the
  // host. On a shop's own domain the landing wears their mark; on our
  // generic origin it stays Madar's, which is what it has always been.
  const brand = usePublicBrand();

  // Scope the storefront (light-by-default) theme to this page like the rest of
  // the ordering flow, restoring the dashboard theme on unmount.
  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
  }, []);

  return (
    <StorefrontShell brand={brand} product="ordering">
      <Reveal
        register="brand"
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
            <span
              ref={line}
              aria-hidden
              className="absolute inset-x-6 top-1/2 h-0.5 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent"
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
      </Reveal>
    </StorefrontShell>
  );
}
