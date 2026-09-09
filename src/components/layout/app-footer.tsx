import { useTranslation } from "react-i18next";

import { LegalLinks } from "@/components/legal-links";
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
  const { t } = useTranslation();
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
          <p className="text-xs text-muted-foreground">
            {t("publicShell.poweredBy.generic", "Powered by Madar")}
          </p>
        ) : null}
        <LegalLinks />
      </div>
    </footer>
  );
}
