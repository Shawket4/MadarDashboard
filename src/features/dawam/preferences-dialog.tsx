/**
 * Someone's preferred time and the days they can't work (SC-12): the
 * manager sees them, may override them (logged, and the person is told), and
 * reads who changed them when.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { putEmployeePreferences, usePreferenceLog } from "@/data/api/generated/api";
import type { RosterPerson } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invalidateStaff, WEEKDAYS } from "@/features/staff/util";
import { WEEK_ORDER } from "@/features/staff/work-shift-dialog";
import { failedEmpty } from "./live";

const NONE = "none";

export function PreferencesDialog({
  person,
  open,
  onOpenChange,
  canEdit,
}: {
  person: RosterPerson;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Holds hr.staff.edit at the person's branch. */
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const logQ = usePreferenceLog(person.employee_id, { query: { enabled: open } });
  const schema = useMemo(
    () =>
      z.object({
        pref_time: z.enum([NONE, "morning", "evening"]),
        cant_work_days: z.array(z.number().int().min(0).max(6)),
        note: z.string().max(300, t("dawam.errNoteLong", "At most 300 characters")),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const initial = (): Values => ({
    pref_time: (person.pref_time === "morning" || person.pref_time === "evening" ? person.pref_time : NONE),
    cant_work_days: [...person.cant_work_days],
    note: "",
  });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial() });
  useEffect(() => {
    if (open) form.reset(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person]);

  const day = (d: number) => {
    const w = WEEKDAYS.find((x) => x.value === d)!;
    return t(w.labelKey, w.fallback);
  };
  const prefLabel = (p: string | null | undefined) =>
    p === "morning" ? t("dawam.prefers_morning", "Prefers mornings")
      : p === "evening" ? t("dawam.prefers_evening", "Prefers evenings")
        : t("dawam.noPreference", "No preference");

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      await putEmployeePreferences(person.employee_id, {
        pref_time: v.pref_time === NONE ? null : v.pref_time,
        cant_work_days: [...v.cant_work_days].sort((a, b) => a - b),
        note: v.note.trim() || null,
      });
      toast.success(t("dawam.prefsSaved", "Preferences saved; they were told"));
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dawam.prefsTitle", { name: person.name, defaultValue: `${person.name}'s preferences` })}</DialogTitle>
          <DialogDescription>
            {person.prefs_set_by === "manager"
              ? t("dawam.prefsByManager", "Last set by a manager.")
              : t("dawam.prefsByEmployee", "Set by the employee in the app.")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="prefs-form" onSubmit={form.handleSubmit(submit)} className="space-y-3">
            <FormField control={form.control} name="pref_time" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dawam.prefTime", "Preferred time")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                  <FormControl><SelectTrigger aria-label={t("dawam.prefTime", "Preferred time")}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("dawam.noPreference", "No preference")}</SelectItem>
                    <SelectItem value="morning">{t("dawam.prefers_morning", "Prefers mornings")}</SelectItem>
                    <SelectItem value="evening">{t("dawam.prefers_evening", "Prefers evenings")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="cant_work_days" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dawam.cantWorkDays", "Days they can't work")}</FormLabel>
                <div role="group" aria-label={t("dawam.cantWorkDays", "Days they can't work")} className="flex flex-wrap gap-1.5">
                  {WEEK_ORDER.map((d) => {
                    const on = field.value.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!canEdit}
                        aria-pressed={on}
                        onClick={() => field.onChange(on ? field.value.filter((x) => x !== d) : [...field.value, d])}
                        className={cn(
                          "h-8 rounded-full border px-3 text-xs font-medium disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          on ? "border-transparent bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {day(d)}
                      </button>
                    );
                  })}
                </div>
              </FormItem>
            )} />
            {canEdit ? (
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dawam.prefsNote", "Why (they will see it changed)")}</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}
          </form>
        </Form>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("dawam.prefsLog", "Changes")}</h3>
          {failedEmpty(logQ) ? (
            <p className="text-sm text-destructive">{getErrorMessage(logQ.error)}</p>
          ) : (logQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dawam.prefsLogEmpty", "No changes yet.")}</p>
          ) : (
            <ul className="space-y-1 text-sm" aria-label={t("dawam.prefsLog", "Changes")}>
              {(logQ.data ?? []).map((c, i) => (
                <li key={i} className="rounded-md border px-2.5 py-1.5">
                  <div className="font-medium">
                    {c.source === "manager"
                      ? t("dawam.prefsChangedBy", { name: c.changed_by_name ?? "", defaultValue: `By ${c.changed_by_name ?? ""}` })
                      : t("dawam.prefsChangedByEmployee", "By the employee")}
                    <span className="ms-2 text-xs font-normal text-muted-foreground">{fmtDate(c.created_at.slice(0, 10))}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[prefLabel(c.pref_time), c.cant_work_days.length ? c.cant_work_days.map(day).join(" ") : null, c.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.close", "Close")}</Button>
          {canEdit ? <Button type="submit" form="prefs-form" disabled={busy}>{t("common.save", "Save")}</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
