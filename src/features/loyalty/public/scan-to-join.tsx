/**
 * The bare landing page. Nobody should arrive here in normal use — joining
 * starts by scanning the code on a counter, which lands on /join/<branchId> —
 * so this says exactly that rather than inventing a branch picker. (Booking has
 * an org-level picker because a guest books from home; nobody joins a loyalty
 * program from home, because the code lives on the counter.)
 */
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";

import { StorefrontShell } from "@/features/public-shell/storefront-shell";

export function ScanToJoin() {
  const { t } = useTranslation();
  return (
    <StorefrontShell product="loyalty">
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border/70 bg-card">
          <QrCode className="size-7 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-2xl">{t("loyalty.landingTitle", "Scan to join")}</h1>
        <p className="max-w-[300px] text-sm text-muted-foreground">
          {t(
            "loyalty.landingBody",
            "Scan the code on the counter to start collecting points on your next order.",
          )}
        </p>
      </div>
    </StorefrontShell>
  );
}
