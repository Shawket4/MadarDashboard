/**
 * Forget a member. Admins only — the server refuses anyone else
 * (`handlers::delete_member`), and the button is not offered to them.
 *
 * The confirmation says exactly what goes and what stays (`model::forget`):
 * the person is scrubbed, the books are kept.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

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

export function DeleteMemberButton({
  member,
  onDeleted,
}: {
  member: Pick<MemberView, "id" | "name">;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const del = useDeleteLoyaltyMember();

  const confirm = async () => {
    try {
      await del.mutateAsync({ id: member.id });
      toast.success(t("loyalty.deleted", "Member deleted"));
      // The person goes with the card: the customer lists are stale too.
      await qc.invalidateQueries({ predicate: isPersonQuery });
      setOpen(false);
      onDeleted();
    } catch (e) {
      toast.error(loyaltyServerError(e, t).message);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        {t("loyalty.deleteMember", "Delete member")}
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !del.isPending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("loyalty.deleteTitle", { defaultValue: "Delete {{name}}?", name: member.name })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {t(
                    "loyalty.deleteScrubbed",
                    "Removed: their name, birthday and phone number, their card (the wallet pass stops working) and marketing consent.",
                  )}
                </p>
                <p>
                  {t(
                    "loyalty.deleteKept",
                    "Kept: the points ledger and the orders they earned or redeemed on, so past reports don't change. The phone number can join again as a new member.",
                  )}
                </p>
                <p className="font-medium">{t("loyalty.deleteIrreversible", "This can't be undone.")}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <Button variant="destructive" disabled={del.isPending} onClick={() => void confirm()}>
              {del.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("loyalty.deleteConfirm", "Delete member")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
