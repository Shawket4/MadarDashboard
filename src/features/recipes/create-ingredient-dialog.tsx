import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrgIngredient } from "@/data/api/generated/models";
import { createCatalogItem, useListIngredientCategories } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres } from "@/lib/format";
import { invalidateRecipes } from "./util";

const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ingredient: OrgIngredient) => void;
}

/**
 * Lightweight inline ingredient onboarding for the recipe builder. Categories
 * come from the org (`milk` / `coffee_bean` carry swap semantics: a milk or
 * coffee swap add-on replaces the base recipe line of the matching category).
 */
export function CreateIngredientDialog({ orgId, open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);

  const categories = useListIngredientCategories(orgId, { query: { enabled: open && !!orgId } });

  useEffect(() => {
    if (!open || categoryId) return;
    const general = (categories.data ?? []).find((c) => c.slug === "general") ?? categories.data?.[0];
    if (general) setCategoryId(general.id);
  }, [open, categoryId, categories.data]);

  const submit = async () => {
    if (!name.trim()) return;
    const trimmed = cost.trim();
    const cost_per_unit = trimmed === "" ? null : egpToPiastres(parseFloat(trimmed));
    setBusy(true);
    try {
      const created = await createCatalogItem(orgId, { name: name.trim(), category_id: categoryId || null, unit, cost_per_unit });
      void invalidateRecipes();
      onCreated(created);
      toast.success(t("common.savedChanges", "Changes saved"));
      onOpenChange(false);
      setName(""); setCost(""); setCategoryId(""); setUnit("g");
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
          <DialogTitle>{t("recipes.createIngredient", "Create ingredient")}</DialogTitle>
          <DialogDescription>{t("recipes.subtitle", "Define what each item and add-on consumes")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>{t("inventory.catalog.name", "Name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.category", "Category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={t("inventory.catalog.category", "Category")} /></SelectTrigger>
                <SelectContent>{(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.catalog.unit", "Unit")}</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{t(`units.${u}`, u)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>{t("inventory.catalog.costPerUnit", "Cost / unit (EGP)")}</Label><Input type="number" step="0.0001" min="0" placeholder="—" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!name.trim()} onClick={() => void submit()}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
