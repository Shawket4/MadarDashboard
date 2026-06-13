import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createPaymentMethod, updatePaymentMethod } from "@/data/api/generated/api";
import type { OrgPaymentMethod } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { PM_COLORS, PM_ICONS, invalidatePaymentMethods, isSystemMethod } from "./util";

interface Props {
  method: OrgPaymentMethod | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function PaymentMethodDialog({ method, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!method;
  const locked = editing; // IDs cannot change once created
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")).regex(/^[a-z0-9_]+$/, t("settings.pm.idError", "Lowercase letters, numbers and underscores only")),
        labelEn: z.string().min(1, t("common.requiredField", "This field is required")),
        labelAr: z.string().optional(),
        icon: z.string().min(1),
        color: z.string().min(1),
        is_cash: z.boolean(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", labelEn: "", labelAr: "", icon: "money", color: PM_COLORS[2], is_cash: false, is_active: true },
  });

  useEffect(() => {
    if (open) {
      const tr = (method?.label_translations ?? {}) as Record<string, string>;
      form.reset({
        name: method?.name ?? "",
        labelEn: tr.en ?? "",
        labelAr: tr.ar ?? "",
        icon: method?.icon || "money",
        color: method?.color?.startsWith("#") ? method.color : PM_COLORS[2],
        is_cash: method?.is_cash ?? false,
        is_active: method?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, method]);

  const submit = async (v: Values) => {
    const label_translations = { en: v.labelEn, ar: v.labelAr || "" };
    setBusy(true);
    try {
      if (method) await updatePaymentMethod(method.id, { name: v.name, label_translations, color: v.color, icon: v.icon, is_cash: v.is_cash, is_active: v.is_active });
      else await createPaymentMethod({ name: v.name, label_translations, color: v.color, icon: v.icon, is_cash: v.is_cash, is_active: v.is_active });
      void invalidatePaymentMethods();
      toast.success(t("common.saved", "Saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editing ? t("settings.pm.editTitle", "Edit payment method") : t("settings.pm.newTitle", "New payment method")}</DialogTitle>
          <DialogDescription>{t("settings.paymentMethodsHint", "Manage payment methods available for checkout.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.pm.id", "Identifier")}</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. visa_card" disabled={locked || isSystemMethod(method ?? ({} as OrgPaymentMethod))} className="font-mono" onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} /></FormControl>
                <FormDescription>{locked ? t("settings.pm.idLocked", "Identifiers cannot be changed.") : t("settings.pm.idHint", "A unique internal identifier (lowercase, underscores only).")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="labelEn" render={({ field }) => (
                <FormItem><FormLabel>{t("settings.pm.labelEn", "Label (English)")}</FormLabel><FormControl><Input {...field} placeholder="Visa Card" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="labelAr" render={({ field }) => (
                <FormItem><FormLabel>{t("settings.pm.labelAr", "Label (Arabic)")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="فيزا" dir="rtl" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.pm.icon", "Icon")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <ScrollArea className="h-64">
                      {PM_ICONS.map(({ id, label, icon: Icon }) => (
                        <SelectItem key={id} value={id}><span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /> {label}</span></SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.pm.color", "Color")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PM_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => field.onChange(c)} aria-label={c}
                        className="grid size-8 place-items-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" style={{ backgroundColor: c }}>
                        {field.value === c ? <Check className="size-4 text-white drop-shadow-sm" /> : null}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="is_cash" render={({ field }) => (
                <FormItem className="flex h-full items-center justify-between rounded-lg border bg-card p-3">
                  <div className="space-y-0.5"><FormLabel className="text-sm">{t("settings.pm.acceptsCash", "Accepts cash")}</FormLabel><FormDescription className="text-xs">{t("settings.pm.acceptsCashHint", "Counts toward cash drawer.")}</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex h-full items-center justify-between rounded-lg border bg-card p-3">
                  <div className="space-y-0.5"><FormLabel className="text-sm">{t("common.active", "Active")}</FormLabel><FormDescription className="text-xs">{t("settings.pm.statusHint", "Available at checkout.")}</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
