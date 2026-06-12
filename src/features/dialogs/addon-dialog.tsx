import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormDialog } from "@/shared/ui/form-dialog";
import { BilingualField } from "@/shared/ui/bilingual-field";
import { Input } from "@/shared/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { MoneyField } from "@/shared/ui/money-field";
import {
  createAddonItem, updateAddonItem, getListAddonItemsQueryKey,
} from "@/shared/api/generated/api";
import { addonSchema, type AddonValues } from "@/entities/menu/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import type { AddonItem } from "@/shared/types";

export function AddonDialog({
  open,
  onClose,
  edit,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  edit: AddonItem | null;
  orgId: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const form = useForm<AddonValues>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: edit?.name ?? "",
      name_translations: edit?.name_translations ?? {},
      addon_type: edit?.addon_type ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default_price: (edit ? String(edit.default_price / 100) : "") as any,
      display_order: edit?.display_order ?? 0,
      is_active: edit?.is_active ?? true,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (v: AddonValues) =>
      edit ? updateAddonItem(edit.id, v as never) : createAddonItem({ ...v, org_id: orgId } as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAddonItemsQueryKey() });
      toast.success(t("common.save"));
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={edit ? t("menu.addonDialog.edit") : t("menu.addonDialog.new")}
      form={form}
      onSubmit={(v) => mutate(v)}
      isPending={isPending}
    >
      <BilingualField control={form.control} name="name" label={t("common.name")} placeholder={t("menu.addonDialog.namePh")} arPlaceholder="الاسم بالعربي" />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="addon_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("menu.addonDialog.typeLabel")}</FormLabel>
              <FormControl><Input placeholder={t("menu.addonDialog.typeLabel")} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <MoneyField control={form.control} name="default_price" label={t("common.price")} />
      </div>
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
