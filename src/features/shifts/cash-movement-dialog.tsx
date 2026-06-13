import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
import { useAddCashMovement } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invalidateShifts } from "./open-shift-dialog";

interface Props {
  shiftId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashMovementDialog({ shiftId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setDirection("in");
      setAmount("");
      setNote("");
    }
  }, [open]);

  const { mutate, isPending } = useAddCashMovement({
    mutation: {
      onSuccess: () => {
        toast.success(t("shifts.cashRecorded", "Cash movement recorded"));
        void invalidateShifts();
        onOpenChange(false);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const num = Number(amount);
  const valid = amount !== "" && Number.isFinite(num) && num > 0 && note.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shifts.cashMovement", "Cash movement")}</DialogTitle>
          <DialogDescription>{t("shifts.cashMovementDesc", "Record cash paid into or taken out of the drawer.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "in" ? "default" : "outline"}
              className={cn(direction === "in" && "bg-success text-success-foreground hover:bg-success/90")}
              onClick={() => setDirection("in")}
            >
              <ArrowDownLeft className="size-4" />
              {t("shifts.cashIn", "Cash in")}
            </Button>
            <Button
              type="button"
              variant={direction === "out" ? "default" : "outline"}
              className={cn(direction === "out" && "bg-destructive text-white hover:bg-destructive/90")}
              onClick={() => setDirection("out")}
            >
              <ArrowUpRight className="size-4" />
              {t("shifts.cashOut", "Cash out")}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-amount">{t("common.amount", "Amount")}</Label>
            <Input id="cm-amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-note">{t("common.notes", "Notes")}</Label>
            <Input id="cm-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("shifts.cashNotePlaceholder", "Reason for this movement")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            loading={isPending}
            disabled={!valid || !shiftId}
            onClick={() =>
              shiftId &&
              mutate({ shiftId, data: { amount: egpToPiastres(num) * (direction === "out" ? -1 : 1), note: note.trim() } })
            }
          >
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
