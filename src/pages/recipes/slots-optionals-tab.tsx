import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Info, Plus, Settings2, Sliders, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { ListPicker } from "@/shared/ui/list-picker";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { useListMenuItems, useListAddonSlots, createAddonSlot, deleteAddonSlot, useListOptionalFields, createOptionalField, deleteOptionalField } from "@/shared/api/generated/api";
import { useCatalog } from "@/entities/inventory/queries";
import { slotSchema, optionalSchema, type SlotValues, type OptionalValues } from "@/entities/menu/schemas";
import { getGetMenuItemQueryKey, getListAddonSlotsQueryKey, getListOptionalFieldsQueryKey } from "@/shared/api/generated/api";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtUnit } from "@/shared/lib/format";
import { getTranslatedName, getTranslatedLabel } from "@/shared/lib/translation";

// ─────────────────────────────────────────────────────────────────────────────
// Slots & Optionals Tab
// ─────────────────────────────────────────────────────────────────────────────
export function SlotsOptionalsTab({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [selItemId, setSelItemId] = useState<string | null>(null);

  const { data: items = [] } = useListMenuItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: slots = [] } = useListAddonSlots(selItemId as string, { query: { enabled: !!selItemId } });
  const { data: optionals = [] } = useListOptionalFields(selItemId as string, { query: { enabled: !!selItemId } });
  const { data: catalog = [] } = useCatalog(orgId);

  const [slotDlg, setSlotDlg] = useState(false);
  const slotForm = useForm<SlotValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: { addon_type: "", label: "", label_translations: {}, is_required: false, min_selections: 0, max_selections: null, display_order: 0 },
  });

  const saveSlot = useMutation({
    mutationFn: (v: SlotValues) =>
      createAddonSlot(selItemId!, {
        addon_type: v.addon_type,
        label: v.label || null,
        label_translations: v.label_translations,
        is_required: v.is_required,
        min_selections: v.min_selections,
        max_selections: v.max_selections ?? null,
        display_order: v.display_order,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAddonSlotsQueryKey(selItemId ?? "") });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(selItemId ?? "") });
      toast.success(t("recipes.slots.saved"));
      setSlotDlg(false);
      slotForm.reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeSlot = useMutation({
    mutationFn: (slotId: string) => deleteAddonSlot(selItemId!, slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAddonSlotsQueryKey(selItemId ?? "") });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(selItemId ?? "") });
      toast.success(t("recipes.slots.removed"));
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const [optDlg, setOptDlg] = useState(false);
  const optForm = useForm<OptionalValues>({
    resolver: zodResolver(optionalSchema),
    defaultValues: { name: "", name_translations: {}, org_ingredient_id: null, ingredient_name: null, ingredient_unit: null, quantity_used: null, is_active: true },
  });

  const saveOpt = useMutation({
    mutationFn: (v: OptionalValues) =>
      createOptionalField(selItemId!, {
        name: v.name,
        name_translations: v.name_translations,
        org_ingredient_id: v.org_ingredient_id ?? null,
        ingredient_name: v.ingredient_name ?? null,
        ingredient_unit: v.ingredient_unit ?? null,
        quantity_used: v.quantity_used ?? null,
        is_active: v.is_active,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListOptionalFieldsQueryKey(selItemId ?? "") });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(selItemId ?? "") });
      toast.success(t("common.save"));
      setOptDlg(false);
      optForm.reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeOpt = useMutation({
    mutationFn: (fieldId: string) => deleteOptionalField(selItemId!, fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListOptionalFieldsQueryKey(selItemId ?? "") });
      qc.invalidateQueries({ queryKey: getGetMenuItemQueryKey(selItemId ?? "") });
      toast.success(t("common.delete"));
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <ListPicker
        heading={t("recipes.selectDrink")}
        items={items.map((it) => ({ id: it.id, label: it.name, sublabel: it.description ?? null }))}
        selectedId={selItemId}
        onSelect={setSelItemId}
        searchPlaceholder={t("menu.searchItems")}
        emptyLabel={t("menu.emptyItems")}
      />

      <div className="space-y-4">
        {!selItemId ? (
          <div className="rounded-xl border bg-card">
            <EmptyState icon={Sliders} title={t("recipes.selectDrink")} description={t("recipes.selectDrinkHint")} className="h-[600px]" />
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <p className="font-bold flex items-center gap-2"><Sliders size={14} /> {t("recipes.slots.title")}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-lg">{t("recipes.slots.info")}</p>
                  </div>
                  <Button size="sm" onClick={() => { slotForm.reset(); setSlotDlg(true); }}><Plus /> {t("recipes.slots.addSlot")}</Button>
                </div>
                {slots.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">{t("recipes.slots.empty")}</p>
                ) : (
                  <div className="p-4 space-y-2">
                    {slots.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{getTranslatedLabel(s, i18n.language) ?? t(`menu.addonTypes.${s.addon_type}`, { defaultValue: s.addon_type })}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`menu.addonTypes.${s.addon_type}`, { defaultValue: s.addon_type })} · min {s.min_selections}, max {s.max_selections ?? "∞"}
                          </p>
                        </div>
                        <Badge variant={s.is_required ? "destructive" : "outline"}>{s.is_required ? t("recipes.slots.required") : t("recipes.slots.optional")}</Badge>
                        <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => removeSlot.mutate(s.id)}><Trash2 size={12} /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <p className="font-bold flex items-center gap-2"><Settings2 size={14} /> {t("recipes.optionals.title")}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-lg">{t("recipes.optionals.info")}</p>
                  </div>
                  <Button size="sm" onClick={() => { optForm.reset(); setOptDlg(true); }}><Plus /> {t("recipes.optionals.addField")}</Button>
                </div>
                {optionals.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">{t("recipes.optionals.empty")}</p>
                ) : (
                  <div className="p-4 space-y-2">
                    {optionals.map((o) => (
                      <div key={o.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{getTranslatedName(o, i18n.language)}</p>
                          {o.ingredient_name && (
                            <p className="text-xs text-muted-foreground">
                              {t("recipes.optionals.deducts", {
                                qty: Number(o.quantity_used ?? 0).toFixed(3),
                                unit: fmtUnit(o.ingredient_unit ?? ""),
                                name: o.ingredient_name,
                              })}
                            </p>
                          )}
                        </div>
                        <Badge variant={o.is_active ? "success" : "outline"}>{o.is_active ? t("common.active") : t("common.inactive")}</Badge>
                        <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => removeOpt.mutate(o.id)}><Trash2 size={12} /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={slotDlg} onOpenChange={setSlotDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("recipes.slots.addSlot")}</DialogTitle></DialogHeader>
          <Form {...slotForm}>
            <form onSubmit={slotForm.handleSubmit((v) => saveSlot.mutate(v))}>
              <DialogBody>
                <FormField control={slotForm.control} name="addon_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recipes.slots.addonType")}</FormLabel>
                    <FormControl><Input placeholder="coffee_type / milk_type / extra / sweetener" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={slotForm.control} name="label" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("recipes.slots.displayLabel")} (EN)</FormLabel>
                      <FormControl><Input placeholder={t("recipes.slots.labelPh")} {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={slotForm.control} name="label_translations.ar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("recipes.slots.displayLabel")} (AR)</FormLabel>
                      <FormControl><Input placeholder="الاسم بالعربي" dir="rtl" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={slotForm.control} name="min_selections" render={({ field }) => (
                    <FormItem><FormLabel>{t("recipes.slots.minSelections")}</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={slotForm.control} name="max_selections" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("recipes.slots.maxSelections")}</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} placeholder={t("recipes.slots.maxHint")} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={slotForm.control} name="is_required" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3 !space-y-0">
                    <div><FormLabel>{t("recipes.slots.required")}</FormLabel><p className="text-xs text-muted-foreground">{t("recipes.slots.requiredHint")}</p></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSlotDlg(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={saveSlot.isPending}>{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={optDlg} onOpenChange={setOptDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("recipes.optionals.addField")}</DialogTitle></DialogHeader>
          <Form {...optForm}>
            <form onSubmit={optForm.handleSubmit((v) => saveOpt.mutate(v))}>
              <DialogBody>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={optForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>{t("recipes.optionals.checkboxLabel")} (EN)</FormLabel><FormControl><Input placeholder={t("recipes.optionals.labelPh")} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={optForm.control} name="name_translations.ar" render={({ field }) => (
                    <FormItem><FormLabel>{t("recipes.optionals.checkboxLabel")} (AR)</FormLabel><FormControl><Input placeholder="الاسم بالعربي" dir="rtl" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="rounded-lg bg-muted/40 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info size={12} /> {t("common.optional")} — {t("recipes.optionals.inventoryItem")}
                  </div>
                  <FormField control={optForm.control} name="org_ingredient_id" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SearchableSelect
                          allowClear
                          options={catalog.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit), data: c }))}
                          value={field.value ?? null}
                          onChange={(v, opt) => {
                            field.onChange(v);
                            if (opt?.data) {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const ing = opt.data as any;
                              optForm.setValue("ingredient_name", ing.name);
                              optForm.setValue("ingredient_unit", ing.unit);
                            } else {
                              optForm.setValue("ingredient_name", null);
                              optForm.setValue("ingredient_unit", null);
                              optForm.setValue("quantity_used", null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {optForm.watch("org_ingredient_id") && (
                    <FormField control={optForm.control} name="quantity_used" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.qty")} ({fmtUnit(optForm.watch("ingredient_unit") ?? "")})</FormLabel>
                        <FormControl><Input type="number" step="0.001" min="0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOptDlg(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={saveOpt.isPending}>{t("recipes.optionals.saveField")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

