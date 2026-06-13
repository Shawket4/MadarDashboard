import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { receivePurchaseOrder, useGetPurchaseOrder } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtNumber } from "@/lib/format";
import { invalidateInventory } from "./lib";

interface Props {
  poId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Receive a PO — supports partial multi-shipment (the PO stays open for the rest). */
export function ReceiveDialog({ poId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const po = useGetPurchaseOrder(poId ?? "", { query: { enabled: open && !!poId } });
  const [receiving, setReceiving] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && po.data) {
      const init: Record<string, string> = {};
      for (const l of po.data.lines) {
        const remaining = l.quantity_ordered - l.quantity_received;
        init[l.id] = remaining > 0 ? String(remaining) : "";
      }
      setReceiving(init);
    }
  }, [open, po.data]);

  const submit = async () => {
    if (!poId || !po.data) return;
    const lines = po.data.lines
      .map((l) => ({ line_id: l.id, quantity_received: parseFloat(receiving[l.id] ?? "") }))
      .filter((l) => Number.isFinite(l.quantity_received) && l.quantity_received > 0);
    if (lines.length === 0) return;
    setBusy(true);
    try {
      await receivePurchaseOrder(poId, { lines });
      await invalidateInventory();
      toast.success(t("inventory.purchasing.receive", "Receive"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.purchasing.receiveTitle", "Receive order")}{po.data?.supplier_name ? ` · ${po.data.supplier_name}` : ""}</DialogTitle>
          <DialogDescription>{t("inventory.purchasing.partialHint", "Receive what arrived — the order stays open for the rest.")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.catalog.name", "Name")}</TableHead>
                <TableHead className="text-end">{t("inventory.purchasing.qtyOrdered", "Ordered")}</TableHead>
                <TableHead className="text-end">{t("inventory.purchasing.alreadyReceived", "Already")}</TableHead>
                <TableHead className="text-end">{t("inventory.purchasing.remaining", "Remaining")}</TableHead>
                <TableHead className="text-end">{t("inventory.purchasing.receiving", "Receiving")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(po.data?.lines ?? []).map((l) => {
                const remaining = l.quantity_ordered - l.quantity_received;
                return (
                  <TableRow key={l.id}>
                    <TableCell>{l.ingredient_name}</TableCell>
                    <TableCell className="text-end tabular">{fmtNumber(l.quantity_ordered)} {l.purchase_unit}</TableCell>
                    <TableCell className="text-end tabular">{fmtNumber(l.quantity_received)}</TableCell>
                    <TableCell className="text-end tabular">{fmtNumber(remaining)}</TableCell>
                    <TableCell className="text-end">
                      <Input
                        type="number" min="0" step="0.0001"
                        value={receiving[l.id] ?? ""}
                        onChange={(e) => setReceiving((prev) => ({ ...prev, [l.id]: e.target.value }))}
                        disabled={remaining <= 0}
                        className="ms-auto h-8 w-24 tabular"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={po.isLoading} onClick={() => void submit()}>{t("inventory.purchasing.receive", "Receive")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
