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
import { WalletStatusPanel } from "./wallet-status";

export function PassesCard({
  form,
  branchId,
}: {
  form: UseFormReturn<ProgramValues>;
  branchId: string | null;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <TextRow
          form={form}
          name="terms"
          label={t("loyalty.terms", "Terms (shown on the pass)")}
        />
        <div className="border-t pt-4">
          <WalletStatusPanel branchId={branchId} />
        </div>
      </CardContent>
    </Card>
  );
}
