import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AllowList } from "@/features/devices/api";

export const allowListSchema = z
  .object({ restricted: z.boolean(), payment_method_ids: z.array(z.string()) })
  .refine((v) => !v.restricted || v.payment_method_ids.length > 0, { path: ["payment_method_ids"], message: "empty" });

export interface MethodOption {
  id: string;
  name: string;
}

/**
 * One owner's allow-list: off = no restriction (inherits the wider scope);
 * on = only the ticked methods. Mirrors the server's EMPTY_ALLOW_LIST rule.
 */
export function AllowListEditor({
  title,
  value,
  methods,
  pending,
  onSave,
  idPrefix,
}: {
  title: string;
  value: AllowList;
  methods: MethodOption[];
  pending?: boolean;
  onSave: (v: AllowList) => void;
  idPrefix: string;
}) {
  const { t } = useTranslation();
  const form = useForm<AllowList>({ resolver: zodResolver(allowListSchema), defaultValues: value });
  useEffect(() => form.reset(value), [value, form]);
  const restricted = form.watch("restricted");

  return (
    <form
      className="space-y-3 rounded-lg border p-4"
      data-testid={`allow-list-${idPrefix}`}
      onSubmit={form.handleSubmit((v) => onSave(v.restricted ? v : { restricted: false, payment_method_ids: [] }))}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{title}</p>
        <Controller
          control={form.control}
          name="restricted"
          render={({ field }) => (
            <Label className="flex items-center gap-2 text-sm font-normal">
              {field.value
                ? t("paymentMethods.availability.onlySelected", "Only selected")
                : t("paymentMethods.availability.allMethods", "All methods")}
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={t("paymentMethods.availability.restrict", "Restrict methods")}
              />
            </Label>
          )}
        />
      </div>
      {restricted ? (
        <Controller
          control={form.control}
          name="payment_method_ids"
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {methods.map((m) => (
                <Label key={m.id} className="flex items-center gap-2 text-sm font-normal">
                  <Checkbox
                    checked={field.value.includes(m.id)}
                    onCheckedChange={(c) =>
                      field.onChange(c === true ? [...field.value, m.id] : field.value.filter((x) => x !== m.id))
                    }
                  />
                  {m.name}
                </Label>
              ))}
            </div>
          )}
        />
      ) : null}
      {form.formState.errors.payment_method_ids ? (
        <p role="alert" className="text-xs text-destructive">
          {t("paymentMethods.availability.emptyList", "Pick at least one method, or allow all.")}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending} disabled={!form.formState.isDirty}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </form>
  );
}
