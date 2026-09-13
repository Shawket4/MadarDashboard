import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listPoReceipts, receivePurchaseOrder, useGetPurchaseOrder } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtDateTime, fmtMoney, fmtNumber, piastresToEgp } from "@/lib/format";
import type { GoodsReceipt } from "@/data/api/generated/models";
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
  const [unitCosts, setUnitCosts] = useState<Record<string, string>>({});
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [activeTab, setActiveTab] = useState("receive");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && po.data) {
      const init: Record<string, string> = {};
      for (const l of po.data.lines) {
        const remaining = l.quantity_ordered - l.quantity_received;
        init[l.id] = remaining > 0 ? String(remaining) : "";
      }
      setReceiving(init);
      setUnitCosts({});
      setActiveTab("receive");
    }
  }, [open, po.data]);

  useEffect(() => {
    if (open && activeTab === "history" && poId) {
      setLoadingReceipts(true);
      listPoReceipts(poId)
        .then(setReceipts)
        .catch(() => setReceipts([]))
        .finally(() => setLoadingReceipts(false));
    }
  }, [open, activeTab, poId]);

  const submit = async () => {
    if (!poId || !po.data) return;
    const lines = po.data.lines
      .map((l) => {
        const qty = parseFloat(receiving[l.id] ?? "");
        if (!Number.isFinite(qty) || qty <= 0) return null;
        const rawCost = unitCosts[l.id]?.trim();
        const unit_cost = rawCost ? egpToPiastres(parseFloat(rawCost)) : null;
        return { line_id: l.id, quantity_received: qty, unit_cost };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
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

  const isPastReceiving = po.data?.status === "received" || po.data?.status === "cancelled";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.purchasing.receiveTitle", "Receive order")}{po.data?.supplier_name ? ` · ${po.data.supplier_name}` : ""}</DialogTitle>
          <DialogDescription>{t("inventory.purchasing.partialHint", "Receive what arrived — the order stays open for the rest.")}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="receive">{t("inventory.purchasing.receive", "Receive")}</TabsTrigger>
            <TabsTrigger value="history">{t("inventory.purchasing.deliveryHistory", "Delivery history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="receive">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.catalog.name", "Name")}</TableHead>
                    <TableHead className="text-end">{t("inventory.purchasing.qtyOrdered", "Ordered")}</TableHead>
                    <TableHead className="text-end">{t("inventory.purchasing.alreadyReceived", "Already")}</TableHead>
                    <TableHead className="text-end">{t("inventory.purchasing.remaining", "Remaining")}</TableHead>
                    <TableHead className="text-end">{t("inventory.purchasing.receiving", "Receiving")}</TableHead>
                    <TableHead className="text-end">{t("inventory.purchasing.invoicePrice", "Invoice price (EGP)")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(po.data?.lines ?? []).map((l) => {
                    const remaining = l.quantity_ordered - l.quantity_received;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.ingredient_name}</TableCell>
                        <TableCell className="text-end font-mono tabular"><bdi>{fmtNumber(l.quantity_ordered)}</bdi> {l.purchase_unit}</TableCell>
                        <TableCell className="text-end font-mono tabular"><bdi>{fmtNumber(l.quantity_received)}</bdi></TableCell>
                        <TableCell className="text-end font-mono tabular"><bdi>{fmtNumber(remaining)}</bdi></TableCell>
                        <TableCell className="text-end">
                          <Input
                            type="number" min="0" step="0.0001"
                            value={receiving[l.id] ?? ""}
                            onChange={(e) => setReceiving((prev) => ({ ...prev, [l.id]: e.target.value }))}
                            disabled={remaining <= 0 || isPastReceiving}
                            className="ms-auto h-8 w-24 tabular"
                          />
                        </TableCell>
                        <TableCell className="text-end">
                          <Input
                            type="number" min="0" step="0.0001"
                            placeholder={l.unit_cost != null ? String(piastresToEgp(l.unit_cost)) : "—"}
                            value={unitCosts[l.id] ?? ""}
                            onChange={(e) => setUnitCosts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                            disabled={remaining <= 0 || isPastReceiving}
                            className="ms-auto h-8 w-28 tabular"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history">
            {loadingReceipts ? (
              <div className="space-y-3 py-2">{Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex justify-between"><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-20" /></div>
                  <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
                </div>
              ))}</div>
            ) : receipts.length === 0 ? (
              <EmptyState className="py-8" title={t("inventory.purchasing.noDeliveries", "No deliveries recorded yet.")} />
            ) : (
              <div className="space-y-3">
                {receipts.map((r) => (
                  <div key={r.id} className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <bdi className="tabular font-medium">{fmtDateTime(r.received_at)}</bdi>
                        {r.is_return ? <StatusPill tone="danger" size="sm">{t("inventory.purchasing.return", "Return")}</StatusPill> : null}
                      </div>
                      <span className="text-muted-foreground">{r.received_by_name ?? r.received_by}</span>
                    </div>
                    <Table>
                      <TableBody>
                        {r.lines.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell>{l.ingredient_name}</TableCell>
                            <TableCell className="text-end font-mono tabular"><bdi>{fmtNumber(l.quantity, { signDisplay: "exceptZero" })}</bdi></TableCell>
                            <TableCell className="text-end font-mono tabular text-muted-foreground"><bdi>{fmtMoney(l.unit_cost)}</bdi></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          {!isPastReceiving ? (
            <Button loading={busy} disabled={po.isLoading} onClick={() => void submit()}>{t("inventory.purchasing.receive", "Receive")}</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
