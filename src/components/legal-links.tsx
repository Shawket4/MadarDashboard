import { useTranslation } from "react-i18next";

import { LEGAL_URLS } from "@/config/legal";
import { cn } from "@/lib/utils";

/**
 * Privacy / Terms links for footers and the sign-in screen.
 *
 * Opens in a new tab: the legal site is a separate static origin, and on the
 * customer ordering flow navigating away mid-order would lose the cart.
 */
export function LegalLinks({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("legal.label", "Legal")}
      className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80", className)}
    >
      <a
        href={LEGAL_URLS.privacy}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        {t("legal.privacy", "Privacy Policy")}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={LEGAL_URLS.terms}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-2 hover:text-foreground hover:underline"
      >
        {t("legal.terms", "Terms of Service")}
      </a>
    </nav>
  );
}
