/**
 * The card the customer ends up holding: what it says, and whether the wallets
 * will actually issue it.
 *
 * The wallet check sits here rather than anywhere else because "there is no Add
 * to Wallet button" is the question this card answers.
 */
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
}: {
  form: UseFormReturn<ProgramValues>;
  branchId: string | null;
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
