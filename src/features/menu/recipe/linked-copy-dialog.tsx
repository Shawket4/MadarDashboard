import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/app/combobox";
import { createLinkedCopy, useListCategories } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { currencyLabel, egpToPiastres } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  item: { id: string; name: string; category_id?: string | null } | null;
  onCreated: (newItemId: string) => void;
}

/** "Create staff copy…" — a priced-at-zero twin whose recipe follows this item. */
export function LinkedCopyDialog({ open, onOpenChange, orgId, item, onCreated }: Props) {
  const { t, i18n } = useTranslation();
  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: !!orgId && open } });
  const categoryOptions = useMemo(
    () =>
      (categories.data ?? []).map((c) => ({
        value: c.id,
        label: getTranslatedName({ name: c.name, name_translations: c.name_translations }, i18n.language),
      })),
    [categories.data, i18n.language],
  );

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("common.requiredField", "This field is required")),
        price: z
          .string()
          .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("modeling.linked.priceInvalid", "Enter a valid price")),
        category_id: z.string(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", price: "0", category_id: "" } });

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: t("modeling.linked.defaultName", "{{name}} staff", { name: item.name }),
        price: "0",
        category_id: item.category_id ?? "",
      });
    }
  }, [open, item, form, t]);

  const submit = async (v: Values) => {
    if (!item) return;
    try {
      const res = await createLinkedCopy(item.id, {
        name: v.name.trim(),
        price: egpToPiastres(Number(v.price)),
        category_id: v.category_id || null,
      });
      toast.success(t("modeling.linked.created", "Staff copy created"));
      onOpenChange(false);
      onCreated(res.menu_item_id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("modeling.linked.title", "Create staff copy")}</DialogTitle>
          <DialogDescription>
            {t(
              "modeling.linked.desc",
              "Creates a copy with the same sizes whose recipe follows {{name}}. Recipe edits on the original flow to the copy. The copy has no choice groups.",
              { name: item?.name ?? "" },
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.name", "Name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("common.price", "Price")} ({currencyLabel()})
                  </FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("menu.selectCategory", "Category")}</FormLabel>
                  <Combobox options={categoryOptions} value={field.value || null} onChange={field.onChange} />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t("modeling.linked.create", "Create copy")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
