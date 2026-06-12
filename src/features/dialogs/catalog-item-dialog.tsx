import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormDialog } from "@/shared/ui/form-dialog";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { MoneyField } from "@/shared/ui/money-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  useCreateCatalogItem, useUpdateCatalogItem, getListCatalogQueryKey,
} from "@/shared/api/generated/api";
import { catalogSchema, type CatalogValues } from "@/entities/inventory/schemas";
import { INVENTORY_UNITS, QUERY_KEYS } from "@/shared/config/constants";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtUnit } from "@/shared/lib/format";
import type { OrgIngredient } from "@/shared/api/generated/models";

/**
 * Ingredient create/edit — shared across inventory, the recipe builder's
 * inline "new ingredient", stock entry, and onboarding. Mount fresh per open
 * (`{open && <CatalogItemDialog …/>}`) so defaultValues pick up `edit`.
 */
export function CatalogItemDialog({
  open,
  onClose,
  edit,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  edit: OrgIngredient | null;
  orgId: string;
  /** Fires with the new ingredient so pickers can auto-select it. */
  onCreated?: (ingredient: OrgIngredient) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const form = useForm<CatalogValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: edit?.name ?? "",
      unit: (edit?.unit as CatalogValues["unit"]) ?? "kg",
      category: edit?.category ?? "general",
      description: edit?.description ?? "",
      // stored value is piastres — show EGP in the input; unknown stays empty, not 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cost_per_unit: (edit?.cost_per_unit ? String(edit.cost_per_unit / 100) : "") as any,
      is_active: edit?.is_active ?? true,
    },
  });

  const { mutate: createCatalog, isPending: isCreating } = useCreateCatalogItem();
  const { mutate: updateCatalog, isPending: isUpdating } = useUpdateCatalogItem();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListCatalogQueryKey(orgId) });
    // also refresh the entity-layer catalog cache used by the recipes page picker
    qc.invalidateQueries({ queryKey: QUERY_KEYS.catalog(orgId) });
  };

  const save = (v: CatalogValues) => {
    if (edit) {
      updateCatalog(
        { orgId, id: edit.id, data: v },
        {
          onSuccess: () => {
            invalidate();
            toast.success(t("common.save"));
            onClose();
          },
          onError: (e) => toast.error(getErrorMessage(e)),
        },
      );
    } else {
      createCatalog(
        { orgId, data: { ...v, description: v.description || undefined } },
        {
          onSuccess: (created) => {
            invalidate();
            toast.success(t("common.save"));
            onCreated?.(created);
            onClose();
          },
          onError: (e) => toast.error(getErrorMessage(e)),
        },
      );
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={edit ? edit.name : t("inventory.catalog.newIngredient")}
      form={form}
      onSubmit={save}
      isPending={isCreating || isUpdating}
    >
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>{t("common.name")}</FormLabel><FormControl><Input placeholder={t("inventory.catalog.namePh")} {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="unit" render={({ field }) => (
          <FormItem><FormLabel>Unit</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>{INVENTORY_UNITS.map((u) => <SelectItem key={u} value={u}>{fmtUnit(u)}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>{t("common.category")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="general">{t("inventory.catalog.categoryGeneral")}</SelectItem>
                <SelectItem value="milk">{t("inventory.catalog.categoryMilk")}</SelectItem>
                <SelectItem value="coffee_bean">{t("inventory.catalog.categoryCoffee")}</SelectItem>
              </SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
      </div>
      <MoneyField control={form.control} name="cost_per_unit" label={t("inventory.catalog.costPerUnit")} />
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>{t("common.description")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
      )} />
      {edit && (
        <FormField control={form.control} name="is_active" render={({ field }) => (
          <FormItem className="flex items-center gap-3 !space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t("common.active")}</FormLabel></FormItem>
        )} />
      )}
    </FormDialog>
  );
}
