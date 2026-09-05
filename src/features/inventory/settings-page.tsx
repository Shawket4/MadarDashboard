import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Plus, Settings2, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IngredientCategory } from "@/data/api/generated/models";
import {
  createIngredientCategory, deleteIngredientCategory, updateIngredientCategory, updateInventorySettings,
  useGetInventorySettings, useListIngredientCategories,
} from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateInventory } from "./lib";

/** Inventory ▸ Settings — org-wide rules: variance tolerance and categories. */
export function SettingsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const settings = useGetInventorySettings(orgId ?? "", { query: { enabled: !!orgId } });
  const categories = useListIngredientCategories(orgId ?? "", { query: { enabled: !!orgId } });

  const [pct, setPct] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<IngredientCategory | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (settings.data) setPct(String(settings.data.stocktake_variance_threshold_pct));
  }, [settings.data]);

  const sorted = useMemo(() => [...(categories.data ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [categories.data]);
  const reassignOptions = useMemo(() => sorted.filter((c) => c.id !== deleting?.id), [sorted, deleting]);

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("inventory.settings.title", "Inventory settings")} />
        <EmptyState icon={Settings2} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  const save = async () => {
    const value = parseFloat(pct);
    if (!Number.isFinite(value) || value < 0) return;
    setBusy(true);
    try {
      await updateInventorySettings(orgId, { stocktake_variance_threshold_pct: value });
      await invalidateInventory();
      toast.success(t("inventory.settings.saved", "Settings saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createIngredientCategory(orgId, { name: newName.trim() });
      await invalidateInventory();
      setNewName("");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const rename = async () => {
    if (!editing || !editing.name.trim()) return;
    setWorking(true);
    try {
      await updateIngredientCategory(orgId, editing.id, { name: editing.name.trim() });
      await invalidateInventory();
      setEditing(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    if (deleting.ingredient_count > 0 && !reassignTo) return;
    setWorking(true);
    try {
      await deleteIngredientCategory(orgId, deleting.id, reassignTo ? { reassign_to: reassignTo } : undefined);
      await invalidateInventory();
      setDeleting(null);
      setReassignTo("");
      toast.success(t("common.done", "Done"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("inventory.settings.title", "Inventory settings")}
        description={t("inventory.settings.subtitle", "Organization-wide inventory rules")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.settings.varianceThreshold", "Stock-count variance tolerance")}</CardTitle>
            <CardDescription>
              {t("inventory.settings.varianceThresholdHint", "A counted item is flagged when its difference from book stock is at least this percent. Flagged items need a reason before a count can be finalized.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-48 space-y-1.5">
              <Label>{t("inventory.settings.percent", "Percent")}</Label>
              <div className="relative">
                <Input type="number" min="0" step="0.1" value={pct} onChange={(e) => setPct(e.target.value)} disabled={settings.isLoading} className="pe-8 tabular" />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Button loading={busy} disabled={settings.isLoading || pct === ""} onClick={() => void save()}>
              {t("common.save", "Save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tags className="size-4" />{t("inventory.settings.categories", "Ingredient categories")}</CardTitle>
            <CardDescription>
              {t("inventory.settings.categoriesHint", "Group ingredients for counting and reports. Milk and coffee-bean categories also drive swap add-ons on the menu.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y rounded-lg border">
              {sorted.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  {editing?.id === c.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} className="h-8" autoFocus onKeyDown={(e) => { if (e.key === "Enter") void rename(); if (e.key === "Escape") setEditing(null); }} />
                      <Button size="icon-sm" variant="ghost" loading={working} onClick={() => void rename()} aria-label={t("common.save", "Save")}><Check className="size-4" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(null)} aria-label={t("common.cancel", "Cancel")}><X className="size-4" /></Button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <code>{c.slug}</code> · {t("inventory.settings.ingredientCount", { count: c.ingredient_count, defaultValue: `${c.ingredient_count} ingredients` })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {c.slug === "general" ? <Badge variant="secondary">{t("inventory.settings.defaultCategory", "Default")}</Badge> : null}
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name })} aria-label={t("common.edit", "Edit")}><Pencil className="size-4" /></Button>
                        {c.slug !== "general" ? (
                          <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => { setDeleting(c); setReassignTo(""); }} aria-label={t("common.delete", "Delete")}><Trash2 className="size-4" /></Button>
                        ) : null}
                      </div>
                    </>
                  )}
                </li>
              ))}
              {sorted.length === 0 && !categories.isLoading ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">{t("inventory.settings.noCategories", "No categories yet")}</li>
              ) : null}
            </ul>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("inventory.catalog.newCategoryName", "Category name")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void addCategory(); }}
              />
              <Button loading={adding} disabled={!newName.trim()} onClick={() => void addCategory()}>
                <Plus className="size-4" /> {t("common.add", "Add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inventory.settings.deleteCategory", { name: deleting?.name ?? "", defaultValue: `Delete "${deleting?.name ?? ""}"?` })}</DialogTitle>
            <DialogDescription>
              {deleting && deleting.ingredient_count > 0
                ? t("inventory.settings.deleteCategoryReassign", { count: deleting.ingredient_count, defaultValue: `${deleting.ingredient_count} ingredients use this category. Choose where they should move.` })
                : t("inventory.settings.deleteCategoryEmpty", "This category has no ingredients.")}
            </DialogDescription>
          </DialogHeader>
          {deleting && deleting.ingredient_count > 0 ? (
            <div className="space-y-1.5">
              <Label>{t("inventory.settings.moveTo", "Move ingredients to")}</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger><SelectValue placeholder={t("inventory.catalog.category", "Category")} /></SelectTrigger>
                <SelectContent>
                  {reassignOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>{t("common.cancel", "Cancel")}</Button>
            <Button variant="destructive" loading={working} disabled={!!deleting && deleting.ingredient_count > 0 && !reassignTo} onClick={() => void remove()}>
              {t("common.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
