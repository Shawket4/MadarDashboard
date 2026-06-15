import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVoidOrder } from "@/data/api/generated/api";
import type { Order } from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";
import { getErrorMessage } from "@/data/api/errors";

const VOID_REASONS = ["customer_request", "wrong_order", "quality_issue", "other"] as const;

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidOrderDialog({ order, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>("customer_request");
  const [note, setNote] = useState("");
  const [restore, setRestore] = useState(true);

  const noteRequired = reason === "other";
  const noteMissing = noteRequired && !note.trim();

  const { mutate, isPending } = useVoidOrder({
    mutation: {
      onSuccess: () => {
        toast.success(t("orders.voided", "Order voided"));
        void queryClient.invalidateQueries({ queryKey: ["/orders"] });
        onOpenChange(false);
        setReason("customer_request");
        setNote("");
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const submit = () => {
    if (!order || noteMissing) return;
    mutate({ orderId: order.id, data: { reason, note: note.trim() || null, restore_inventory: restore } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("orders.voidTitle", "Void order")} {order?.order_ref ?? (order ? `#${order.order_number}` : "")}
          </DialogTitle>
          <DialogDescription>
            {t("orders.voidDesc", "This reverses the sale. You can optionally restore the deducted inventory.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("orders.voidReason", "Reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOID_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{t(`orders.voidReasons.${r}`, r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="void-note">
              {t("orders.voidNote", "Note")}{noteRequired ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Textarea
              id="void-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("orders.voidNotePh", "Add details…")}
              rows={3}
            />
            {noteMissing ? <p className="text-xs text-destructive">{t("orders.voidNoteRequired", "A note is required for \"Other\"")}</p> : null}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="restore-inv" className="font-normal">
              {t("orders.restoreInventory", "Restore inventory")}
            </Label>
            <Switch id="restore-inv" checked={restore} onCheckedChange={setRestore} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="destructive" loading={isPending} disabled={noteMissing} onClick={submit}>
            {t("orders.void", "Void order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
