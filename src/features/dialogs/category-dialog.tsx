import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormDialog } from "@/shared/ui/form-dialog";
import { BilingualField } from "@/shared/ui/bilingual-field";
import { Input } from "@/shared/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import {
  createCategory, updateCategory, getListCategoriesQueryKey,
} from "@/shared/api/generated/api";
import { categorySchema, type CategoryValues } from "@/entities/menu/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import type { Category } from "@/shared/types";

export function CategoryDialog({
  open,
  onClose,
  edit,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  edit: Category | null;
  orgId: string;
  /** Fires with the new category so pickers can auto-select it. */
  onCreated?: (category: Category) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: edit?.name ?? "",
      name_translations: edit?.name_translations ?? {},
      display_order: edit?.display_order ?? 0,
      is_active: edit?.is_active ?? true,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (v: CategoryValues) =>
      edit ? updateCategory(edit.id, v as never) : createCategory({ ...v, org_id: orgId } as never),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      toast.success(t("common.save"));
      if (!edit) onCreated?.(created as Category);
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={edit ? t("menu.categoryDialog.edit") : t("menu.categoryDialog.new")}
      form={form}
      onSubmit={(v) => mutate(v)}
      isPending={isPending}
    >
      <BilingualField control={form.control} name="name" label={t("common.name")} placeholder={t("menu.categoryDialog.namePh")} arPlaceholder="الاسم بالعربي" />
      <FormField
        control={form.control}
        name="display_order"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("menu.displayOrder")}</FormLabel>
            <FormControl><Input type="number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
