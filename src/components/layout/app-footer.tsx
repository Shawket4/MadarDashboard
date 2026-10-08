import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LegalLinks } from "@/components/legal-links";
import { madarSiteHref } from "@/features/public-shell/madar-site";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { useOrgId } from "@/hooks/use-org-id";

/**
 * Footer for the signed-in application shell.
 *
 * Rendered once in `_app/route.tsx` beneath the `<Outlet />`, so every page
 * inside the shell — orders included — carries the copyright and the privacy
 * link without each route repeating them.
 */
export function AppFooter() {
  const { t, i18n } = useTranslation();
  const brand = usePublicBrand(useOrgId());
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/60 px-4 py-5">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
        </p>
        {/* The signature the branding tier does not buy off. A shop wearing
            its own mark on the rail above still says whose software this is,
            here and only here — the same bargain the customer-facing pages
            make. */}
        {brand?.ownBranding ? (
          <a
            href={madarSiteHref(i18n.resolvedLanguage ?? i18n.language ?? "en", "dashboard", "dashboard")}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 outline-none transition-colors hover:text-foreground hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("publicShell.poweredBy.generic", "Powered by Madar")}
            <ArrowUpRight aria-hidden className="size-3 rtl:-scale-x-100" />{" "}
            <span className="sr-only">{t("common.opensInNewTab", "(opens in a new tab)")}</span>
          </a>
        ) : null}
        <LegalLinks />
      </div>
    </footer>
  );
}
