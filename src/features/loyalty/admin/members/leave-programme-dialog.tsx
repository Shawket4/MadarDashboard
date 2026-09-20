/**
 * Take someone out of the loyalty programme. `DELETE /loyalty/members/{id}`
 * ends the MEMBERSHIP and nothing else: the card stops working, the customer
 * and everything they ordered stay, and joining again restores the same id and
 * the same balance. Wiping the person is a different act with its own
 * capability — Erase, on the customer.
 *
 * The button is offered only to someone holding `loyalty.members.delete`; the
 * server refuses anyone else.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserMinus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteLoyaltyMember } from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";

import { isPersonQuery } from "@/features/customers/util";

import { loyaltyServerError } from "../../shared/server-errors";

export function LeaveProgrammeButton({
  member,
  onLeft,
}: {
  member: Pick<MemberView, "id" | "name">;
  onLeft: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const leave = useDeleteLoyaltyMember();

  const confirm = async () => {
    try {
      await leave.mutateAsync({ id: member.id });
      toast.success(t("loyalty.leave.done", "Removed from the loyalty programme"));
      // The customer is still there, no longer a member: every list of people is stale.
      await qc.invalidateQueries({ predicate: isPersonQuery });
      setOpen(false);
      onLeft();
    } catch (e) {
      toast.error(loyaltyServerError(e, t).message);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserMinus className="size-4" />
        {t("loyalty.leave.action", "Remove from loyalty programme")}
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !leave.isPending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("loyalty.leave.title", { defaultValue: "Remove {{name}} from the loyalty programme?", name: member.name })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {t(
                    "loyalty.leave.stops",
                    "Their card stops working: the wallet pass is withdrawn and they no longer earn or redeem.",
                  )}
                </p>
                <p>
                  {t(
                    "loyalty.leave.stays",
                    "They stay a customer. Their orders, their history and the points ledger are untouched.",
                  )}
                </p>
                <p>
                  {t(
                    "loyalty.leave.rejoin",
                    "If they join again with the same number, they get their balance back.",
                  )}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leave.isPending}>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <Button disabled={leave.isPending} onClick={() => void confirm()}>
              {leave.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("loyalty.leave.confirm", "Remove from programme")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
