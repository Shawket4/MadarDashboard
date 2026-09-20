/**
 * Add a customer, or edit one. The same form both ways; a phone another
 * customer already has comes back as a 409 and is shown on the phone field.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCustomer, useUpdateCustomer } from "@/data/api/generated/api";
import type { Customer, CustomerDetail } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

import {
  NAME_MAX,
  NOTES_MAX,
  createToWire,
  customerSchema,
  isPersonQuery,
  isPhoneTaken,
  updateToWire,
  valuesOf,
  type CustomerValues,
} from "./util";

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit this customer; absent = add one. */
  customer?: Customer | null;
  onSaved?: (detail: CustomerDetail) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const editing = !!customer;

  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: valuesOf(customer),
  });

  useEffect(() => {
    if (open) form.reset(valuesOf(customer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.id]);

  const errors = form.formState.errors;
  const err = (key?: string) =>
    key ? (
      <p role="alert" className="text-xs text-destructive">
        {t(key, { max: key.endsWith("notesLong") ? NOTES_MAX : NAME_MAX })}
      </p>
    ) : null;

  const submit = async (v: CustomerValues) => {
    try {
      const detail = customer
        ? await update.mutateAsync({ id: customer.id, data: updateToWire(v) })
        : await create.mutateAsync({ data: createToWire(v) });
      toast.success(editing ? t("customers.saved", "Customer saved") : t("customers.created", "Customer added"));
      await qc.invalidateQueries({ predicate: isPersonQuery });
      onSaved?.(detail);
      onOpenChange(false);
    } catch (e) {
      if (isPhoneTaken(e)) {
        form.setError("phone", { type: "server", message: "customers.errors.phoneTaken" }, { shouldFocus: true });
        return;
      }
      toast.error(getErrorMessage(e));
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t("customers.editTitle", "Edit customer") : t("customers.addTitle", "Add customer")}
          </DialogTitle>
          <DialogDescription>
            {t("customers.formHint", "A phone number lets the till find them again.")}
          </DialogDescription>
        </DialogHeader>

        <form id="customer-form" onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">{t("customers.name", "Name")}</Label>
            <Input
              id="customer-name"
              autoComplete="off"
              maxLength={NAME_MAX}
              aria-invalid={errors.name ? true : undefined}
              {...form.register("name")}
            />
            {err(errors.name?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">
              {t("customers.phone", "Phone")}{" "}
              <span className="text-muted-foreground">({t("common.optional", "Optional")})</span>
            </Label>
            <Input
              id="customer-phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
              className="font-mono"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            {err(errors.phone?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-notes">
              {t("customers.notes", "Notes")}{" "}
              <span className="text-muted-foreground">({t("common.optional", "Optional")})</span>
            </Label>
            <Textarea
              id="customer-notes"
              rows={3}
              aria-invalid={errors.notes ? true : undefined}
              {...form.register("notes")}
            />
            {err(errors.notes?.message)}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" form="customer-form" loading={pending}>
            {editing ? t("common.save", "Save") : t("customers.add", "Add customer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
