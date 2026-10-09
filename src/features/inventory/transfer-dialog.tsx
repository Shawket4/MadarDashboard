import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Combobox } from "@/components/app/combobox";
import type { Branch, StockTransfer, TransferLineInput } from "@/data/api/generated/models";
import {
  acceptTransfer, createTransfer, dispatchTransfer, receiveTransfer, updateTransfer, useListBranchStock, useListCatalog,
  useTransferLocations,
} from "@/data/api/generated/api";
import { getErrorMessage, isStaleRefusal } from "@/data/api/errors";
import { useAuthzAt } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtNumber, fmtUnit } from "@/lib/format";
import { invalidateInventory, milli } from "./lib";

/** `new`: a draft or a request. `edit`: change a draft/request's lines. `accept`: answer a request. */
export type TransferDialogMode = "new" | "edit" | "accept";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The active locations the caller works at: the choices for their own side. */
  branches: Branch[];
  /** Where the caller works (owners: everywhere). */
  myBranchIds: Set<string>;
  mode?: TransferDialogMode;
  /** The transfer being edited or accepted. */
  transfer?: StockTransfer | null;
  defaultSourceId?: string | null;
  defaultDestinationId?: string | null;
  prefillLines?: TransferLineInput[];
  onDone?: (t: StockTransfer) => void;
}

interface LineState {
  key: number;
  ingredientId: string | null;
  qty: string;
}

const isNum = (s: string) => Number.isFinite(parseFloat(s)) && parseFloat(s) > 0;

/**
 * One transfer with many lines. A person at the sending side makes a draft (or
 * sends it now, or — at both ends — records it arrived); a person at the
 * receiving side makes a request the sender answers.
 */
export function TransferDialog({
  open, onOpenChange, branches, myBranchIds, mode = "new", transfer, defaultSourceId, defaultDestinationId, prefillLines, onDone,
}: Props) {
  const { t } = useTranslation();
  const keyRef = useRef(0);
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [asRequest, setAsRequest] = useState(false);
  const [lines, setLines] = useState<LineState[]>([]);
  const [note, setNote] = useState("");
  const [receiveNow, setReceiveNow] = useState(false);
  const [busy, setBusy] = useState(false);
  // What a quick send already did (made, sent): a retry resumes from it.
  const [made, setMade] = useState<StockTransfer | null>(null);

  useEffect(() => {
    if (!open) return;
    const src = transfer?.source_branch_id ?? defaultSourceId ?? "";
    const dst = transfer?.destination_branch_id ?? defaultDestinationId ?? "";
    setSourceId(src);
    setDestId(dst);
    // Default to sending from where you work; otherwise you can only ask.
    // Editing a request is still asking: the source's stock isn't yours to read.
    setAsRequest(mode === "new" ? !!src && !myBranchIds.has(src) : mode === "edit" && transfer?.status === "requested");
    const from = transfer
      ? transfer.lines.map((l) => ({ org_ingredient_id: l.org_ingredient_id, quantity: l.qty_sent }))
      : (prefillLines ?? []);
    setLines(
      from.length
        ? from.map((l) => ({ key: ++keyRef.current, ingredientId: l.org_ingredient_id, qty: String(l.quantity) }))
        : [{ key: ++keyRef.current, ingredientId: null, qty: "" }],
    );
    setNote(transfer?.note ?? "");
    setReceiveNow(false);
    setMade(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const orgId = useOrgId();
  // The other side can be any location of the org, not only where this person works.
  const locations = useTransferLocations(orgId ?? "", { query: { enabled: open && !!orgId } });
  const sourceStock = useListBranchStock(sourceId, { query: { enabled: open && !!sourceId && !asRequest } });
  // The asking side can't read the source's stock, so it picks from the catalog.
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: open && asRequest && !!orgId } });
  const stockById = useMemo(() => new Map((sourceStock.data ?? []).map((s) => [s.org_ingredient_id, s])), [sourceStock.data]);
  const unitById = useMemo(() => new Map((catalog.data ?? []).map((c) => [c.id, c.unit])), [catalog.data]);
  // Sending: only what the source holds can travel. Asking: anything in the catalog.
  const options = useMemo(
    () =>
      asRequest
        ? (catalog.data ?? []).map((c) => ({ value: c.id, label: c.name, keywords: c.category_name, hint: fmtUnit(c.unit) }))
        : (sourceStock.data ?? [])
            .filter((s) => s.on_hand > 0 || lines.some((l) => l.ingredientId === s.org_ingredient_id))
            .map((s) => ({ value: s.org_ingredient_id, label: s.ingredient_name, keywords: s.category_name, hint: `${fmtNumber(s.on_hand)} ${fmtUnit(s.unit)}` })),
    [sourceStock.data, catalog.data, asRequest, lines],
  );

  const sameBranch = !!sourceId && sourceId === destId;
  // The server checks each act at its side's location.
  const atSource = useAuthzAt(sourceId);
  const atDest = useAuthzAt(destId);
  const canSend = myBranchIds.has(sourceId) && atSource.can(Cap.inventoryTransfersCreate);
  const canAsk = myBranchIds.has(destId) && atDest.can(Cap.inventoryTransfersCreate);
  // Recording the arrival is the destination's receive (.edit there).
  const quickReceive = canSend && myBranchIds.has(destId) && atDest.can(Cap.inventoryTransfersEdit);
  const setLine = (key: number, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const picked = lines.filter((l) => l.ingredientId);
  const dupes = new Set(picked.map((l) => l.ingredientId)).size !== picked.length;
  const valid = !!sourceId && !!destId && !sameBranch && picked.length > 0 && picked.every((l) => isNum(l.qty)) && !dupes
    && (mode !== "new" || (asRequest ? canAsk : canSend));
  const overOnHand = (l: LineState) => {
    const s = !asRequest && l.ingredientId ? stockById.get(l.ingredientId) : undefined;
    return !!s && isNum(l.qty) && milli(parseFloat(l.qty)) > milli(s.on_hand);
  };
  // The server refuses to send more than is on hand; don't offer it.
  const short = lines.some(overOnHand);
  const payload = (): TransferLineInput[] =>
    picked.map((l) => ({ org_ingredient_id: l.ingredientId as string, quantity: parseFloat(l.qty) }));

  const run = async (then: "save" | "send") => {
    if (!valid) return;
    setBusy(true);
    // Up to three calls: a retry after one fails resumes from what went through,
    // so the transfer is never made, or sent, twice.
    let tr = made;
    try {
      if (!tr) {
        if (mode === "edit" && transfer) {
          tr = await updateTransfer(transfer.id, { lines: payload(), note: note.trim() || null });
        } else if (mode === "accept" && transfer) {
          tr = await acceptTransfer(transfer.id, { lines: payload() });
        } else {
          tr = await createTransfer({
            source_branch_id: sourceId, destination_branch_id: destId, request: asRequest, lines: payload(), note: note.trim() || null,
          });
        }
      } else if (tr.status === "draft") {
        // The lines may have changed since (lowered to what's on hand, say).
        tr = await updateTransfer(tr.id, { lines: payload(), note: note.trim() || null });
      }
      setMade(tr);
      if (then === "send") {
        if (tr.status === "draft") {
          tr = await dispatchTransfer(tr.id);
          setMade(tr);
        }
        // Quick transfer: the person may also receive at the destination, so record the arrival too.
        if (receiveNow && quickReceive && tr.status === "dispatched") {
          tr = await receiveTransfer(tr.id, { lines: tr.lines.map((l) => ({ line_id: l.id, qty_received: l.qty_sent })) });
          setMade(tr);
        }
      }
      await invalidateInventory();
      toast.success(
        tr.status === "requested" ? t("inventory.transfers.requestedToast", "Request sent")
          : tr.status === "received" ? t("inventory.transfers.receivedToast", "Transfer received")
          : tr.status === "dispatched" ? t("inventory.transfers.dispatchedToast", "Transfer sent")
          : t("inventory.transfers.savedDraft", "Draft saved"),
      );
      onDone?.(tr);
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
      // Part of it went through, or the transfer moved on: the list should say so.
      if (tr || isStaleRefusal(e)) void invalidateInventory();
    } finally {
      setBusy(false);
    }
  };

  const locked = mode !== "new";
  const title = mode === "edit" ? t("inventory.transfers.editTitle", "Edit transfer")
    : mode === "accept" ? t("inventory.transfers.acceptTitle", "Accept request")
    : asRequest ? t("inventory.transfers.requestTitle", "Request stock")
    : t("inventory.transfers.createTitle", "New transfer");
  // Your own side is where you work; the other side, any location (both, once fixed).
  const all: { id: string; name: string }[] = locations.data ?? branches;
  const fixed = locked || !!made;
  const sourceList = fixed || asRequest ? all : branches;
  const destList = fixed || !asRequest ? all : branches;
  const sourceName = all.find((b) => b.id === sourceId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "accept"
              ? t("inventory.transfers.acceptHint", "Change quantities to what you can send. It becomes your draft to pack and send.")
              : asRequest
                ? t("inventory.transfers.requestHint", "The sending location reviews the request, then sends it.")
                : t("inventory.transfers.sendHint", "Stock leaves when you send it, and lands when the other side receives it.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {mode === "new" ? (
            <SegmentedControl<"send" | "request">
              value={asRequest ? "request" : "send"}
              disabled={!!made}
              onChange={(v) => {
                setAsRequest(v === "request");
                // Your side swaps ends with the other: sending to X becomes asking X.
                setSourceId(destId);
                setDestId(sourceId);
              }}
              options={[
                { value: "send", label: t("inventory.transfers.modeSend", "Send stock") },
                { value: "request", label: t("inventory.transfers.modeRequest", "Request stock") },
              ]}
            />
          ) : null}

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>{t("inventory.transfers.from", "From")}</Label>
              <Select value={sourceId} onValueChange={(v) => setSourceId(v)} disabled={fixed}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{sourceList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2.5 size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            <div className="flex-1 space-y-1.5">
              <Label>{t("inventory.transfers.to", "To")}</Label>
              <Select value={destId} onValueChange={setDestId} disabled={fixed}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{destList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {sameBranch ? <p className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">{t("inventory.transfers.sameBranch", "Source and destination must differ")}</p> : null}
          {mode === "new" && sourceId && destId && !sameBranch && (asRequest ? atDest : atSource).ready && !(asRequest ? canAsk : canSend) ? (
            <p className="text-xs text-muted-foreground">
              {asRequest
                ? t("inventory.transfers.notAtDestination", "You can only request stock for a location you work at.")
                : t("inventory.transfers.notAtSource", "You don't work at the sending location. Request the stock instead.")}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>{t("inventory.transfers.items", "Items")}</Label>
            {lines.map((l) => {
              const s = !asRequest && l.ingredientId ? stockById.get(l.ingredientId) : undefined;
              const over = overOnHand(l);
              const unit = s?.unit ?? (l.ingredientId ? unitById.get(l.ingredientId) : undefined);
              return (
                <div key={l.key} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Combobox
                      options={options}
                      value={l.ingredientId}
                      onChange={(id) => setLine(l.key, { ingredientId: id })}
                      disabled={!sourceId}
                      placeholder={t("inventory.stock.pickIngredient", "Pick an ingredient")}
                      emptyText={!asRequest && sourceId && !sourceStock.isLoading && options.length === 0
                        ? t("inventory.transfers.nothingToSend", "This branch has nothing on hand to send. Count it first.")
                        : undefined}
                    />
                    {s && sourceName ? (
                      <p className={over ? "mt-1 text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]" : "mt-1 text-xs text-muted-foreground"}>
                        {t("inventory.transfers.onHandHint", { branch: sourceName, qty: fmtNumber(s.on_hand), unit: fmtUnit(s.unit), defaultValue: `${sourceName} on hand: ${fmtNumber(s.on_hand)} ${fmtUnit(s.unit)}` })}
                      </p>
                    ) : null}
                  </div>
                  <Input
                    type="number" inputMode="decimal" min="0" step="0.001" value={l.qty}
                    onChange={(e) => setLine(l.key, { qty: e.target.value })}
                    className="tabular w-28" aria-label={t("inventory.transfers.quantity", "Quantity")}
                    placeholder={unit ? fmtUnit(unit) : t("inventory.transfers.quantity", "Quantity")}
                  />
                  <Button variant="ghost" size="icon-sm" className="mt-1" disabled={lines.length === 1} onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))} aria-label={t("common.remove", "Remove")}>
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
            {dupes ? <p className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">{t("inventory.transfers.duplicateItem", "Each item can appear only once.")}</p> : null}
            <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, { key: ++keyRef.current, ingredientId: null, qty: "" }])} disabled={!sourceId}>
              <Plus className="size-4" /> {t("inventory.transfers.addItem", "Add item")}
            </Button>
          </div>

          {mode !== "accept" ? (
            <div className="space-y-1.5">
              <Label>{t("inventory.transfers.note", "Note")} <span className="text-muted-foreground">({t("common.optional", "optional")})</span></Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          ) : null}

          {!asRequest && mode !== "edit" && quickReceive ? (
            <label className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
              <Checkbox checked={receiveNow} onCheckedChange={(v) => setReceiveNow(v === true)} className="mt-0.5" />
              <span>
                {t("inventory.transfers.receiveNow", "It's already there: record it as received")}
                <span className="block text-xs text-muted-foreground">{t("inventory.transfers.receiveNowHint", "You work at both locations, so send and receive in one step.")}</span>
              </span>
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          {asRequest || mode === "edit" ? (
            <Button loading={busy} disabled={!valid} onClick={() => void run("save")}>
              {asRequest && mode === "new" ? t("inventory.transfers.sendRequest", "Send request") : t("common.save", "Save")}
            </Button>
          ) : (
            <>
              <Button variant="outline" loading={busy} disabled={!valid} onClick={() => void run("save")}>{t("inventory.transfers.saveDraft", "Save draft")}</Button>
              <Button loading={busy} disabled={!valid || short} onClick={() => void run("send")}>
                {receiveNow && quickReceive ? t("inventory.transfers.sendAndReceive", "Send and receive") : t("inventory.transfers.sendNow", "Send now")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
