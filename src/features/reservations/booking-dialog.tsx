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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBooking } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateBookings } from "./util";

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Add a booking from the host stand. A time ⇒ reservation; no time ⇒ waitlist. */
export function BookingDialog({ branchId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        customer_name: z.string().min(1, t("common.requiredField", "This field is required")),
        customer_phone: z.string().min(1, t("common.requiredField", "This field is required")),
        party_size: z.coerce.number().int().min(1).max(99),
        reserved_for: z.string().optional(),
        notes: z.string().optional(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { customer_name: "", customer_phone: "", party_size: 2, reserved_for: "", notes: "" },
  });

  useEffect(() => {
    if (open) form.reset({ customer_name: "", customer_phone: "", party_size: 2, reserved_for: "", notes: "" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      await createBooking({
        branch_id: branchId,
        customer_name: v.customer_name.trim(),
        customer_phone: v.customer_phone.trim(),
        party_size: v.party_size,
        // datetime-local has no zone; treat as local and send an ISO instant.
        reserved_for: v.reserved_for ? new Date(v.reserved_for).toISOString() : undefined,
        notes: v.notes?.trim() || undefined,
      });
      toast.success(t("reservations.bookingCreated", "Booking created"));
      void invalidateBookings();
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
          <DialogTitle>{t("reservations.newBooking", "New booking")}</DialogTitle>
          <DialogDescription>{t("reservations.bookingHint", "Add a reservation (with a time) or a walk-in to the waitlist (no time).")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="customer_name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.customerName", "Customer name")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="customer_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.phone", "Phone")}</FormLabel>
                  <FormControl><Input inputMode="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="party_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.partySize", "Party size")}</FormLabel>
                  <FormControl><Input type="number" min={1} max={99} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="reserved_for" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.reservedFor", "Reservation time")}</FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormDescription>{t("reservations.reservedForHint", "Leave empty to add to the waitlist (seat now).")}</FormDescription>
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.notes", "Notes")}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
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
