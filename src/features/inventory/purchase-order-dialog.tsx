import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Separator } from "@/components/ui/separator";
import type { OrgIngredient, POLineInput, Supplier } from "@/data/api/generated/models";
import { createPurchaseOrder } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { cairoDateISO, egpToPiastres, fmtMoney } from "@/lib/format";
import { invalidateInventory, unitsForFamily } from "./lib";

export interface POPrefillLine {
  org_ingredient_id: string;
  quantity_ordered: number;
}

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  catalog: OrgIngredient[];
  prefillSupplierId?: string | null;
  prefillLines?: POPrefillLine[];
}

interface LineState {
  key: number;
  ingredientId: string | null;
  purchaseUnit: string;
  qty: string;
  cost: string;
}

const emptyLine = (key: number): LineState => ({ key, ingredientId: null, purchaseUnit: "", qty: "", cost: "" });

export function PurchaseOrderDialog({ branchId, open, onOpenChange, suppliers, catalog, prefillSupplierId, prefillLines }: Props) {
  const { t } = useTranslation();
  const keyRef = useRef(0);
  const nextKey = () => ++keyRef.current;

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [expected, setExpected] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<LineState[]>([]);
  const [busy, setBusy] = useState(false);

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);

  useEffect(() => {
    if (!open) return;
    setSupplierId(prefillSupplierId ?? null);
    setExpected("");
    setReference("");
    if (prefillLines && prefillLines.length) {
      setLines(
        prefillLines.map((p) => {
          const ing = catalogById.get(p.org_ingredient_id);
          return {
            key: nextKey(),
            ingredientId: p.org_ingredient_id,
            purchaseUnit: ing?.unit ?? "",
            qty: String(p.quantity_ordered),
            cost: ing?.cost_per_unit != null ? String(ing.cost_per_unit / 100) : "",
          };
        }),
      );
    } else {
      setLines([emptyLine(nextKey())]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const supplierOptions = useMemo(
    () => suppliers.filter((s) => s.is_active).map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );
  const catalogOptions = useMemo(() => catalog.map((c) => ({ value: c.id, label: c.name })), [catalog]);

  const setLine = (key: number, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const onPickIngredient = (key: number, id: string) => {
    const ing = catalogById.get(id);
    setLine(key, { ingredientId: id, purchaseUnit: ing?.unit ?? "", cost: ing?.cost_per_unit != null ? String(ing.cost_per_unit / 100) : "" });
  };

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const q = parseFloat(l.qty);
        const c = parseFloat(l.cost);
        return Number.isFinite(q) && Number.isFinite(c) ? sum + q * egpToPiastres(c) : sum;
      }, 0),
    [lines],
  );

  const validLines = lines.filter(
    (l) => l.ingredientId && parseFloat(l.qty) > 0 && Number.isFinite(parseFloat(l.cost)),
  );
  const canSubmit = validLines.length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const payloadLines: POLineInput[] = validLines.map((l) => ({
        org_ingredient_id: l.ingredientId as string,
        // Must be a real stock unit in the ingredient's measure; the backend
        // derives the pack factor from it (e.g. kg for a gram ingredient → 1000).
        purchase_unit: l.purchaseUnit || (catalogById.get(l.ingredientId as string)?.unit ?? "pcs"),
        quantity_ordered: parseFloat(l.qty),
        unit_cost: egpToPiastres(parseFloat(l.cost)),
        units_per_purchase_unit: null,
      }));
      let expected_at: string | null = null;
      if (expected) {
        const [y, m, d] = expected.split("-").map(Number);
        if (y && m && d) expected_at = cairoDateISO(y, m - 1, d, true);
      }
      await createPurchaseOrder(branchId, {
        supplier_id: supplierId || null,
        expected_at,
        reference: reference.trim() || null,
        lines: payloadLines,
      });
      await invalidateInventory();
      toast.success(t("inventory.purchasing.newOrder", "New purchase order"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.purchasing.newOrder", "New purchase order")}</DialogTitle>
          <DialogDescription>{t("inventory.purchasing.orders", "Purchase orders")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.purchasing.supplier", "Supplier")}</Label>
              <Combobox options={supplierOptions} value={supplierId} onChange={setSupplierId} placeholder={t("inventory.purchasing.pickSupplier", "Select a supplier")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.purchasing.expectedAt", "Expected")}</Label>
              <DatePicker dateOnly value={expected} onChange={setExpected} warnPast triggerClassName="w-full" placeholder={t("inventory.purchasing.expectedAt", "Expected")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("inventory.purchasing.reference", "Reference")} <span className="text-muted-foreground">({t("common.optional", "optional")})</span></Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>

          <Separator />
          <div className="space-y-2">
            <Label>{t("inventory.purchasing.lines", "Lines")}</Label>
            {lines.map((l) => {
              const ing = l.ingredientId ? catalogById.get(l.ingredientId) : undefined;
              const puOptions = ing ? unitsForFamily(ing.unit) : [];
              return (
                <div key={l.key} className="space-y-1.5 rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Combobox
                        options={catalogOptions}
                        value={l.ingredientId}
                        onChange={(id) => onPickIngredient(l.key, id)}
                        placeholder={t("inventory.purchasing.pickIngredient", "Pick an ingredient")}
                      />
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} aria-label={t("common.remove", "Remove")}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("inventory.purchasing.purchaseUnit", "Purchase unit")}</Label>
                      <Select value={l.purchaseUnit} onValueChange={(v) => setLine(l.key, { purchaseUnit: v })} disabled={!ing}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {puOptions.map((u) => <SelectItem key={u} value={u}>{t(`units.${u}`, u)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("inventory.purchasing.qtyOrdered", "Ordered")}</Label>
                      <Input type="number" min="0" step="0.0001" value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} className="h-8 tabular" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("inventory.purchasing.unitCost", "Unit cost (EGP)")}</Label>
                      <Input type="number" min="0" step="0.0001" value={l.cost} onChange={(e) => setLine(l.key, { cost: e.target.value })} className="h-8 tabular" />
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine(nextKey())])}>
              <Plus className="size-4" /> {t("inventory.purchasing.addLine", "Add line")}
            </Button>
          </div>

          <div className="flex items-center justify-between border-t pt-3 font-medium">
            <span>{t("inventory.purchasing.grandTotal", "Total")}</span>
            <span className="tabular">{fmtMoney(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!canSubmit} onClick={() => void submit()}>{t("inventory.purchasing.order", "Place order")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
