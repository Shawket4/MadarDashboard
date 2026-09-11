/**
 * The bare landing page, on our own generic host. Nobody should arrive here in
 * normal use — joining starts by scanning the code on a counter, which lands on
 * /join/<branchId> — so this says exactly that rather than inventing a branch
 * picker. (Booking has an org-level picker because a guest books from home;
 * nobody joins a loyalty program from home, because the code lives on the
 * counter. On a SHOP's own hostname the index is the shop's sign-up page and
 * this is never shown; see `loyalty/main.tsx`.)
 */
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";

import { StorefrontShell } from "@/features/public-shell/storefront-shell";

export function ScanToJoin() {
  const { t } = useTranslation();
  return (
    <StorefrontShell product="loyalty">
      <div className="flex flex-col items-center gap-5 pt-14 text-center">
        <span className="grid size-16 place-items-center rounded-2xl border border-border/70 bg-card shadow-sm">
          <QrCode className="size-7 text-muted-foreground" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[26px] leading-tight text-balance">
            {t("loyalty.landingTitle", "Scan to join")}
          </h1>
          <p className="mx-auto max-w-[32ch] text-[15px] leading-relaxed text-muted-foreground">
            {t(
              "loyalty.landingBody",
              "Scan the code on the counter to start collecting points on your next order.",
            )}
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
