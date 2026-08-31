import { useTranslation } from "react-i18next";

import { LegalLinks } from "@/components/legal-links";

/**
 * Footer for the signed-in application shell.
 *
 * Rendered once in `_app/route.tsx` beneath the `<Outlet />`, so every page
 * inside the shell — orders included — carries the copyright and the privacy
 * link without each route repeating them.
 */
export function AppFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/60 px-4 py-5">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
        </p>
        <LegalLinks />
      </div>
    </footer>
  );
}
