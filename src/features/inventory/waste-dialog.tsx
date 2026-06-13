import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { createWaste, useListBranchStock } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtNumber, fmtUnit } from "@/lib/format";
import { WASTE_REASONS } from "./lib";
import { invalidateInventory } from "./lib";

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select an ingredient (e.g. opened from an item drawer). */
  presetIngredientId?: string | null;
}

/** Record spoilage/loss against branch stock. Reused by Today and item detail. */
export function WasteDialog({ branchId, open, onOpenChange, presetIngredientId }: Props) {
  const { t } = useTranslation();
  const stock = useListBranchStock(branchId, { query: { enabled: open && !!branchId } });
  const [ingredientId, setIngredientId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("expired");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setIngredientId(presetIngredientId ?? null);
      setQty("");
      setReason("expired");
      setNote("");
    }
  }, [open, presetIngredientId]);

  const options = useMemo(
    () =>
      (stock.data ?? []).map((s) => ({
        value: s.org_ingredient_id,
        label: s.ingredient_name,
        hint: `${fmtNumber(s.current_stock)} ${fmtUnit(s.unit)}`,
      })),
    [stock.data],
  );
  const selected = (stock.data ?? []).find((s) => s.org_ingredient_id === ingredientId) ?? null;
  const quantity = parseFloat(qty);
  const exceeds = selected != null && Number.isFinite(quantity) && quantity > selected.current_stock;
  const valid = !!ingredientId && Number.isFinite(quantity) && quantity > 0 && !exceeds;

  const submit = async () => {
    if (!valid || !ingredientId) return;
    setBusy(true);
    try {
      await createWaste(branchId, {
        org_ingredient_id: ingredientId,
        quantity,
        reason,
        note: note.trim() || null,
      });
      await invalidateInventory();
      toast.success(t("inventory.waste.record", "Record waste"));
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
          <DialogTitle>{t("inventory.waste.recordTitle", "Record waste")}</DialogTitle>
          <DialogDescription>{t("inventory.waste.title", "Waste log")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("inventory.waste.ingredient", "Ingredient")}</Label>
            <Combobox
              options={options}
              value={ingredientId}
              onChange={setIngredientId}
              placeholder={t("inventory.stock.pickIngredient", "Pick an ingredient")}
            />
            {selected ? (
              <p className="text-xs text-muted-foreground">
                {t("inventory.waste.onHandHint", {
                  qty: fmtNumber(selected.current_stock),
                  unit: fmtUnit(selected.unit),
                  defaultValue: `${fmtNumber(selected.current_stock)} ${fmtUnit(selected.unit)} on hand`,
                })}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.waste.quantity", "Quantity")}</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="tabular"
              />
              {exceeds ? <p className="text-xs text-destructive">{t("inventory.waste.quantityExceeds", "More than on hand")}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.waste.reason", "Reason")}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{t(`inventory.waste.reasons.${r}`, r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("inventory.waste.note", "Note")} <span className="text-muted-foreground">({t("common.optional", "optional")})</span></Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!valid} onClick={() => void submit()}>{t("inventory.waste.record", "Record waste")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
