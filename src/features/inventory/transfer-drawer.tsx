import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ArrowRight, Ban, Check, PackageCheck, Pencil, Send, Warehouse, X } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { useAuthzAt } from "@/data/authz/use-authz";
import type { Branch, StockTransfer, TransferStamp } from "@/data/api/generated/models";
import { cancelStockTransfer, declineTransfer, dispatchTransfer, receiveTransfer } from "@/data/api/generated/api";
import { getErrorMessage, isStaleRefusal } from "@/data/api/errors";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { TRANSFER_TONES, invalidateInventory, milli, transferActions } from "./lib";
import { TransferDialog, type TransferDialogMode } from "./transfer-dialog";

interface Props {
  transfer: StockTransfer | null;
  onOpenChange: (open: boolean) => void;
  onChanged: (t: StockTransfer) => void;
  branches: Branch[];
  myBranchIds: Set<string>;
}

export function transferStatusLabel(t: TFunction, status: string) {
  const labels: Record<string, string> = {
    requested: t("inventory.transfers.status.requested", "Requested"),
    draft: t("inventory.transfers.status.draft", "Draft"),
    dispatched: t("inventory.transfers.status.dispatched", "In transit"),
    received: t("inventory.transfers.status.received", "Received"),
    cancelled: t("inventory.transfers.status.cancelled", "Cancelled"),
  };
  return labels[status] ?? status;
}

/** One transfer: its lines, who did what, and the next step for this person. */
export function TransferDrawer({ transfer: tr, onOpenChange, onChanged, branches, myBranchIds }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  // Each step is checked at its side's location, so read what's held at each.
  const atSource = useAuthzAt(tr?.source_branch_id);
  const atDest = useAuthzAt(tr?.destination_branch_id);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<TransferDialogMode | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [closing, setClosing] = useState<"decline" | "cancel" | null>(null);

  if (!tr) return <Sheet open={false} onOpenChange={onOpenChange} />;
  const actions = transferActions(tr, myBranchIds, (cap, at) => (at === tr.source_branch_id ? atSource : atDest).can(cap));
  const received = tr.status === "received";
  const loss = received
    ? tr.lines.reduce((s, l) => (l.unit_cost != null && l.qty_received != null ? s + (l.qty_received - l.qty_sent) * l.unit_cost : s), 0)
    : 0;

  const act = async (fn: () => Promise<StockTransfer>, done: string) => {
    setBusy(true);
    try {
      const next = await fn();
      await invalidateInventory();
      toast.success(done);
      onChanged(next);
    } catch (e) {
      toast.error(getErrorMessage(e));
      if (isStaleRefusal(e)) void invalidateInventory();
    } finally {
      setBusy(false);
    }
  };

  const onDispatch = async () => {
    if (await confirm({
      title: t("inventory.transfers.dispatchConfirm", { ref: tr.reference, defaultValue: `Send ${tr.reference}?` }),
      description: t("inventory.transfers.dispatchConsequence", { from: tr.source_branch_name, defaultValue: `The stock leaves ${tr.source_branch_name} now and is in transit until it's received.` }),
      confirmLabel: t("inventory.transfers.sendNow", "Send now"),
    })) await act(() => dispatchTransfer(tr.id), t("inventory.transfers.dispatchedToast", "Transfer sent"));
  };

  const stamp = (label: string, s?: TransferStamp | null) =>
    s ? (
      <li className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-end">{s.by_name} · {fmtDateTime(s.at)}</span>
      </li>
    ) : null;

  return (
    <>
      <Sheet open={!!tr} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="font-mono">{tr.reference}</span>
              <StatusPill tone={TRANSFER_TONES[tr.status] ?? "neutral"}>{transferStatusLabel(t, tr.status)}</StatusPill>
            </SheetTitle>
            <SheetDescription className="flex items-center gap-1.5">
              {tr.source_kind === "warehouse" ? <Warehouse className="size-3.5" /> : null}
              {tr.source_branch_name}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
              {tr.destination_kind === "warehouse" ? <Warehouse className="size-3.5" /> : null}
              {tr.destination_branch_name}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1 px-4">
            <div className="space-y-5 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 text-start font-medium">{t("inventory.transfers.ingredient", "Ingredient")}</th>
                    <th className="py-2 text-end font-medium">{tr.status === "requested" ? t("inventory.transfers.asked", "Asked") : t("inventory.transfers.sent", "Sent")}</th>
                    {received ? <th className="py-2 text-end font-medium">{t("inventory.transfers.received", "Received")}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {tr.lines.map((l) => {
                    const diff = l.qty_received != null ? l.qty_received - l.qty_sent : 0;
                    return (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2">
                          <span className="font-medium">{l.ingredient_name}</span>
                          {l.note ? <span className="block text-xs text-muted-foreground">{l.note}</span> : null}
                        </td>
                        <td className="tabular py-2 text-end">{fmtNumber(l.qty_sent)} {fmtUnit(l.unit)}</td>
                        {received ? (
                          <td className="tabular py-2 text-end">
                            {fmtNumber(l.qty_received)} {fmtUnit(l.unit)}
                            {Math.abs(diff) > 1e-9 ? (
                              <span className={diff < 0 ? "block text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]" : "block text-xs text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]"}>
                                {diff > 0 ? "+" : ""}{fmtNumber(diff)}
                              </span>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {received && Math.abs(loss) > 0.5 ? (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  {loss < 0
                    ? t("inventory.transfers.transitLoss", { value: fmtMoney(-loss), defaultValue: `Lost in transit: ${fmtMoney(-loss)}` })
                    : t("inventory.transfers.transitGain", { value: fmtMoney(loss), defaultValue: `More arrived than was sent: ${fmtMoney(loss)}` })}
                </p>
              ) : null}

              {tr.note ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("inventory.transfers.note", "Note")}</p>
                  <p className="whitespace-pre-line text-sm">{tr.note}</p>
                </div>
              ) : null}

              <ul className="space-y-1.5">
                {stamp(tr.requested ? t("inventory.transfers.requestedBy", "Requested") : t("inventory.transfers.createdBy", "Created"), tr.requested ?? tr.created)}
                {stamp(t("inventory.transfers.dispatchedBy", "Sent"), tr.dispatched)}
                {stamp(t("inventory.transfers.receivedBy", "Received"), tr.received)}
                {stamp(t("inventory.transfers.cancelledBy", "Cancelled"), tr.cancelled)}
              </ul>
            </div>
          </ScrollArea>

          {actions.length ? (
            <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t">
              {actions.includes("cancel") ? (
                <Button variant="ghost" disabled={busy} onClick={() => setClosing("cancel")}>
                  <Ban className="size-4" />
                  {tr.status === "requested" ? t("inventory.transfers.withdraw", "Withdraw") : t("inventory.transfers.cancel", "Cancel transfer")}
                </Button>
              ) : null}
              {actions.includes("decline") ? (
                <Button variant="outline" disabled={busy} onClick={() => setClosing("decline")}><X className="size-4" />{t("inventory.transfers.decline", "Decline")}</Button>
              ) : null}
              {actions.includes("edit") ? (
                <Button variant="outline" disabled={busy} onClick={() => setDialog("edit")}><Pencil className="size-4" />{t("common.edit", "Edit")}</Button>
              ) : null}
              {actions.includes("accept") ? (
                <Button disabled={busy} onClick={() => setDialog("accept")}><Check className="size-4" />{t("inventory.transfers.accept", "Accept")}</Button>
              ) : null}
              {actions.includes("dispatch") ? (
                <Button loading={busy} onClick={() => void onDispatch()}><Send className="size-4" />{t("inventory.transfers.sendNow", "Send now")}</Button>
              ) : null}
              {actions.includes("receive") ? (
                <Button disabled={busy} onClick={() => setReceiving(true)}><PackageCheck className="size-4" />{t("inventory.transfers.receive", "Receive")}</Button>
              ) : null}
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>

      <TransferDialog
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        mode={dialog ?? "edit"}
        transfer={tr}
        branches={branches}
        myBranchIds={myBranchIds}
        onDone={onChanged}
      />
      <ReceiveDialog transfer={receiving ? tr : null} onClose={() => setReceiving(false)} onDone={onChanged} />
      <CloseDialog transfer={closing ? tr : null} kind={closing ?? "cancel"} onClose={() => setClosing(null)} onDone={onChanged} />
    </>
  );
}

/** What arrived, line by line; prefilled with what was sent. */
function ReceiveDialog({ transfer: tr, onClose, onDone }: { transfer: StockTransfer | null; onClose: () => void; onDone: (t: StockTransfer) => void }) {
  const { t } = useTranslation();
  const [qty, setQty] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tr) return;
    setQty(Object.fromEntries(tr.lines.map((l) => [l.id, String(l.qty_sent)])));
    setNotes({});
  }, [tr]);
  if (!tr) return null;

  const rows = tr.lines.map((l) => {
    const got = parseFloat(qty[l.id] ?? "");
    const ok = Number.isFinite(got) && got >= 0;
    const over = ok && milli(got) > milli(l.qty_sent);
    return { l, got, ok, over, needsNote: over && !(notes[l.id] ?? "").trim() };
  });
  const valid = rows.every((r) => r.ok && !r.needsNote);

  const submit = async () => {
    setBusy(true);
    try {
      const next = await receiveTransfer(tr.id, {
        lines: rows.map((r) => ({ line_id: r.l.id, qty_received: r.got, note: (notes[r.l.id] ?? "").trim() || null })),
      });
      await invalidateInventory();
      toast.success(t("inventory.transfers.receivedToast", "Transfer received"));
      onDone(next);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
      if (isStaleRefusal(e)) void invalidateInventory();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("inventory.transfers.receiveTitle", { ref: tr.reference, defaultValue: `Receive ${tr.reference}` })}</DialogTitle>
          <DialogDescription>{t("inventory.transfers.receiveHint", "Count what arrived. Anything short is recorded as lost in transit.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {rows.map(({ l, ok, over, got, needsNote }) => (
            <div key={l.id} className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.ingredient_name}</p>
                  <p className="text-xs text-muted-foreground">{t("inventory.transfers.sentQty", { qty: `${fmtNumber(l.qty_sent)} ${fmtUnit(l.unit)}`, defaultValue: `Sent ${fmtNumber(l.qty_sent)} ${fmtUnit(l.unit)}` })}</p>
                </div>
                <Input
                  type="number" inputMode="decimal" min="0" step="0.001" className="tabular w-28"
                  value={qty[l.id] ?? ""} onChange={(e) => setQty((p) => ({ ...p, [l.id]: e.target.value }))}
                  aria-label={t("inventory.transfers.received", "Received")} aria-invalid={!ok}
                />
              </div>
              {ok && milli(got) < milli(l.qty_sent) ? (
                <p className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">{t("inventory.transfers.shortBy", { qty: fmtNumber(l.qty_sent - got), defaultValue: `Short by ${fmtNumber(l.qty_sent - got)}` })}</p>
              ) : null}
              {over || (ok && milli(got) < milli(l.qty_sent)) ? (
                <Input
                  value={notes[l.id] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [l.id]: e.target.value }))}
                  placeholder={over ? t("inventory.transfers.overNote", "Why did more arrive? (required)") : t("inventory.transfers.shortNote", "What happened? (optional)")}
                  aria-invalid={needsNote}
                />
              ) : null}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!valid} onClick={() => void submit()}>{t("inventory.transfers.receive", "Receive")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Decline a request (reason required) or cancel/withdraw (reason optional). */
function CloseDialog({ transfer: tr, kind, onClose, onDone }: { transfer: StockTransfer | null; kind: "decline" | "cancel"; onClose: () => void; onDone: (t: StockTransfer) => void }) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setNote(""), [tr]);
  if (!tr) return null;
  const decline = kind === "decline";
  const inTransit = tr.status === "dispatched";

  const submit = async () => {
    setBusy(true);
    try {
      const body = { note: note.trim() || null };
      const next = decline ? await declineTransfer(tr.id, body) : await cancelStockTransfer(tr.id, body);
      await invalidateInventory();
      toast.success(decline ? t("inventory.transfers.declinedToast", "Request declined") : t("inventory.transfers.cancelledToast", "Transfer cancelled"));
      onDone(next);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
      if (isStaleRefusal(e)) void invalidateInventory();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {decline ? t("inventory.transfers.declineTitle", { ref: tr.reference, defaultValue: `Decline ${tr.reference}?` })
              : t("inventory.transfers.cancelTitle", { ref: tr.reference, defaultValue: `Cancel ${tr.reference}?` })}
          </DialogTitle>
          <DialogDescription>
            {decline ? t("inventory.transfers.declineHint", { to: tr.destination_branch_name, defaultValue: `${tr.destination_branch_name} sees your reason.` })
              : inTransit ? t("inventory.transfers.cancelInTransitHint", { from: tr.source_branch_name, defaultValue: `The stock goes back on hand at ${tr.source_branch_name}.` })
              : t("inventory.transfers.cancelHint", "Nothing has moved yet.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>
            {t("inventory.transfers.reason", "Reason")}
            {decline ? null : <span className="text-muted-foreground"> ({t("common.optional", "optional")})</span>}
          </Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.back", "Back")}</Button>
          <Button variant="destructive" loading={busy} disabled={decline && !note.trim()} onClick={() => void submit()}>
            {decline ? t("inventory.transfers.decline", "Decline") : t("inventory.transfers.cancel", "Cancel transfer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
