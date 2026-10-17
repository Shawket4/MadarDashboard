import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AllowList } from "@/features/devices/api";
import { Presence, usePop, useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

const allowListSchema = z
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
  mono,
}: {
  title: string;
  value: AllowList;
  methods: MethodOption[];
  pending?: boolean;
  /** May return a promise: the Save button pops when it resolves and shakes when it rejects. */
  onSave: (v: AllowList) => void | Promise<unknown>;
  idPrefix: string;
  /** Title is a device code. */
  mono?: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm<AllowList>({ resolver: zodResolver(allowListSchema), defaultValues: value });
  useEffect(() => form.reset(value), [value, form]);
  const restricted = form.watch("restricted");
  const selectedCount = form.watch("payment_method_ids").length;
  const saveRef = useRef<HTMLButtonElement>(null);
  const [saves, setSaves] = useState(0);
  const [refused, setRefused] = useState(0);
  usePop(saveRef, saves);
  useShake(saveRef, refused);

  return (
    <form
      className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5"
      data-testid={`allow-list-${idPrefix}`}
      onSubmit={form.handleSubmit((v) =>
        Promise.resolve(onSave(v.restricted ? v : { restricted: false, payment_method_ids: [] })).then(
          () => setSaves((n) => n + 1),
          () => setRefused((n) => n + 1),
        ),
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", mono && "font-mono")}>{title}</p>
          <p className="text-xs text-muted-foreground">
            {restricted
              ? t("paymentMethods.availability.selectedCount", { count: selectedCount, defaultValue: "{{count}} selected" })
              : t("paymentMethods.availability.inherits", "No restriction")}
          </p>
        </div>
        <Controller
          control={form.control}
          name="restricted"
          render={({ field }) => (
            <Label className="flex shrink-0 items-center gap-2 text-sm font-normal text-muted-foreground">
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
      <Presence show={restricted} initial={false}>
        <div>
          <Controller
            control={form.control}
            name="payment_method_ids"
            render={({ field }) => (
              <div className="grid gap-2 border-t pt-3 sm:grid-cols-2">
                {methods.map((m) => (
                  <Label key={m.id} className="flex min-h-9 items-center gap-2 rounded-[10px] border px-3 text-sm font-normal has-[[data-state=checked]]:bg-accent">
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
        </div>
      </Presence>
      {form.formState.errors.payment_method_ids ? (
        <p role="alert" className="text-xs text-destructive">
          {t("paymentMethods.availability.emptyList", "Pick at least one method, or allow all.")}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button ref={saveRef} type="submit" size="sm" loading={pending} disabled={!form.formState.isDirty}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </form>
  );
}
