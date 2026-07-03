import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createTill, updateTill } from "@/data/api/generated/api";
import type { Till } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateTills } from "./util";

interface Props {
  branchId: string;
  till: Till | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function TillDialog({ branchId, till, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const editing = !!till;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        is_default: z.boolean(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", is_default: false, is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: till?.name ?? "",
        is_default: till?.is_default ?? false,
        is_active: till?.is_active ?? true,
      });
    }
  }, [open, till]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (till) {
        await updateTill(till.id, { name: v.name.trim(), is_default: v.is_default, is_active: v.is_active });
        toast.success(t("tills.updated", "Till updated"));
      } else {
        await createTill({ branch_id: branchId, name: v.name.trim(), is_default: v.is_default, is_active: v.is_active });
        toast.success(t("tills.created", "Till created"));
      }
      void invalidateTills();
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
          <DialogTitle>{editing ? t("tills.editTill", "Edit till") : t("tills.newTill", "New till")}</DialogTitle>
          <DialogDescription>{t("tills.subtitle", "Physical cash drawers / registers for this branch.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tills.name", "Name")}</FormLabel>
                <FormControl><Input placeholder="Till 1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_default" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>{t("tills.isDefault", "Default till")}</FormLabel>
                  <FormDescription>{t("tills.isDefaultHint", "Used when a shift opens without specifying a till.")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel>{t("common.active", "Active")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy}>{busy ? t("common.saving", "Saving…") : t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
