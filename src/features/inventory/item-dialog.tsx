import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Plus } from "lucide-react";
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
import {
  createCatalogItem, createIngredientCategory, setParLevels, updateCatalogItem,
  useListIngredientCategories, useListSuppliers,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtUnit, piastresToEgp } from "@/lib/format";
import { UNITS, invalidateInventory, unitsForFamily } from "./lib";

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null/undefined = create mode. */
  item?: OrgIngredient | null;
  branches: Branch[];
}

interface ParRow {
  parMin: string;
  parMax: string;
}

const NEW_CATEGORY = "__new__";

/**
 * Create or edit an org ingredient. On create, optional per-branch par levels
 * can be set; opening stock is never typed in here — it comes from the first
 * count (or a delivery), so the ledger stays the only source of quantities.
 */
export function ItemDialog({ orgId, open, onOpenChange, item, branches }: Props) {
  const { t } = useTranslation();
  const editing = !!item;
  const suppliers = useListSuppliers(orgId, { query: { enabled: open && !!orgId } });
  const categories = useListIngredientCategories(orgId, { query: { enabled: open && !!orgId } });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [packUnit, setPackUnit] = useState("");
  const [packSize, setPackSize] = useState("");
  const [yieldPct, setYieldPct] = useState("");
  const [density, setDensity] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [pars, setPars] = useState<Record<string, ParRow>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setCategoryId(item?.category_id ?? "");
    setNewCategory("");
    setUnit(item?.unit ?? "g");
    setCost(item?.cost_per_unit != null ? String(piastresToEgp(item.cost_per_unit)) : "");
    setSupplierId(item?.supplier_id ?? null);
    setDescription(item?.description ?? "");
    setPackUnit(item?.pack_unit ?? "");
    setPackSize(item?.pack_size != null ? String(item.pack_size) : "");
    setYieldPct(item?.yield_pct != null ? String(item.yield_pct) : "");
    setDensity(item?.density_g_per_ml != null ? String(item.density_g_per_ml) : "");
    setAdvanced(false);
    setPars({});
  }, [open, item]);

  // Default a new ingredient to `general` once categories load.
  useEffect(() => {
    if (!open || editing || categoryId) return;
    const general = (categories.data ?? []).find((c) => c.slug === "general") ?? categories.data?.[0];
    if (general) setCategoryId(general.id);
  }, [open, editing, categoryId, categories.data]);

  const supplierOptions = useMemo(
    () => (suppliers.data ?? []).filter((s) => s.is_active).map((s) => ({ value: s.id, label: s.name })),
    [suppliers.data],
  );

  const unitOptions = editing && item ? unitsForFamily(item.unit) : [...UNITS];
  const unitLocked = editing && unitOptions.length <= 1;
  const unitChanged = editing && !!item && unit !== item.unit;
  const isNewCategory = categoryId === NEW_CATEGORY;

  const setPar = (branchId: string, patch: Partial<ParRow>) =>
    setPars((prev) => ({ ...prev, [branchId]: { ...(prev[branchId] ?? { parMin: "", parMax: "" }), ...patch } }));

  const submit = async () => {
    if (!name.trim()) return;
    if (isNewCategory && !newCategory.trim()) return;
    const trimmed = cost.trim();
    const cost_per_unit = trimmed === "" ? null : egpToPiastres(parseFloat(trimmed));
    const pack_unit = packUnit.trim() || null;
    const pack_size = packSize.trim() === "" ? null : parseFloat(packSize);
    const yield_pct = yieldPct.trim() === "" ? null : parseFloat(yieldPct);
    const density_g_per_ml = density.trim() === "" ? null : parseFloat(density);
    setBusy(true);
    try {
      let category_id: string | null = categoryId || null;
      if (isNewCategory) {
        const created = await createIngredientCategory(orgId, { name: newCategory.trim() });
        category_id = created.id;
      }
      if (editing && item) {
        if (unitChanged) {
          // Changing the unit rebases cost server-side, so cost_per_unit must NOT
          // be sent in the same request (backend returns 400). Unit first…
          await updateCatalogItem(orgId, item.id, {
            name: name.trim(), category_id, unit,
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
            name: name.trim(), category_id, unit, cost_per_unit,
            description: description.trim() || null,
            supplier_id: supplierId || undefined,
            pack_unit, pack_size, yield_pct, density_g_per_ml,
          });
        }
      } else {
        const created = await createCatalogItem(orgId, {
          name: name.trim(), category_id, unit, cost_per_unit,
          description: description.trim() || null,
          supplier_id: supplierId || undefined,
          pack_unit, pack_size, yield_pct, density_g_per_ml,
        });
        for (const b of branches) {
          const row = pars[b.id];
          if (!row) continue;
          const par_min = row.parMin.trim() === "" ? null : parseFloat(row.parMin);
          const par_max = row.parMax.trim() === "" ? null : parseFloat(row.parMax);
          if (par_min == null && par_max == null) continue;
          await setParLevels(b.id, created.id, { par_min, par_max });
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
          <DialogDescription>{t("inventory.catalog.title", "Ingredients")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("inventory.catalog.name", "Name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.category", "Category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={t("inventory.catalog.category", "Category")} /></SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  <SelectItem value={NEW_CATEGORY}><span className="flex items-center gap-1"><Plus className="size-3" />{t("inventory.catalog.newCategory", "New category…")}</span></SelectItem>
                </SelectContent>
              </Select>
              {isNewCategory ? (
                <Input
                  placeholder={t("inventory.catalog.newCategoryName", "Category name")}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  autoFocus
                />
              ) : null}
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
              <p className="text-sm font-medium">{t("inventory.catalog.perBranchPar", "Reorder levels per branch")}</p>
              <p className="text-xs text-muted-foreground">{t("inventory.catalog.perBranchParHint", "Optional. Opening stock is not typed here — count it on the branch and the ledger takes it from there.")}</p>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs text-muted-foreground">
                <span />
                <span className="w-24 text-center">{t("inventory.catalog.parMin", "Reorder point")}</span>
                <span className="w-24 text-center">{t("inventory.catalog.parMax", "Order up to")}</span>
              </div>
              {branches.map((b) => (
                <div key={b.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  <span className="truncate text-sm">{b.name}</span>
                  <Input type="number" min="0" step="0.0001" placeholder="—" value={pars[b.id]?.parMin ?? ""} onChange={(e) => setPar(b.id, { parMin: e.target.value })} className="h-8 w-24 tabular" />
                  <Input type="number" min="0" step="0.0001" placeholder="—" value={pars[b.id]?.parMax ?? ""} onChange={(e) => setPar(b.id, { parMax: e.target.value })} className="h-8 w-24 tabular" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{fmtUnit(unit)}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!name.trim() || (isNewCategory && !newCategory.trim())} onClick={() => void submit()}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
