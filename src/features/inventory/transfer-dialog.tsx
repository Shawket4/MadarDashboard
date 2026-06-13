import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/app/combobox";
import type { Branch } from "@/data/api/generated/models";
import { createTransfer, useListBranchStock } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtNumber, fmtUnit } from "@/lib/format";
import { invalidateInventory } from "./lib";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  defaultSourceId?: string | null;
}

/** Move stock between two branches (atomic; reversible by deleting the row). */
export function TransferDialog({ open, onOpenChange, branches, defaultSourceId }: Props) {
  const { t } = useTranslation();
  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [ingredientId, setIngredientId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSourceId(defaultSourceId ?? "");
      setDestId("");
      setIngredientId(null);
      setQty("");
      setNote("");
    }
  }, [open, defaultSourceId]);

  const sourceStock = useListBranchStock(sourceId, { query: { enabled: open && !!sourceId } });
  const options = useMemo(
    () =>
      (sourceStock.data ?? []).map((s) => ({
        value: s.org_ingredient_id,
        label: s.ingredient_name,
        hint: `${fmtNumber(s.current_stock)} ${fmtUnit(s.unit)}`,
      })),
    [sourceStock.data],
  );
  const selected = (sourceStock.data ?? []).find((s) => s.org_ingredient_id === ingredientId) ?? null;
  const sourceBranch = branches.find((b) => b.id === sourceId) ?? null;

  const quantity = parseFloat(qty);
  const sameBranch = !!sourceId && sourceId === destId;
  const exceeds = selected != null && Number.isFinite(quantity) && quantity > selected.current_stock;
  const valid =
    !!sourceId && !!destId && !sameBranch && !!ingredientId && Number.isFinite(quantity) && quantity > 0 && !exceeds;

  const submit = async () => {
    if (!valid || !ingredientId) return;
    setBusy(true);
    try {
      await createTransfer({
        source_branch_id: sourceId,
        destination_branch_id: destId,
        org_ingredient_id: ingredientId,
        quantity,
        note: note.trim() || null,
      });
      await invalidateInventory();
      toast.success(t("inventory.transfers.create", "New transfer"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inventory.transfers.createTitle", "New transfer")}</DialogTitle>
          <DialogDescription>{t("inventory.transfers.title", "Transfers")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>{t("inventory.transfers.source", "From branch")}</Label>
              <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setIngredientId(null); }}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2.5 size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            <div className="flex-1 space-y-1.5">
              <Label>{t("inventory.transfers.destination", "To branch")}</Label>
              <Select value={destId} onValueChange={setDestId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {sameBranch ? <p className="text-xs text-destructive">{t("inventory.transfers.sameBranch", "Source and destination must differ")}</p> : null}

          <div className="space-y-1.5">
            <Label>{t("inventory.transfers.ingredient", "Ingredient")}</Label>
            <Combobox
              options={options}
              value={ingredientId}
              onChange={setIngredientId}
              disabled={!sourceId}
              placeholder={t("inventory.stock.pickIngredient", "Pick an ingredient")}
            />
            {selected && sourceBranch ? (
              <p className="text-xs text-muted-foreground">
                {t("inventory.transfers.onHandHint", {
                  branch: sourceBranch.name,
                  qty: fmtNumber(selected.current_stock),
                  unit: fmtUnit(selected.unit),
                  defaultValue: `${sourceBranch.name} on hand: ${fmtNumber(selected.current_stock)} ${fmtUnit(selected.unit)}`,
                })}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>{t("inventory.transfers.quantity", "Quantity")}</Label>
            <Input type="number" min="0" step="0.0001" value={qty} onChange={(e) => setQty(e.target.value)} className="tabular" />
            {exceeds ? <p className="text-xs text-destructive">{t("inventory.waste.quantityExceeds", "More than on hand")}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>{t("inventory.transfers.note", "Note")} <span className="text-muted-foreground">({t("common.optional", "optional")})</span></Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!valid} onClick={() => void submit()}>{t("inventory.transfers.create", "New transfer")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
