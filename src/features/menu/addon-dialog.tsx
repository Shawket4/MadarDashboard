import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { useCreateAddonItem, useUpdateAddonItem } from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { arOf, invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  addon: AddonItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddonDialog({ orgId, addon, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!addon;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        addon_type: z.string().min(1, t("common.requiredField", "This field is required")),
        default_price: z.coerce.number().min(0),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", addon_type: "extra", default_price: 0, is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: addon?.name ?? "",
        name_ar: arOf(addon?.name_translations),
        addon_type: addon?.addon_type ?? "extra",
        default_price: addon ? piastresToEgp(addon.default_price) : 0,
        is_active: addon?.is_active ?? true,
      });
    }
  }, [open, addon, form]);

  const onDone = () => {
    toast.success(t("common.savedChanges", "Changes saved"));
    void invalidateCatalog();
    onOpenChange(false);
  };
  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const create = useCreateAddonItem({ mutation: { onSuccess: onDone, onError: onErr } });
  const update = useUpdateAddonItem({ mutation: { onSuccess: onDone, onError: onErr } });
  const busy = create.isPending || update.isPending;

  const submit = (v: Values) => {
    const name_translations = v.name_ar ? { ar: v.name_ar } : undefined;
    const base = {
      name: v.name,
      name_translations,
      addon_type: v.addon_type,
      default_price: egpToPiastres(v.default_price),
    };
    if (addon) update.mutate({ id: addon.id, data: { ...base, is_active: v.is_active } });
    else create.mutate({ data: { org_id: orgId, ...base } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("menu.editAddon", "Edit add-on") : t("menu.newAddon", "New add-on")}</DialogTitle>
          <DialogDescription>{t("menu.addonDesc", "Add-ons are modifiers like extra shots or milk types.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="addon_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menu.addonType", "Type")}</FormLabel>
                    <FormControl>
                      <Input placeholder="extra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("menu.defaultPrice", "Default price (EGP)")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.active", "Active")}</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={busy}>
                {t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
