import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetReservationSettings, putReservationSettings } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateFloor } from "./util";

export function SettingsForm({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const query = useGetReservationSettings({ branch_id: branchId }, { query: { enabled: !!branchId } });

  const schema = useMemo(
    () =>
      z.object({
        accepting_reservations: z.boolean(),
        accepting_waitlist: z.boolean(),
        lead_minutes: z.coerce.number().int().min(0).max(1440),
        hold_lead_minutes: z.coerce.number().int().min(0).max(1440),
        grace_minutes: z.coerce.number().int().min(0).max(1440),
        slot_minutes: z.coerce.number().int().min(1).max(240),
      }),
    [],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      accepting_reservations: false, accepting_waitlist: false,
      lead_minutes: 30, hold_lead_minutes: 120, grace_minutes: 15, slot_minutes: 15,
    },
  });

  useEffect(() => {
    const s = query.data;
    if (s) {
      form.reset({
        accepting_reservations: s.accepting_reservations,
        accepting_waitlist: s.accepting_waitlist,
        lead_minutes: s.lead_minutes,
        hold_lead_minutes: s.hold_lead_minutes,
        grace_minutes: s.grace_minutes,
        slot_minutes: s.slot_minutes,
      });
    }
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      await putReservationSettings(v, { branch_id: branchId });
      toast.success(t("reservations.settingsSaved", "Settings saved"));
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (query.isLoading) return <Skeleton className="h-80 w-full max-w-2xl" />;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t("reservations.settingsTitle", "Reservation settings")}</CardTitle>
        <CardDescription>{t("reservations.settingsSubtitle", "Control intake and the smart-nudge timing for this branch.")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="accepting_reservations" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>{t("reservations.acceptingReservations", "Accept reservations")}</FormLabel>
                  <FormDescription>{t("reservations.acceptingReservationsHint", "Allow guests to book a future time online.")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="accepting_waitlist" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>{t("reservations.acceptingWaitlist", "Accept waitlist")}</FormLabel>
                  <FormDescription>{t("reservations.acceptingWaitlistHint", "Allow guests to join the live waitlist (seat now).")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="lead_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.leadMinutes", "Departure nudge lead (min)")}</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormDescription>{t("reservations.leadMinutesHint", "WhatsApp this many minutes before the reservation time.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="grace_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.graceMinutes", "No-show grace (min)")}</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormDescription>{t("reservations.graceMinutesHint", "Warn the guest this long after their time if they haven't arrived.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hold_lead_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.holdLeadMinutes", "Table hold lead (min)")}</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormDescription>{t("reservations.holdLeadMinutesHint", "Hold a pre-assigned table this long before the booking.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slot_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.slotMinutes", "Slot size (min)")}</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <Button type="submit" disabled={busy}>{busy ? t("common.saving", "Saving…") : t("common.save", "Save")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
