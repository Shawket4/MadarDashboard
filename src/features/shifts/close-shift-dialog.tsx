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
import { Textarea } from "@/components/ui/textarea";
import { useCloseShift } from "@/data/api/generated/api";
import type { Shift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { invalidateShifts } from "./open-shift-dialog";

interface Props {
  shift: Shift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseShiftDialog({ shift, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setCash("");
      setNote("");
    }
  }, [open]);

  const { mutate, isPending } = useCloseShift({
    mutation: {
      onSuccess: () => {
        toast.success(t("shifts.closedToast", "Shift closed"));
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
          <DialogTitle>{t("shifts.closeShift", "Close shift")}</DialogTitle>
          <DialogDescription>{t("shifts.closeDesc", "Count the drawer and declare the closing cash.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closing-cash">{t("shifts.closingCash", "Closing cash (counted)")}</Label>
            <Input
              id="closing-cash"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />
            {shift ? (
              <p className="text-xs text-muted-foreground">
                {t("shifts.openingCash", "Opening cash")}: {fmtMoney(shift.opening_cash)}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="close-note">{t("common.notes", "Notes")}</Label>
            <Textarea id="close-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            loading={isPending}
            disabled={!valid || !shift}
            onClick={() =>
              shift &&
              mutate({
                shiftId: shift.id,
                data: { closing_cash_declared: egpToPiastres(num), cash_note: note || null },
              })
            }
          >
            {t("shifts.closeShift", "Close shift")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
