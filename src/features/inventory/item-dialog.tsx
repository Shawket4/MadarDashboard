import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Branch, OrgIngredient } from "@/data/api/generated/models";
import { addToBranchStock, createCatalogItem, updateCatalogItem, useListSuppliers } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtUnit, piastresToEgp } from "@/lib/format";
import { CATEGORIES, UNITS, invalidateInventory, unitsForFamily } from "./lib";

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null/undefined = create mode. */
  item?: OrgIngredient | null;
  branches: Branch[];
}

interface BranchRow {
  stock: string;
  parMin: string;
  parMax: string;
}

/** Create or edit an org ingredient; on create, optionally seed per-branch stock. */
export function ItemDialog({ orgId, open, onOpenChange, item, branches }: Props) {
  const { t } = useTranslation();
  const editing = !!item;
  const suppliers = useListSuppliers(orgId, { query: { enabled: open && !!orgId } });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [packUnit, setPackUnit] = useState("");
  const [packSize, setPackSize] = useState("");
  const [yieldPct, setYieldPct] = useState("");
  const [density, setDensity] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [perBranch, setPerBranch] = useState<Record<string, BranchRow>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setCategory(item?.category ?? "general");
    setUnit(item?.unit ?? "g");
    setCost(item?.cost_per_unit != null ? String(piastresToEgp(item.cost_per_unit)) : "");
    setSupplierId(item?.supplier_id ?? null);
    setDescription(item?.description ?? "");
    setPackUnit(item?.pack_unit ?? "");
    setPackSize(item?.pack_size != null ? String(item.pack_size) : "");
    setYieldPct(item?.yield_pct != null ? String(item.yield_pct) : "");
    setDensity(item?.density_g_per_ml != null ? String(item.density_g_per_ml) : "");
    setAdvanced(false);
    setPerBranch({});
  }, [open, item]);

  const supplierOptions = useMemo(
    () => (suppliers.data ?? []).filter((s) => s.is_active).map((s) => ({ value: s.id, label: s.name })),
    [suppliers.data],
  );

  // On edit the unit can only change within the same measure family (the backend
  // rebases recipes/stock/cost). On create any unit is fine.
  const unitOptions = editing && item ? unitsForFamily(item.unit) : [...UNITS];
  const unitLocked = editing && unitOptions.length <= 1; // pcs can't convert
  const unitChanged = editing && !!item && unit !== item.unit;

  const setRow = (branchId: string, patch: Partial<BranchRow>) =>
    setPerBranch((prev) => ({ ...prev, [branchId]: { ...(prev[branchId] ?? { stock: "", parMin: "", parMax: "" }), ...patch } }));

  const submit = async () => {
    if (!name.trim()) return;
    const trimmed = cost.trim();
    const cost_per_unit = trimmed === "" ? null : egpToPiastres(parseFloat(trimmed));
    const pack_unit = packUnit.trim() || null;
    const pack_size = packSize.trim() === "" ? null : parseFloat(packSize);
    const yield_pct = yieldPct.trim() === "" ? null : parseFloat(yieldPct);
    const density_g_per_ml = density.trim() === "" ? null : parseFloat(density);
    setBusy(true);
    try {
      if (editing && item) {
        if (unitChanged) {
          // Changing the unit rebases cost server-side, so cost_per_unit must NOT
          // be sent in the same request (backend returns 400). Send the unit first…
          await updateCatalogItem(orgId, item.id, {
            name: name.trim(), category, unit,
            description: description.trim() || null,
            supplier_id: supplierId || undefined,
            pack_unit, pack_size, yield_pct, density_g_per_ml,
          });
          // …then the cost separately, only if the manager actually edited it.
          if (cost_per_unit !== (item.cost_per_unit ?? null)) {
            await updateCatalogItem(orgId, item.id, { cost_per_unit });
          }
        } else {
          await updateCatalogItem(orgId, item.id, {
            name: name.trim(), category, unit, cost_per_unit,
            description: description.trim() || null,
            supplier_id: supplierId || undefined,
            pack_unit, pack_size, yield_pct, density_g_per_ml,
          });
        }
      } else {
        const created = await createCatalogItem(orgId, {
          name: name.trim(), category, unit, cost_per_unit,
          description: description.trim() || null,
          supplier_id: supplierId || undefined,
          pack_unit, pack_size, yield_pct, density_g_per_ml,
        });
        // Seed per-branch stock where the manager entered a value.
        for (const b of branches) {
          const row = perBranch[b.id];
          if (!row) continue;
          const stock = row.stock.trim() === "" ? null : parseFloat(row.stock);
          const par_min = row.parMin.trim() === "" ? null : parseFloat(row.parMin);
          const par_max = row.parMax.trim() === "" ? null : parseFloat(row.parMax);
          if (stock == null && par_min == null && par_max == null) continue;
          await addToBranchStock(b.id, {
            org_ingredient_id: created.id,
            current_stock: stock,
            par_min,
            par_max,
          });
        }
      }
      await invalidateInventory();
      toast.success(t("common.savedChanges", "Changes saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("inventory.catalog.editTitle", "Edit ingredient") : t("inventory.catalog.newItem", "New ingredient")}</DialogTitle>
          <DialogDescription>{t("inventory.catalog.title", "Ingredient catalog")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("inventory.catalog.name", "Name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.category", "Category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`inventory.catalog.cat_${c}`, c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.unit", "Unit")}</Label>
              <Select value={unit} onValueChange={setUnit} disabled={unitLocked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u) => <SelectItem key={u} value={u}>{t(`units.${u}`, u)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {unitChanged ? (
            <p className="rounded-md border border-warning/30 bg-warning/5 p-2 text-xs text-warning">
              {t("inventory.catalog.unitChangeNotice", "Changing the unit will convert this ingredient's recipes, stock and cost to the new unit.")}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.standardCost", "Standard cost (EGP)")}</Label>
              <Input type="number" step="0.0001" min="0" placeholder="—" value={cost} onChange={(e) => setCost(e.target.value)} className="tabular" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.supplier", "Supplier")}</Label>
              <Combobox
                options={supplierOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder={t("inventory.catalog.noSupplier", "No supplier")}
              />
            </div>
          </div>

          <Collapsible open={advanced} onOpenChange={setAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className={`size-4 transition-transform motion-reduce:transition-none ${advanced ? "rotate-180" : ""}`} />
              {t("inventory.catalog.advanced", "Advanced")}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label>{t("inventory.catalog.description", "Description")}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("inventory.catalog.packUnit", "Pack name")}</Label>
                  <Input placeholder={t("inventory.catalog.packUnitPlaceholder", "e.g. case, sack")} value={packUnit} onChange={(e) => setPackUnit(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("inventory.catalog.packSize", "Pack size (base units)")}</Label>
                  <Input type="number" min="0" step="0.0001" placeholder="—" value={packSize} onChange={(e) => setPackSize(e.target.value)} className="tabular" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("inventory.catalog.yieldPct", "Yield % (after trim/loss)")}</Label>
                  <Input type="number" min="0" max="100" step="0.1" placeholder="100" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} className="tabular" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("inventory.catalog.density", "Density (g/ml)")}</Label>
                  <Input type="number" min="0" step="0.001" placeholder="—" value={density} onChange={(e) => setDensity(e.target.value)} className="tabular" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {!editing && branches.length > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">{t("inventory.catalog.perBranchStock", "Per-branch stock & par levels")}</p>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-muted-foreground">
                <span />
                <span className="w-24 text-center">{t("inventory.catalog.onHand", "On hand")}</span>
                <span className="w-24 text-center">{t("inventory.catalog.parMin", "Min par")}</span>
                <span className="w-24 text-center">{t("inventory.catalog.parMax", "Max par")}</span>
              </div>
              {branches.map((b) => (
                <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                  <span className="truncate text-sm">{b.name}</span>
                  <Input
                    type="number" min="0" step="0.0001" placeholder="—"
                    value={perBranch[b.id]?.stock ?? ""}
                    onChange={(e) => setRow(b.id, { stock: e.target.value })}
                    className="h-8 w-24 tabular"
                  />
                  <Input
                    type="number" min="0" step="0.0001" placeholder="—"
                    value={perBranch[b.id]?.parMin ?? ""}
                    onChange={(e) => setRow(b.id, { parMin: e.target.value })}
                    className="h-8 w-24 tabular"
                  />
                  <Input
                    type="number" min="0" step="0.0001" placeholder="—"
                    value={perBranch[b.id]?.parMax ?? ""}
                    onChange={(e) => setRow(b.id, { parMax: e.target.value })}
                    className="h-8 w-24 tabular"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{fmtUnit(unit)}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!name.trim()} onClick={() => void submit()}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
