import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Banknote, Percent } from "lucide-react";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { createDiscount, updateDiscount } from "@/data/api/generated/api";
import type { Discount } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { invalidateDiscounts } from "./util";

const arOf = (tr: unknown): string => {
  const t = tr as Record<string, unknown> | null | undefined;
  return t && typeof t.ar === "string" ? t.ar : "";
};

interface Props {
  orgId: string;
  discount: Discount | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function DiscountDialog({ orgId, discount, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!discount;
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        dtype: z.enum(["percentage", "fixed"]),
        value: z.coerce.number<number>().min(0),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", dtype: "percentage", value: 0, is_active: true },
  });
  const dtype = form.watch("dtype");

  useEffect(() => {
    if (open) {
      form.reset({
        name: discount?.name ?? "",
        name_ar: arOf(discount?.name_translations),
        dtype: (discount?.dtype as "percentage" | "fixed") ?? "percentage",
        value: discount ? (discount.dtype === "fixed" ? piastresToEgp(discount.value) : discount.value) : 0,
        is_active: discount?.is_active ?? true,
      });
    }
  }, [open, discount, form]);

  const submit = async (v: Values) => {
    const value = v.dtype === "fixed" ? egpToPiastres(v.value) : Math.round(v.value);
    const name_translations = v.name_ar ? { ar: v.name_ar } : undefined;
    setBusy(true);
    try {
      if (discount) await updateDiscount(discount.id, { name: v.name, name_translations, dtype: v.dtype, value, is_active: v.is_active });
      else await createDiscount({ org_id: orgId, name: v.name, name_translations, dtype: v.dtype, value, is_active: v.is_active });
      void invalidateDiscounts();
      toast.success(editing ? t("discounts.updatedToast", "Discount updated") : t("discounts.createdToast", "Discount created"));
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
          <DialogTitle>{editing ? t("discounts.editTitle", "Edit discount") : t("discounts.newTitle", "New discount")}</DialogTitle>
          <DialogDescription>{t("discounts.subtitle", "Percentage and fixed-amount discounts")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("discounts.discountName", "Discount name")} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="dtype" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("discounts.dtype", "Type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="percentage"><span className="flex items-center gap-2"><Percent className="size-3.5" /> {t("discounts.percentage", "Percentage")}</span></SelectItem>
                      <SelectItem value="fixed"><span className="flex items-center gap-2"><Banknote className="size-3.5" /> {t("discounts.fixed", "Fixed amount")}</span></SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dtype === "percentage" ? t("discounts.percentageValue", "Percentage (%)") : t("discounts.amountValue", "Amount (EGP)")}</FormLabel>
                  <FormControl><Input type="number" step={dtype === "percentage" ? "1" : "0.5"} min="0" max={dtype === "percentage" ? "100" : undefined} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div><FormLabel>{t("common.active", "Active")}</FormLabel><p className="text-xs text-muted-foreground">{t("discounts.activeHint", "Inactive discounts can't be applied at checkout.")}</p></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{editing ? t("common.save", "Save") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
