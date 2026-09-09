/**
 * The card the customer ends up holding: what it says, and whether the wallets
 * will actually issue it.
 *
 * The wallet check sits here rather than anywhere else because "there is no Add
 * to Wallet button" is the question this card answers.
 */
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";

import type { ProgramValues } from "./form-schema";
import { TextRow } from "./fields";
import { useAuthStore } from "@/data/stores/auth.store";

import { WalletStatusPanel } from "./wallet-status";

export function PassesCard({
  form,
  branchId,
  geofencedBranches,
}: {
  form: UseFormReturn<ProgramValues>;
  branchId: string | null;
  /** Active branches with coordinates set. Zero means no card can ever notify. */
  geofencedBranches: number;
}) {
  const { t } = useTranslation();
  const isSuperAdmin = useAuthStore((s) => s.user?.role) === "super_admin";
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <TextRow
          form={form}
          name="terms"
          label={t("loyalty.terms", "Terms (shown on the pass)")}
        />

        {/* The reason a saved card never notifies anyone.
            Both wallets geofence from the branch coordinates carried on the
            pass, so a shop whose branches have none gets no location prompt on
            the phone and no nearby notification — and nothing said so, which
            reads as the wallet being broken rather than as a field nobody
            filled in. It is shown to the shop, not to super admins, because
            unlike the panel below it is the shop's own data and their fix. */}
        {geofencedBranches === 0 ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("loyalty.noGeofence", "Cards will not notify customers nearby")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "loyalty.noGeofenceHint",
                  "Apple and Google surface a saved card when the customer is at your shop, using the branch coordinates on the pass. No branch has any set, so the phone never asks for location and the card stays silent. Add them on the Branches page.",
                )}
              </p>
            </div>
          </div>
        ) : null}
        {/* Super admin only, and not because it is dangerous — because it is
            not the shop's business. It names Madar's environment variables and
            reports what Apple and Google said about our service accounts;
            "LOYALTY_GOOGLE_SA_KEY_FILE is not set" tells an org manager nothing
            they can act on and everything about plumbing they never asked to
            know. The endpoint refuses them too. */}
        {isSuperAdmin ? (
          <div className="border-t pt-4">
            <WalletStatusPanel branchId={branchId} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
