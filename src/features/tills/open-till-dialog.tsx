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
import { useOpenTill } from "./api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedCash: number;
}

export function OpenTillDialog({ branchId, open, onOpenChange, suggestedCash }: Props) {
  const { t } = useTranslation();
  const [cash, setCash] = useState("");

  useEffect(() => {
    if (open) setCash(suggestedCash ? String(piastresToEgp(suggestedCash)) : "");
  }, [open, suggestedCash]);

  const { mutate, isPending } = useOpenTill();

  const num = Number(cash);
  const valid = cash !== "" && Number.isFinite(num) && num >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tills.openShift", "Open till")}</DialogTitle>
          <DialogDescription>{t("tills.openDesc", "Declare the opening drawer float to start a till.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="opening-cash">{t("tills.openingCash", "Opening cash")}</Label>
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
              {t("tills.suggested", "Suggested")}: {fmtMoney(suggestedCash)}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button loading={isPending} disabled={!valid} onClick={() => mutate(
                { branchId, data: { opening_cash: egpToPiastres(num) } },
                {
                  onSuccess: () => {
                    toast.success(t("tills.openedToast", "Till opened"));
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getErrorMessage(e)),
                },
              )}>
            {t("tills.openShift", "Open till")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
