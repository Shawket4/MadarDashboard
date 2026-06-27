import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Settings2, Sliders, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { MasterList } from "./master-list";
import { Combobox } from "@/components/app/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  createAddonSlot, createOptionalField, deleteAddonSlot, deleteOptionalField,
  useListAddonSlots, useListCatalog, useListMenuItems, useListOptionalFields,
} from "@/data/api/generated/api";
import type { AddonSlot, OptionalField, OrgIngredient } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { invalidateRecipes } from "./util";

export function SlotsOptionalsTab({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  const items = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const list = useMemo(() => items.data ?? [], [items.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
      <MasterList
        items={list.map((m) => ({ id: m.id, label: tname(m) }))}
        selectedId={selected}
        onSelect={setSelected}
        loading={items.isLoading}
        searchPlaceholder={t("recipes.searchItems", "Search items…")}
        emptyText={t("recipes.noItems", "No items")}
      />
      {selected ? <Detail key={selected} itemId={selected} orgId={orgId} /> : (
        <div className="rounded-xl border">
          <EmptyState
            icon={Sliders}
            title={t("recipes.selectDrink", "Select an item")}
            description={t("recipes.selectDrinkHint", "Pick an item to edit its slots & optionals")}
          />
        </div>
      )}
    </div>
  );
}

function Detail({ itemId, orgId }: { itemId: string; orgId: string }) {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const slots = useListAddonSlots(itemId, { query: { enabled: !!itemId } });
  const optionals = useListOptionalFields(itemId, { query: { enabled: !!itemId } });
  const catalog = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const [slotOpen, setSlotOpen] = useState(false);
  const [optOpen, setOptOpen] = useState(false);

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const slotLabel = (s: AddonSlot) => {
    const ar = (s.label_translations as { ar?: string } | undefined)?.ar;
    return (i18n.language.startsWith("ar") && ar) ? ar : (s.label || t(`menu.addonTypes.${s.addon_type}`, s.addon_type));
  };

  const removeSlot = async (s: AddonSlot) => {
    if (!(await confirm({ title: t("recipes.slots.removed", "Slot removed") + "?", destructive: true }))) return;
    try { await deleteAddonSlot(itemId, s.id); void invalidateRecipes(); toast.success(t("recipes.slots.removed", "Slot removed")); } catch (e) { onErr(e); }
  };
  const removeOpt = async (o: OptionalField) => {
    if (!(await confirm({ title: t("common.confirmDelete", { name: o.name, defaultValue: `Delete "${o.name}"?` }), destructive: true }))) return;
    try { await deleteOptionalField(itemId, o.id); void invalidateRecipes(); toast.success(t("common.savedChanges", "Changes saved")); } catch (e) { onErr(e); }
  };

  return (
    <div className="space-y-4">
      {/* Add-on slots section */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sliders className="size-4 text-muted-foreground" />
              {t("recipes.slots.title", "Add-on slots")}
            </h2>
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
              {t("recipes.slots.info", "Which add-on groups customers can pick for this item, and how many.")}
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setSlotOpen(true)}>
            <Plus className="size-4" /> {t("recipes.slots.addSlot", "Add slot")}
          </Button>
        </div>
        {(Array.isArray(slots.data) ? slots.data : []).length === 0 ? (
          <EmptyState
            className="rounded-none border-0 py-8"
            icon={Sliders}
            title={t("recipes.slots.empty", "No add-on slots")}
            description={t("recipes.slots.emptyHint", "Add a slot to let customers pick add-ons.")}
          />
        ) : (
          <div className="divide-y divide-border">
            {(Array.isArray(slots.data) ? slots.data : []).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{slotLabel(s)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`menu.addonTypes.${s.addon_type}`, s.addon_type)} · {t("recipes.slots.minMaxSummary", { min: s.min_selections, max: s.max_selections ?? "∞", defaultValue: `min {{min}}, max {{max}}` })}
                  </p>
                </div>
                <Badge variant={s.is_required ? "secondary" : "outline"}>
                  {s.is_required ? t("recipes.slots.required", "Required") : t("recipes.slots.optional", "Optional")}
                </Badge>
                <Button variant="ghost" size="icon-sm" className="shrink-0 text-destructive" aria-label={t("recipes.slots.removeSlot", "Remove slot")} onClick={() => void removeSlot(s)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional fields section */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2 className="size-4 text-muted-foreground" />
              {t("recipes.optionals.title", "Optional fields")}
            </h2>
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
              {t("recipes.optionals.info", "Yes/no checkboxes that can deduct an ingredient.")}
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setOptOpen(true)}>
            <Plus className="size-4" /> {t("recipes.optionals.addField", "Add field")}
          </Button>
        </div>
        {(Array.isArray(optionals.data) ? optionals.data : []).length === 0 ? (
          <EmptyState
            className="rounded-none border-0 py-8"
            icon={Settings2}
            title={t("recipes.optionals.empty", "No optional fields")}
            description={t("recipes.optionals.emptyHint", "Add a field to give customers yes/no choices.")}
          />
        ) : (
          <div className="divide-y divide-border">
            {(Array.isArray(optionals.data) ? optionals.data : []).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{getTranslatedName(o, i18n.language)}</p>
                  {o.ingredient_name ? (
                    <p className="text-xs text-muted-foreground">
                      {t("recipes.optionals.deducts", { qty: Number(o.quantity_used ?? 0), unit: t(`units.${o.ingredient_unit}`, o.ingredient_unit ?? ""), name: o.ingredient_name, defaultValue: `Deducts ${o.quantity_used} ${o.ingredient_unit} ${o.ingredient_name}` })}
                    </p>
                  ) : null}
                </div>
                <Badge variant={o.is_active ? "secondary" : "outline"}>
                  {o.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
                </Badge>
                <Button variant="ghost" size="icon-sm" className="shrink-0 text-destructive" aria-label={t("recipes.optionals.removeField", "Remove field")} onClick={() => void removeOpt(o)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {slotOpen ? <SlotDialog itemId={itemId} open={slotOpen} onOpenChange={setSlotOpen} /> : null}
      {optOpen ? <OptionalDialog itemId={itemId} catalog={catalog.data ?? []} open={optOpen} onOpenChange={setOptOpen} /> : null}
    </div>
  );
}

function SlotDialog({ itemId, open, onOpenChange }: { itemId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [addonType, setAddonType] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("");
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!addonType.trim()) return;
    setBusy(true);
    try {
      await createAddonSlot(itemId, {
        addon_type: addonType.trim(),
        label: labelEn.trim() || null,
        label_translations: labelAr.trim() ? { ar: labelAr.trim() } : undefined,
        min_selections: parseInt(min) || 0,
        max_selections: max.trim() === "" ? null : parseInt(max),
        is_required: required,
      });
      void invalidateRecipes();
      toast.success(t("recipes.slots.saved", "Slot saved"));
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
          <DialogTitle>{t("recipes.slots.addSlot", "Add slot")}</DialogTitle>
          <DialogDescription>{t("recipes.slots.info", "Which add-on groups customers can pick for this item, and how many.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>{t("recipes.slots.addonType", "Add-on type")}</Label><Input placeholder="coffee_type / milk_type / extra" value={addonType} onChange={(e) => setAddonType(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t("recipes.slots.displayLabelEn", "Display label (EN)")}</Label><Input placeholder={t("recipes.slots.labelPh", "e.g. Choose your milk")} value={labelEn} onChange={(e) => setLabelEn(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{t("recipes.slots.displayLabelAr", "Display label (AR)")}</Label><Input dir="rtl" value={labelAr} onChange={(e) => setLabelAr(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t("recipes.slots.minSelections", "Min selections")}</Label><Input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{t("recipes.slots.maxSelections", "Max selections")}</Label><Input type="number" min="1" placeholder={t("recipes.slots.maxHint", "blank = unlimited")} value={max} onChange={(e) => setMax(e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div><Label>{t("recipes.slots.required", "Required")}</Label><p className="text-xs text-muted-foreground">{t("recipes.slots.requiredHint", "Customer must choose at least the minimum")}</p></div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!addonType.trim()} onClick={() => void submit()}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionalDialog({ itemId, catalog, open, onOpenChange }: { itemId: string; catalog: OrgIngredient[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [ingredientId, setIngredientId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const options = useMemo(() => catalog.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name, hint: t(`units.${c.unit}`, c.unit) })), [catalog, t]);
  const ing = ingredientId ? byId.get(ingredientId) : undefined;

  const submit = async () => {
    if (!nameEn.trim()) return;
    setBusy(true);
    try {
      await createOptionalField(itemId, {
        name: nameEn.trim(),
        name_translations: nameAr.trim() ? { ar: nameAr.trim() } : undefined,
        org_ingredient_id: ingredientId,
        ingredient_name: ing?.name ?? null,
        ingredient_unit: ing?.unit ?? null,
        quantity_used: ing && qty.trim() ? parseFloat(qty) : null,
      });
      void invalidateRecipes();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recipes.optionals.addField", "Add field")}</DialogTitle>
          <DialogDescription>{t("recipes.optionals.info", "Yes/no checkboxes that can deduct an ingredient.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t("recipes.optionals.checkboxLabelEn", "Checkbox label (EN)")}</Label><Input placeholder={t("recipes.optionals.labelPh", "e.g. Extra hot")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{t("recipes.optionals.checkboxLabelAr", "Checkbox label (AR)")}</Label><Input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
          </div>
          <div className="space-y-3 rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t("recipes.optionals.inventoryItem", "Deduct an inventory item (optional)")}</p>
            <Combobox options={options} value={ingredientId} onChange={setIngredientId} placeholder={t("recipes.ingredient", "Ingredient")} />
            {ing ? (
              <div className="space-y-1.5"><Label>{t("recipes.quantity", "Qty")} ({t(`units.${ing.unit}`, ing.unit)})</Label><Input type="number" step="0.001" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!nameEn.trim()} onClick={() => void submit()}>{t("recipes.optionals.saveField", "Save field")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
