import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarClock, CalendarRange, Clock, Infinity as InfinityIcon, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { Combobox } from "@/components/app/combobox";
import { ImageUploader } from "@/components/app/image-uploader";
import { cn } from "@/lib/utils";
import {
  createBundle, updateBundle, uploadMenuItemImage, useListBranches, useListMenuItems,
} from "@/data/api/generated/api";
import type { BundleWithComponents, MenuItem, UploadResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { invalidateBundles } from "./util";

type AvailMode = "permanent" | "dates" | "times" | "full";
const imageUrlOf = (res: UploadResponse): string => {
  const r = res as { image_url?: string; url?: string };
  return r.image_url ?? r.url ?? "";
};
const arOf = (tr: unknown): string => {
  const t = tr as Record<string, unknown> | null | undefined;
  return t && typeof t.ar === "string" ? t.ar : "";
};

interface Props {
  orgId: string;
  bundle: BundleWithComponents | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function BundleDialog({ orgId, bundle, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const isEdit = !!bundle;

  const { data: menuItems = [] } = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const { data: branches = [] } = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId } });
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        price: z.coerce.number().min(0.01, t("common.requiredField", "This field is required")),
        components: z.array(z.object({ item_id: z.string(), quantity: z.coerce.number().min(1) })),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const initialMode = (): AvailMode => {
    const d = !!(bundle?.available_from_date || bundle?.available_until_date);
    const tm = !!(bundle?.available_from_time || bundle?.available_until_time);
    if (d && tm) return "full";
    if (d) return "dates";
    if (tm) return "times";
    return "permanent";
  };

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: bundle?.name ?? "",
      name_ar: arOf(bundle?.name_translations),
      description: bundle?.description ?? "",
      description_ar: arOf(bundle?.description_translations),
      price: bundle ? piastresToEgp(bundle.price) : 0,
      components: bundle ? bundle.components.map((c) => ({ item_id: c.item_id, quantity: c.quantity })) : [{ item_id: "", quantity: 1 }, { item_id: "", quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "components" });

  const [branchIds, setBranchIds] = useState<string[]>(bundle?.branch_ids ?? []);
  const [availMode, setAvailMode] = useState<AvailMode>(initialMode);
  const [fromDate, setFromDate] = useState(bundle?.available_from_date ?? "");
  const [untilDate, setUntilDate] = useState(bundle?.available_until_date ?? "");
  const [fromTime, setFromTime] = useState(bundle?.available_from_time ?? "");
  const [untilTime, setUntilTime] = useState(bundle?.available_until_time ?? "");
  const [busy, setBusy] = useState(false);

  const watched = form.watch("components");
  const itemById = useMemo(() => new Map(menuItems.map((m: MenuItem) => [m.id, m])), [menuItems]);
  const retailValue = watched.reduce((sum, c) => sum + (itemById.get(c.item_id)?.base_price ?? 0) * (Number(c.quantity) || 1), 0);
  const priceP = egpToPiastres(Number(form.watch("price")) || 0);
  // Per-unit cost of each saved component, looked up while iterating the LIVE
  // watched rows — so edited quantities and removed items reflect immediately.
  // Items added this session have no saved cost yet (counted 0 until re-fetch).
  const costByItem = useMemo(
    () => new Map((bundle?.components ?? []).map((c) => [c.item_id, c.item_cost])),
    [bundle],
  );
  const recipeCost = isEdit
    ? watched.reduce((sum, w) => sum + (costByItem.get(w.item_id) ?? 0) * (Number(w.quantity) || 1), 0)
    : 0;
  const savings = retailValue > priceP ? retailValue - priceP : 0;
  const profit = isEdit && priceP > recipeCost ? priceP - recipeCost : 0;

  const optionsFor = (idx: number) =>
    menuItems
      .filter((m) => m.id === watched[idx]?.item_id || !watched.some((w) => w.item_id === m.id))
      .map((m) => ({ value: m.id, label: tname(m), hint: fmtMoney(m.base_price) }));

  const submit = async (v: Values) => {
    const components = v.components.filter((c) => c.item_id && Number(c.quantity) >= 1).map((c, i) => ({ item_id: c.item_id, quantity: Number(c.quantity), position: i + 1 }));
    if (components.length < 2) {
      toast.error(t("bundles.componentsHint", "Add 2–6 items that make up this bundle."));
      return;
    }
    const datesOn = availMode === "dates" || availMode === "full";
    const timesOn = availMode === "times" || availMode === "full";
    const av = (val: string, on: boolean) => (on ? (val || (isEdit ? null : undefined)) : (isEdit ? null : undefined));
    const name_translations = v.name_ar ? { ar: v.name_ar } : undefined;
    const description_translations = v.description_ar ? { ar: v.description_ar } : undefined;
    const common = {
      name: v.name,
      name_translations,
      description: v.description || null,
      description_translations,
      price: egpToPiastres(v.price),
      components,
      branch_ids: branchIds,
      available_from_date: av(fromDate, datesOn),
      available_until_date: av(untilDate, datesOn),
      available_from_time: av(fromTime, timesOn),
      available_until_time: av(untilTime, timesOn),
    };
    setBusy(true);
    try {
      if (isEdit) await updateBundle(bundle.id, common);
      else await createBundle({ org_id: orgId, ...common });
      void invalidateBundles();
      toast.success(isEdit ? t("bundles.updatedToast", "Bundle updated") : t("bundles.createdToast", "Bundle created"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const MODES: { key: AvailMode; label: string; icon: typeof Clock }[] = [
    { key: "permanent", label: t("bundles.avail.permanent", "Always"), icon: InfinityIcon },
    { key: "dates", label: t("bundles.avail.dateRange", "Date range"), icon: CalendarRange },
    { key: "times", label: t("bundles.avail.timeWindow", "Time window"), icon: Clock },
    { key: "full", label: t("bundles.avail.dateAndTime", "Date + time"), icon: CalendarClock },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("bundles.editTitle", "Edit bundle") : t("bundles.newTitle", "New bundle")}</DialogTitle>
          <DialogDescription>{t("bundles.subtitle", "Combo deals that group items at a special price")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: details + availability */}
            <div className="space-y-4 lg:col-span-7">
              <BilingualField control={form.control} enName="name" arName="name_ar" label={t("bundles.bundleName", "Bundle name")} />
              <BilingualField control={form.control} enName="description" arName="description_ar" label={t("common.description", "Description")} textarea />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bundles.price", "Bundle price (EGP)")}</FormLabel>
                  <FormControl><Input type="number" step="0.5" min="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Availability */}
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("bundles.availability", "Availability")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => setAvailMode(key)}
                      className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", availMode === key ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:text-foreground")}>
                      <Icon className="size-3" /> {label}
                    </button>
                  ))}
                </div>
                {availMode === "permanent" ? (
                  <p className="text-xs text-muted-foreground">{t("bundles.avail.permanentDesc", "No date or time restrictions.")}</p>
                ) : null}
                {(availMode === "dates" || availMode === "full") ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><FormLabel className="text-xs">{t("bundles.availableFromDate", "From date")}</FormLabel><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
                    <div className="space-y-1"><FormLabel className="text-xs">{t("bundles.availableUntilDate", "Until date")}</FormLabel><Input type="date" value={untilDate} onChange={(e) => setUntilDate(e.target.value)} /></div>
                  </div>
                ) : null}
                {(availMode === "times" || availMode === "full") ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><FormLabel className="text-xs">{t("bundles.availableFromTime", "From time")}</FormLabel><Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} /></div>
                    <div className="space-y-1"><FormLabel className="text-xs">{t("bundles.availableUntilTime", "Until time")} <span className="text-muted-foreground">{t("bundles.avail.timeWindowHint", "(repeats every day)")}</span></FormLabel><Input type="time" value={untilTime} onChange={(e) => setUntilTime(e.target.value)} /></div>
                  </div>
                ) : null}
              </div>

              {/* Branches */}
              <div className="space-y-2">
                <FormLabel>{t("bundles.branches", "Branches")}</FormLabel>
                <p className="text-xs text-muted-foreground">{t("bundles.branchesHint", "Leave empty to offer at all branches.")}</p>
                <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto rounded-xl border bg-muted/10 p-3 sm:grid-cols-3">
                  {branches.filter((b) => b.is_active).map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs hover:bg-muted/40">
                      <Checkbox checked={branchIds.includes(b.id)} onCheckedChange={(c) => setBranchIds((cur) => (c ? [...cur, b.id] : cur.filter((id) => id !== b.id)))} />
                      <span className="truncate">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: components + value panel + image */}
            <div className="space-y-4 lg:col-span-5">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-semibold">{t("bundles.components", "Items")}</FormLabel>
                <span className="text-xs text-muted-foreground">({fields.length}/6)</span>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">{t("bundles.componentsHint", "Add 2–6 items that make up this bundle.")}</p>
              <div className="max-h-[300px] space-y-3 overflow-y-auto pe-1">
                {fields.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2">
                    <div className="min-w-0 flex-1">
                      <FormField control={form.control} name={`components.${idx}.item_id`} render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl><Combobox options={optionsFor(idx)} value={field.value || null} onChange={(v) => field.onChange(v)} placeholder={t("bundles.itemPh", "Select item")} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name={`components.${idx}.quantity`} render={({ field }) => (
                      <FormItem className="w-16 space-y-0"><FormControl><Input type="number" min="1" className="h-9 px-2 text-center" {...field} /></FormControl></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" disabled={fields.length <= 2} onClick={() => remove(idx)}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
              </div>
              {fields.length < 6 ? (
                <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ item_id: "", quantity: 1 })}>
                  <Plus className="size-4" /> {t("bundles.addItem", "Add item")}
                </Button>
              ) : null}

              <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-xs">
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{t("bundles.cost", "Retail value")}</span><span className="font-semibold tabular">{fmtMoney(retailValue)}</span></div>
                {isEdit && recipeCost > 0 ? <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{t("bundles.computedCostLabel", "Recipe cost")}</span><span className="font-semibold tabular text-success">{fmtMoney(recipeCost)}</span></div> : null}
                {savings > 0 ? <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{t("bundles.customerSavings", "Customer saves")}</span><span className="font-bold tabular text-warning">-{fmtMoney(savings)}</span></div> : null}
                {isEdit && profit > 0 ? <div className="flex justify-between"><span className="text-muted-foreground">{t("bundles.computedProfitLabel", "Profit")}</span><span className="font-bold tabular text-success">{fmtMoney(profit)}</span></div> : null}
              </div>

              <div className="space-y-2 border-t pt-2">
                <FormLabel className="text-xs font-semibold">{t("bundles.image", "Cover image")}</FormLabel>
                {isEdit ? (
                  <ImageUploader
                    value={bundle.image_url}
                    onUpload={async (file) => {
                      const res = await uploadMenuItemImage(bundle.id, { image: file });
                      const url = imageUrlOf(res);
                      await updateBundle(bundle.id, { image_url: url });
                      void invalidateBundles();
                      return url;
                    }}
                    onRemove={bundle.image_url ? async () => { await updateBundle(bundle.id, { image_url: null }); void invalidateBundles(); } : undefined}
                    hint={t("bundles.imageHint", "PNG/JPG/WebP, up to 5 MB")}
                  />
                ) : (
                  <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">{t("bundles.imageAfterSave", "You can upload a cover image after saving.")}</p>
                )}
              </div>
            </div>

            <DialogFooter className="lg:col-span-12">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{isEdit ? t("common.save", "Save") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
