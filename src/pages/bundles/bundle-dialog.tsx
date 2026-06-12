import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Infinity, Trash2, Calendar, Clock, CalendarRange, CalendarClock, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { TimeInput } from "@/shared/ui/time-input";
import { Textarea } from "@/shared/ui/textarea";
import { ImageUploader } from "@/shared/ui/image-uploader";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";

import { createBundleSchema, type BundleFormValues } from "@/entities/bundle/schemas";
import { useListMenuItems, useCreateBundle, useUpdateBundle, uploadMenuItemImage, getListBundlesQueryKey } from "@/shared/api/generated/api";
import { useListBranches as useBranches } from "@/shared/api/generated/api";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney } from "@/shared/lib/format";
import type { BundleWithComponents } from "@/shared/api/generated/models/bundleWithComponents";

// ── CRUD Bundle Dialog ────────────────────────────────────────────────────────
interface BundleDialogProps {
  open: boolean;
  onClose: () => void;
  editItem: BundleWithComponents | null;
  orgId: string;
  advisorValues: Partial<BundleFormValues> | null;
}

export function BundleDialog({ open, onClose, editItem, orgId, advisorValues }: BundleDialogProps) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const { data: menuItems = [] } = useListMenuItems({ org_id: orgId as string }, { query: { enabled: !!orgId } });
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });

  const isEdit = !!editItem;

  const bundleSchema = useMemo(() => createBundleSchema(t), [t, i18n.language]);

  // Determine initial availability mode from existing data
  const getInitialMode = () => {
    const hasFromDate = !!(editItem?.available_from_date || editItem?.available_until_date);
    const hasTime = !!(editItem?.available_from_time || editItem?.available_until_time);
    if (hasFromDate && hasTime) return "full" as const;
    if (hasFromDate) return "dates" as const;
    if (hasTime) return "times" as const;
    return "permanent" as const;
  };

  type AvailMode = "permanent" | "dates" | "times" | "full";
  const [availMode, setAvailMode] = useState<AvailMode>(getInitialMode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: editItem?.name ?? advisorValues?.name ?? "",
      name_translations: editItem?.name_translations ?? {},
      description: editItem?.description ?? advisorValues?.description ?? "",
      description_translations: editItem?.description_translations ?? {},
      price: editItem ? editItem.price / 100 : (advisorValues?.price ?? ""),
      available_from_time: editItem?.available_from_time ?? "",
      available_until_time: editItem?.available_until_time ?? "",
      available_from_date: editItem?.available_from_date ?? "",
      available_until_date: editItem?.available_until_date ?? "",
      components: editItem
        ? editItem.components.map((c) => ({ item_id: c.item_id, quantity: c.quantity }))
        : advisorValues?.components ?? [{ item_id: "", quantity: 1 }, { item_id: "", quantity: 1 }],
      branch_ids: editItem?.branch_ids ?? advisorValues?.branch_ids ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const createMutation = useCreateBundle();
  const updateMutation = useUpdateBundle();

  // When mode changes, clear the fields that are no longer applicable
  // and set null where needed to explicitly clear them on the backend
  const handleModeChange = (mode: AvailMode) => {
    setAvailMode(mode);
    if (mode === "permanent") {
      // null signals the backend to clear; schema turns empty string → undefined (omit)
      // but we need null to explicitly clear existing values in edit mode
      form.setValue("available_from_date", isEdit ? null : "");
      form.setValue("available_until_date", isEdit ? null : "");
      form.setValue("available_from_time", isEdit ? null : "");
      form.setValue("available_until_time", isEdit ? null : "");
    } else if (mode === "dates") {
      form.setValue("available_from_time", isEdit ? null : "");
      form.setValue("available_until_time", isEdit ? null : "");
    } else if (mode === "times") {
      form.setValue("available_from_date", isEdit ? null : "");
      form.setValue("available_until_date", isEdit ? null : "");
    }
  };

  const handleFormSubmit = (values: BundleFormValues) => {
    const payload = {
      ...values,
      org_id: orgId,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: editItem.id, data: payload },
        {
          onSuccess: () => {
            // FIX: list was never invalidated after save, so the table showed stale data
            qc.invalidateQueries({ queryKey: getListBundlesQueryKey() });
            toast.success(t("bundles.updatedToast"));
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          // FIX: list was never invalidated after save, so the table showed stale data
          qc.invalidateQueries({ queryKey: getListBundlesQueryKey() });
          toast.success(t("bundles.createdToast"));
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  // Image upload handles
  const handleUploadImage = async (file: File) => {
    if (!editItem) return "";
    try {
      const res = await uploadMenuItemImage(editItem.id, { image: file });
      await updateMutation.mutateAsync({ id: editItem.id, data: { image_url: res.image_url } });
      qc.invalidateQueries({ queryKey: getListBundlesQueryKey({ org_id: orgId! }) });
      toast.success(t("common.savedChanges"));
      return res.image_url;
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  const handleRemoveImage = async () => {
    if (!editItem) return;
    try {
      await updateMutation.mutateAsync({ id: editItem.id, data: { image_url: null } });
      qc.invalidateQueries({ queryKey: getListBundlesQueryKey({ org_id: orgId! }) });
      toast.success(t("common.savedChanges"));
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  // Dynamic cost estimations
  const watchedComponents = (form.watch("components") || []) as { item_id: string; quantity: number }[];
  const watchedPriceStr = form.watch("price");
  const watchedPricePiastres = Math.round(parseFloat(typeof watchedPriceStr === "string" ? watchedPriceStr : String(watchedPriceStr || 0)) * 100) || 0;

  const totalRetailValuePiastres = watchedComponents.reduce((sum, c) => {
    const matched = menuItems.find((mi) => mi.id === c.item_id);
    return sum + (matched ? matched.base_price * (c.quantity || 1) : 0);
  }, 0);

  const estimatedRecipeCostPiastres = isEdit
    ? editItem.components.reduce((sum, c) => {
        const itemField = watchedComponents.find((wc) => wc.item_id === c.item_id);
        if (!itemField) return sum;
        return sum + (c.item_cost * (itemField.quantity || 1));
      }, 0)
    : 0;

  const potentialDiscount = totalRetailValuePiastres > watchedPricePiastres ? totalRetailValuePiastres - watchedPricePiastres : 0;
  const potentialProfit = watchedPricePiastres > estimatedRecipeCostPiastres ? watchedPricePiastres - estimatedRecipeCostPiastres : 0;

  // Filter options to exclude duplicates
  const getAvailableOptions = (currentIndex: number) => {
    const selectedIds = watchedComponents.map((c) => c.item_id);
    return menuItems
      .filter((mi) => {
        const idAtCurrent = watchedComponents[currentIndex]?.item_id;
        return mi.id === idAtCurrent || !selectedIds.includes(mi.id);
      })
      .map((mi) => ({
        value: mi.id,
        label: mi.name,
        hint: fmtMoney(mi.base_price),
      }));
  };

  // Mode selector pill buttons
  const MODES: { key: AvailMode; label: string; icon: React.ReactNode }[] = [
    { key: "permanent", label: t("bundles.avail.permanent"), icon: <Infinity size={12} /> },
    { key: "dates", label: t("bundles.avail.dateRange"), icon: <CalendarRange size={12} /> },
    { key: "times", label: t("bundles.avail.timeWindow"), icon: <Clock size={12} /> },
    { key: "full", label: t("bundles.avail.dateAndTime"), icon: <CalendarClock size={12} /> },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="xl" className="max-h-[92vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("bundles.editTitle") : t("bundles.newTitle")}</DialogTitle>
          <DialogDescription>{t("bundles.subtitle")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <DialogBody className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Basic Details & Availability */}
              <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bundles.bundleName")} (EN)</FormLabel>
                      <FormControl>
                        <Input placeholder={t("bundles.namePh")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_translations.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bundles.bundleName")} (AR)</FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم بالعربي" dir="rtl" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.description")} (EN)</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("bundles.descPh")} className="resize-none h-20" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description_translations.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.description")} (AR)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="الوصف بالعربي" dir="rtl" className="resize-none h-20" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                {/* Price — full width now that display_order is gone */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bundles.price")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" min="0" placeholder="150.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Availability Section ───────────────────────────── */}
                <div className="rounded-xl border bg-muted/20 overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                    <Calendar size={13} className="text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t("bundles.availability")}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Mode pill selector */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("bundles.avail.hint")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {MODES.map(({ key, label, icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleModeChange(key)}
                            className={[
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              availMode === key
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:text-foreground",
                            ].join(" ")}
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Permanent — show a calm indicator */}
                    {availMode === "permanent" && (
                      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Infinity size={16} />
                        <div>
                          <p className="text-xs font-semibold">{t("bundles.avail.permanentTitle")}</p>
                          <p className="text-xs opacity-80">{t("bundles.avail.permanentDesc")}</p>
                        </div>
                        {/* If editing a bundle that had restrictions, show that they'll be cleared */}
                        {isEdit && (editItem.available_from_date || editItem.available_until_date || editItem.available_from_time || editItem.available_until_time) && (
                          <span className="ms-auto flex items-center gap-1 text-xs font-medium bg-emerald-500/20 rounded-full px-2 py-0.5">
                            <X size={9} /> {t("bundles.avail.willClear")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date range fields */}
                    {(availMode === "dates" || availMode === "full") && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <CalendarRange size={11} /> {t("bundles.avail.dateRangeLabel")}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="available_from_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{t("bundles.availableFromDate")}</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value || (isEdit ? null : ""))}
                                    />
                                  </FormControl>
                                  {field.value && (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(isEdit ? null : "")}
                                      className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="available_until_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{t("bundles.availableUntilDate")}</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value || (isEdit ? null : ""))}
                                    />
                                  </FormControl>
                                  {field.value && (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(isEdit ? null : "")}
                                      className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Time window fields */}
                    {(availMode === "times" || availMode === "full") && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock size={11} /> {t("bundles.avail.timeWindowLabel")}
                          <span className="ms-1 text-xs font-normal opacity-70">{t("bundles.avail.timeWindowHint")}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="available_from_time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{t("bundles.availableFromTime")}</FormLabel>
                                <FormControl>
                                  <TimeInput
                                    value={field.value}
                                    onChange={(v) => field.onChange(v || (isEdit ? null : ""))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="available_until_time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{t("bundles.availableUntilTime")}</FormLabel>
                                <FormControl>
                                  <TimeInput
                                    value={field.value}
                                    onChange={(v) => field.onChange(v || (isEdit ? null : ""))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branches multi-select */}
                <div className="space-y-2">
                  <FormLabel>{t("bundles.branches")}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t("bundles.branchesHint")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-xl p-3 bg-muted/10 max-h-32 overflow-y-auto no-scrollbar">
                    {branches.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/40 p-1.5 rounded-lg">
                        <input
                          type="checkbox"
                          checked={form.watch("branch_ids")?.includes(b.id)}
                          onChange={(e) => {
                            const current = (form.getValues("branch_ids") || []) as string[];
                            if (e.target.checked) {
                              form.setValue("branch_ids", [...current, b.id]);
                            } else {
                              form.setValue("branch_ids", current.filter((id: string) => id !== b.id));
                            }
                          }}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Components list */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold">{t("bundles.components")}</FormLabel>
                  <span className="text-xs text-muted-foreground">({fields.length}/6)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-[-8px]">{t("bundles.componentsHint")}</p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-xl bg-muted/20 relative group">
                      <div className="flex-1 min-w-0">
                        <FormField
                          control={form.control}
                          name={`components.${idx}.item_id` as const}
                          render={({ field: subField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <SearchableSelect
                                  options={getAvailableOptions(idx)}
                                  value={subField.value}
                                  onChange={(val) => subField.onChange(val || "")}
                                  placeholder={t("bundles.itemPh")}
                                />
                              </FormControl>
                              <FormMessage className="text-xs mt-1" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-16">
                        <FormField
                          control={form.control}
                          name={`components.${idx}.quantity` as const}
                          render={({ field: subField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input type="number" min="1" className="h-9 px-2 text-center" {...subField} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        onClick={() => remove(idx)}
                        disabled={fields.length <= 2}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>

                {fields.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs h-9 border-dashed flex items-center justify-center gap-1.5"
                    onClick={() => append({ item_id: "", quantity: 1 })}
                  >
                    <Plus size={13} /> {t("bundles.addItem")}
                  </Button>
                )}

                {/* Live Value Estimations Panel */}
                <div className="p-4 rounded-xl border bg-muted/40 space-y-2 mt-4 text-xs">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{t("bundles.cost")}:</span>
                    <span className="font-semibold tabular text-foreground">{fmtMoney(totalRetailValuePiastres)}</span>
                  </div>
                  {isEdit && estimatedRecipeCostPiastres > 0 && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">{t("bundles.computedCostLabel")}:</span>
                      <span className="font-semibold tabular text-emerald-500">{fmtMoney(estimatedRecipeCostPiastres)}</span>
                    </div>
                  )}
                  {potentialDiscount > 0 && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">{t("bundles.customerSavings")}</span>
                      <span className="font-bold tabular text-orange-500">-{fmtMoney(potentialDiscount)}</span>
                    </div>
                  )}
                  {isEdit && potentialProfit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("bundles.computedProfitLabel")}:</span>
                      <span className="font-bold tabular text-emerald-500">{fmtMoney(potentialProfit)}</span>
                    </div>
                  )}
                </div>

                {/* Cover Image Upload (Only available after save in create, or active in Edit) */}
                <div className="pt-2 border-t mt-4">
                  <FormLabel className="text-xs font-semibold block mb-2">{t("bundles.image")}</FormLabel>
                  {isEdit ? (
                    <ImageUploader value={editItem.image_url} onUpload={handleUploadImage} onRemove={handleRemoveImage} hint={t("bundles.imageHint")} />
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border">{t("bundles.imageAfterSave")}</p>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? t("common.saveChanges") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

