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
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { useCreateCategory, useUpdateCategory } from "@/data/api/generated/api";
import type { Category } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { arOf, invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires with the freshly created category (for auto-select from the item editor). */
  onCreated?: (category: Category) => void;
}

export function CategoryDialog({ orgId, category, open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation();
  const editing = !!category;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", name_ar: "", is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        name_ar: arOf(category?.name_translations),
        is_active: category?.is_active ?? true,
      });
    }
  }, [open, category, form]);

  const onDone = () => {
    toast.success(t("common.savedChanges", "Changes saved"));
    void invalidateCatalog();
    onOpenChange(false);
  };
  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const create = useCreateCategory({
    mutation: {
      onSuccess: (created) => {
        onCreated?.(created);
        onDone();
      },
      onError: onErr,
    },
  });
  const update = useUpdateCategory({ mutation: { onSuccess: onDone, onError: onErr } });
  const busy = create.isPending || update.isPending;

  const submit = (v: Values) => {
    const name_translations = v.name_ar ? { ar: v.name_ar } : undefined;
    if (category) {
      update.mutate({
        id: category.id,
        data: { name: v.name, name_translations, is_active: v.is_active },
      });
    } else {
      create.mutate({ data: { org_id: orgId, name: v.name, name_translations } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("menu.editCategory", "Edit category") : t("menu.newCategory", "New category")}</DialogTitle>
          <DialogDescription>{t("menu.categoryDesc", "Categories group your menu items.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
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
