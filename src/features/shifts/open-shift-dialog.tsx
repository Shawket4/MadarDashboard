import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOpenShift } from "@/data/api/generated/api";
import { queryClient } from "@/data/api/query";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";

export const invalidateShifts = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/shifts"),
  });

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedCash: number;
}

export function OpenShiftDialog({ branchId, open, onOpenChange, suggestedCash }: Props) {
  const { t } = useTranslation();
  const [cash, setCash] = useState("");

  useEffect(() => {
    if (open) setCash(suggestedCash ? String(piastresToEgp(suggestedCash)) : "");
  }, [open, suggestedCash]);

  const { mutate, isPending } = useOpenShift({
    mutation: {
      onSuccess: () => {
        toast.success(t("shifts.openedToast", "Shift opened"));
        void invalidateShifts();
        onOpenChange(false);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const num = Number(cash);
  const valid = cash !== "" && Number.isFinite(num) && num >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shifts.openShift", "Open shift")}</DialogTitle>
          <DialogDescription>{t("shifts.openDesc", "Declare the opening cash float to start a shift.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="opening-cash">{t("shifts.openingCash", "Opening cash")}</Label>
          <Input
            id="opening-cash"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
          {suggestedCash > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("shifts.suggested", "Suggested")}: {fmtMoney(suggestedCash)}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button loading={isPending} disabled={!valid} onClick={() => mutate({ branchId, data: { opening_cash: egpToPiastres(num) } })}>
            {t("shifts.openShift", "Open shift")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
