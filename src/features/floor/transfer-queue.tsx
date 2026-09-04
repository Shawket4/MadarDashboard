import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowRight, Armchair, CirclePause, LayoutGrid, ListX, ReceiptText, Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/app/confirm-dialog";
import { cancelTransfer, fulfillTransfer } from "@/data/api/generated/api";
import type { FloorSection, FloorTable, TransferView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDuration } from "@/lib/format";
import { invalidateFloor, invalidateOccupants } from "./util";

interface Props {
  transfers: TransferView[];
  tables: FloorTable[];
  sections: FloorSection[];
}

/** FREE tables that satisfy a transfer's wish (specific table > section > any). */
const candidatesFor = (tr: TransferView, tables: FloorTable[]): FloorTable[] => {
  const free = tables.filter((tb) => tb.status === "free" && tb.is_active);
  if (tr.target_table_id) return free.filter((tb) => tb.id === tr.target_table_id);
  if (tr.target_section_id) return free.filter((tb) => tb.section_id === tr.target_section_id);
  return free;
};

/** The waiting transfer queue: FIFO, with fulfill / cancel actions. */
export function TransferQueue({ transfers, tables, sections }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [fulfilling, setFulfilling] = useState<TransferView | null>(null);

  const waiting = useMemo(
    () =>
      transfers
        .filter((tr) => tr.status === "waiting")
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [transfers],
  );

  const tableLabel = (id: string | null | undefined) =>
    (id && tables.find((tb) => tb.id === id)?.label) || null;
  const sectionName = (id: string | null | undefined) =>
    (id && sections.find((s) => s.id === id)?.name) || null;

  const wishText = (tr: TransferView): string => {
    const label = tableLabel(tr.target_table_id);
    if (label) return label;
    const name = sectionName(tr.target_section_id);
    if (name) return name;
    return t("floor.anyFreeTable", "Any free table");
  };

  const onCancel = async (tr: TransferView) => {
    const ok = await confirm({
      title: t("floor.cancelTransferTitle", "Cancel this transfer request?"),
      description: t("floor.cancelTransferDescription", "{{name}} stays at their current table.", {
        name: tr.occupant_label ?? t("floor.aParty", "The party"),
      }),
      destructive: true,
      confirmLabel: t("floor.cancelTransfer", "Cancel request"),
      cancelLabel: t("floor.keepWaiting", "Keep waiting"),
    });
    if (!ok) return;
    try {
      await cancelTransfer(tr.id);
      toast.success(t("floor.transferCancelled", "Transfer cancelled"));
      void invalidateFloor();
      void invalidateOccupants();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <section className="space-y-2" aria-label={t("floor.transferQueue", "Transfer queue")}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("floor.transferQueue", "Transfer queue")}
        </h3>
        {waiting.length > 0 ? <Badge variant="secondary">{waiting.length}</Badge> : null}
      </div>

      {waiting.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <ListX aria-hidden className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("floor.noTransfers", "No one is waiting to move tables.")}
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {waiting.map((tr) => {
            const KindIcon = tr.occupant_kind === "open_ticket" ? ReceiptText : CirclePause;
            const from = tableLabel(tr.from_table_id);
            const wishIsTable = !!tableLabel(tr.target_table_id);
            const WishIcon = wishIsTable ? Armchair : LayoutGrid;
            return (
              <li key={tr.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <KindIcon
                        aria-label={
                          tr.occupant_kind === "open_ticket"
                            ? t("floor.openTicket", "Open ticket")
                            : t("floor.heldOrder", "Held order")
                        }
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="truncate text-sm font-semibold">
                        {tr.occupant_label ?? t("floor.unnamedParty", "Unnamed")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {from ? <span>{from}</span> : <span>{t("floor.noTable", "No table")}</span>}
                      <ArrowRight aria-hidden className="size-3 rtl:rotate-180" />
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <WishIcon aria-hidden className="size-3" />
                        {wishText(tr)}
                      </span>
                      <span className="flex items-center gap-1" title={t("floor.waitingFor", "Waiting for")}>
                        <Timer aria-hidden className="size-3" />
                        {fmtDuration(tr.created_at)}
                      </span>
                    </div>
                    {tr.note ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tr.note}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Button size="xs" onClick={() => setFulfilling(tr)}>
                      {t("floor.fulfill", "Fulfill")}
                    </Button>
                    <Button size="xs" variant="ghost" className="text-destructive" onClick={() => void onCancel(tr)}>
                      {t("common.cancel", "Cancel")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <FulfillDialog
        transfer={fulfilling}
        tables={tables}
        sections={sections}
        onClose={() => setFulfilling(null)}
      />
    </section>
  );
}

/** Pick the free table the party actually moves to. */
function FulfillDialog({
  transfer, tables, sections, onClose,
}: {
  transfer: TransferView | null;
  tables: FloorTable[];
  sections: FloorSection[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(
    () => (transfer ? candidatesFor(transfer, tables) : []),
    [transfer, tables],
  );

  const sectionName = (id: string | null | undefined) =>
    (id && sections.find((s) => s.id === id)?.name) || null;

  const close = () => {
    setPicked(null);
    onClose();
  };

  const submit = async () => {
    if (!transfer || !picked) return;
    setBusy(true);
    try {
      await fulfillTransfer(transfer.id, { table_id: picked });
      toast.success(t("floor.transferFulfilled", "Party moved"));
      void invalidateFloor();
      void invalidateOccupants();
      close();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!transfer} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("floor.moveParty", "Move {{name}}", {
              name: transfer?.occupant_label ?? t("floor.aParty", "the party"),
            })}
          </DialogTitle>
          <DialogDescription>
            {t("floor.moveDescription", "Pick a free table that matches the request.")}
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("floor.noMatchingTables", "No free tables match this request yet. Free one up, or cancel the request.")}
          </p>
        ) : (
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
            {candidates.map((tb) => {
              const on = picked === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(on ? null : tb.id)}
                  className={`rounded-lg border p-2 text-start text-sm transition ${on ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                >
                  <div className="font-semibold">{tb.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {tb.seats} {t("floor.seatsShort", "seats")}
                    {sectionName(tb.section_id) ? ` · ${sectionName(tb.section_id)}` : ""}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>{t("common.cancel", "Cancel")}</Button>
          <Button disabled={!picked} loading={busy} onClick={() => void submit()}>
            {t("floor.confirmMove", "Move here")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
