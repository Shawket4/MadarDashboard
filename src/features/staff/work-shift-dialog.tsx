/**
 * One shift block (a work shift): its branch (SC-1), its default times, the
 * weekdays it may be rostered on and its own times on some of them (the
 * owner's "Evening 16:00–00:00 Sat–Wed, 16:00–01:00 Thu–Fri" as ONE block),
 * and its own overtime rates on top of the branch's rules (RU-8).
 *
 * The server decides everything that follows from these: whether a time runs
 * into the next day, whether a version of the block is past the labour
 * presence cap (a warning, never a refusal — RU-13), and whether a weekday can
 * be taken away while people are still rostered on it (SHIFT_DAYS_IN_USE).
 */
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DurationField, NumberField, TimeRangeField, WeekdayPicker } from "@/components/inputs";
import { fmtWireTime } from "@/lib/format";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWorkShift, updateWorkShift } from "@/data/api/generated/api";
import type { UpsertWorkShiftRequest, WorkShift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { cn } from "@/lib/utils";
import { invalidateStaff, WEEKDAYS } from "./util";

/** The week as the business reads it: Saturday first (Egypt). Wire values stay
 *  Postgres DOW, 0 = Sunday … 6 = Saturday. */
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WHOLE_BUSINESS = "__all__";

/** Common shifts to start a new one from; each fills the name (if empty) and both times. */
export interface ShiftPreset { key: string; labelKey: string; fallback: string; start: string; end: string }
export const SHIFT_PRESETS: ShiftPreset[] = [
  { key: "morning", labelKey: "staff.presetMorning", fallback: "Morning", start: "08:00", end: "16:00" },
  { key: "day", labelKey: "staff.presetDay", fallback: "Day", start: "09:00", end: "17:00" },
  { key: "evening", labelKey: "staff.presetEvening", fallback: "Evening", start: "16:00", end: "00:00" },
  { key: "night", labelKey: "staff.presetNight", fallback: "Night", start: "22:00", end: "06:00" },
];

const hhmm = (v: string | null | undefined) => (v ?? "").slice(0, 5);
const wire = (v: string) => `${v}:00`;

/** A number field that may be left empty ("" = none). */
const optionalNumber = z.union([z.literal(""), z.coerce.number<string | number>()]);

export function shiftSchema(t: (k: string, d: string) => string) {
  const dayTime = z.object({ start: z.string(), end: z.string() });
  return z
    .object({
      branch_id: z.string(),
      name: z.string().trim().min(1, t("staff.errShiftName", "Give the shift a name")),
      start_time: z.string().regex(/^\d{2}:\d{2}$/, t("staff.errTime", "Pick a time")),
      end_time: z.string().regex(/^\d{2}:\d{2}$/, t("staff.errTime", "Pick a time")),
      grace_minutes: z.coerce.number<string | number>().int().min(0, t("staff.errNonNegative", "Can't be negative")),
      break_minutes: z.coerce.number<string | number>().int().min(0, t("staff.errNonNegative", "Can't be negative")),
      paid_break: z.boolean(),
      half_day_threshold_minutes: optionalNumber,
      overtime_threshold_minutes: z.coerce.number<string | number>().int().min(0, t("staff.errNonNegative", "Can't be negative")),
      overtime_multiplier: z.coerce.number<string | number>().gt(0, t("staff.errPositive", "Must be above 0")),
      ot_day_multiplier: optionalNumber,
      ot_night_multiplier: optionalNumber,
      checkin_window_minutes: z.coerce.number<string | number>().int().gt(0, t("staff.errPositive", "Must be above 0")),
      is_active: z.boolean(),
      valid_days: z.array(z.number().int().min(0).max(6)).min(1, t("staff.errNoDays", "Pick at least one day")),
      day_times: z.record(z.string(), dayTime),
    })
    .superRefine((v, ctx) => {
      if (v.start_time === v.end_time) {
        ctx.addIssue({ code: "custom", path: ["end_time"], message: t("staff.errSameTime", "A shift can't start and end at the same time") });
      }
      for (const key of ["ot_day_multiplier", "ot_night_multiplier", "half_day_threshold_minutes"] as const) {
        const n = v[key];
        if (n !== "" && !(Number(n) > 0)) {
          ctx.addIssue({ code: "custom", path: [key], message: t("staff.errPositive", "Must be above 0") });
        }
      }
      for (const [dow, dt] of Object.entries(v.day_times)) {
        if (!v.valid_days.includes(Number(dow))) continue;
        if (!dt.start && !dt.end) continue;
        if (!dt.start || !dt.end) {
          ctx.addIssue({ code: "custom", path: ["day_times", dow], message: t("staff.errBothTimes", "Set both times, or neither") });
        } else if (dt.start === dt.end) {
          ctx.addIssue({ code: "custom", path: ["day_times", dow], message: t("staff.errSameTime", "A shift can't start and end at the same time") });
        }
      }
    });
}

export type ShiftValues = z.infer<ReturnType<typeof shiftSchema>>;
type ShiftInput = z.input<ReturnType<typeof shiftSchema>>;

export function valuesOf(shift: WorkShift | null): ShiftInput {
  const dayTimes: Record<string, { start: string; end: string }> = {};
  for (const d of ALL_DAYS) dayTimes[String(d)] = { start: "", end: "" };
  for (const dt of shift?.day_times ?? []) {
    dayTimes[String(dt.day_of_week)] = { start: hhmm(dt.start_time), end: hhmm(dt.end_time) };
  }
  const opt = (n: number | string | null | undefined) => (n === null || n === undefined ? "" : String(n));
  return {
    branch_id: shift?.branch_id ?? WHOLE_BUSINESS,
    name: shift?.name ?? "",
    start_time: shift ? hhmm(shift.start_time) : "09:00",
    end_time: shift ? hhmm(shift.end_time) : "17:00",
    grace_minutes: shift?.grace_minutes ?? 15,
    break_minutes: shift?.break_minutes ?? 0,
    paid_break: shift?.paid_break ?? true,
    half_day_threshold_minutes: opt(shift?.half_day_threshold_minutes),
    overtime_threshold_minutes: shift?.overtime_threshold_minutes ?? 15,
    overtime_multiplier: shift ? Number(shift.overtime_multiplier) : 1.5,
    ot_day_multiplier: opt(shift?.ot_day_multiplier),
    ot_night_multiplier: opt(shift?.ot_night_multiplier),
    checkin_window_minutes: shift?.checkin_window_minutes ?? 120,
    is_active: shift?.is_active ?? true,
    valid_days: shift?.valid_days?.length ? [...shift.valid_days] : [...ALL_DAYS],
    day_times: dayTimes,
  };
}

/** The request body. Empty optional rates are sent as null: back to the
 *  branch's rules (the API keeps a field only when it is omitted). */
export function bodyOf(v: ShiftValues): UpsertWorkShiftRequest {
  const opt = (n: number | "") => (n === "" ? null : Number(n));
  const day_times = Object.entries(v.day_times)
    .filter(([dow, dt]) => v.valid_days.includes(Number(dow)) && dt.start && dt.end)
    .map(([dow, dt]) => ({ day_of_week: Number(dow), start_time: wire(dt.start), end_time: wire(dt.end) }))
    .sort((a, b) => a.day_of_week - b.day_of_week);
  return {
    branch_id: v.branch_id === WHOLE_BUSINESS ? null : v.branch_id,
    name: v.name.trim(),
    start_time: wire(v.start_time),
    end_time: wire(v.end_time),
    grace_minutes: v.grace_minutes,
    break_minutes: v.break_minutes,
    paid_break: v.paid_break,
    half_day_threshold_minutes: opt(v.half_day_threshold_minutes),
    overtime_threshold_minutes: v.overtime_threshold_minutes,
    overtime_multiplier: v.overtime_multiplier,
    ot_day_multiplier: opt(v.ot_day_multiplier),
    ot_night_multiplier: opt(v.ot_night_multiplier),
    checkin_window_minutes: v.checkin_window_minutes,
    is_active: v.is_active,
    valid_days: [...v.valid_days].sort((a, b) => a - b),
    day_times,
  };
}


export function WorkShiftDialog({
  shift,
  open,
  onOpenChange,
  branches,
  wholeBusiness = true,
}: {
  shift: WorkShift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: { id: string; name: string }[];
  /** May this person make a block business-wide (the right at every branch)? */
  wholeBusiness?: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const schema = useMemo(() => shiftSchema((k, d) => t(k, d)), [t]);
  const form = useForm<ShiftInput, unknown, ShiftValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(shift),
  });

  useEffect(() => {
    if (!open) return;
    const v = valuesOf(shift);
    // Without the right everywhere a new block starts at a branch, not the whole business.
    if (!wholeBusiness && v.branch_id === WHOLE_BUSINESS && branches[0]) v.branch_id = branches[0].id;
    form.reset(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift, wholeBusiness, branches.length]);

  const validDays = useWatch({ control: form.control, name: "valid_days" }) ?? [];
  const start = useWatch({ control: form.control, name: "start_time" }) ?? "";
  const end = useWatch({ control: form.control, name: "end_time" }) ?? "";
  const dayTimes = useWatch({ control: form.control, name: "day_times" }) ?? {};

  const submit = async (v: ShiftValues) => {
    setBusy(true);
    try {
      const body = bodyOf(v);
      const saved = shift ? await updateWorkShift(shift.id, body) : await createWorkShift(body);
      toast.success(t("staff.shiftSaved", "Work shift saved"));
      if (saved?.over_presence_cap) {
        toast.warning(t("staff.overPresenceCap", "Longer than the labour presence limit on some day. Only a warning: it is saved."));
      }
      // The Dawam roster lists the blocks too (H2-D13).
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const dayLabel = (dow: number) => {
    const w = WEEKDAYS.find((x) => x.value === dow)!;
    return t(w.labelKey, w.fallback);
  };

  const errors = form.formState.errors;
  const dayTimeErrors = errors.day_times as Record<string, { message?: string }> | undefined;
  const ownDays = WEEK_ORDER.filter((d) => validDays.includes(d) && (dayTimes[String(d)]?.start || dayTimes[String(d)]?.end));
  const [dayTimesOpen, setDayTimesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const v = valuesOf(shift);
    setDayTimesOpen(Object.values(v.day_times).some((d) => d.start || d.end));
    setMoreOpen(v.ot_day_multiplier !== "" || v.ot_night_multiplier !== "" || v.half_day_threshold_minutes !== "");
  }, [open, shift]);

  /** A number field of the form on the kit: empty is "" in the form, `null` in the field. */
  const kitNumber = (
    name: "grace_minutes" | "break_minutes" | "overtime_threshold_minutes" | "overtime_multiplier" | "checkin_window_minutes"
      | "half_day_threshold_minutes" | "ot_day_multiplier" | "ot_night_multiplier",
    label: string,
    render: (p: { value: number | null; onChange: (n: number | null) => void; onBlur: () => void; invalid: boolean; id?: string }) => React.ReactNode,
    hint?: string,
  ) => (
    <FormField control={form.control} name={name} render={({ field, fieldState }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          {render({
            value: field.value === "" || field.value === undefined || field.value === null ? null : Number(field.value),
            onChange: (n) => field.onChange(n === null ? "" : n),
            onBlur: field.onBlur,
            invalid: !!fieldState.error,
          })}
        </FormControl>
        {hint ? <FormDescription>{hint}</FormDescription> : null}
        <FormMessage />
      </FormItem>
    )} />
  );

  const applyPreset = (p: ShiftPreset) => {
    const name = form.getValues("name");
    if (!name.trim() || SHIFT_PRESETS.some((x) => t(x.labelKey, x.fallback) === name)) {
      form.setValue("name", t(p.labelKey, p.fallback), { shouldDirty: true });
    }
    form.setValue("start_time", p.start, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    form.setValue("end_time", p.end, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  };

  // A refused save opens whatever section holds the problem, so it's never hidden.
  const onInvalid = (errs: typeof errors) => {
    if (errs.day_times) setDayTimesOpen(true);
    if (errs.overtime_threshold_minutes || errs.overtime_multiplier || errs.ot_day_multiplier || errs.ot_night_multiplier
      || errs.half_day_threshold_minutes || errs.checkin_window_minutes) setMoreOpen(true);
    toast.error(t("staff.fixShiftErrors", "Some fields need a fix before this can be saved."));
  };

  const rangeError = errors.start_time?.message ?? errors.end_time?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{shift ? t("staff.editShift", "Edit work shift") : t("staff.newShift", "New shift")}</DialogTitle>
          <DialogDescription>
            {t("staff.shiftDialogHintV2", "A block of time people are rostered on. An end before the start runs past midnight, and check-out lands on the next day.")}
          </DialogDescription>
        </DialogHeader>

        {shift?.over_presence_cap ? (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t("staff.overPresenceCap", "Longer than the labour presence limit on some day. Only a warning: it is saved.")}
          </p>
        ) : null}

        <Form {...form}>
          <form id="shift-form" onSubmit={form.handleSubmit(submit, onInvalid)} className="grid gap-4 sm:grid-cols-2">
            {!shift ? (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-sm font-medium">{t("staff.startFrom", "Start from a common shift")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {SHIFT_PRESETS.map((p) => {
                    const on = start === p.start && end === p.end;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => applyPreset(p)}
                        className={cn(
                          "flex h-auto flex-col items-start rounded-md border px-3 py-1.5 text-start transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          on ? "border-primary bg-primary/5" : "hover:bg-accent",
                        )}
                      >
                        <span className="text-sm font-medium">{t(p.labelKey, p.fallback)}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{fmtWireTime(p.start)} – {fmtWireTime(p.end)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("staff.shiftName", "Name")}</FormLabel>
                <FormControl><Input {...field} placeholder={t("staff.shiftNamePlaceholder", "e.g. Morning, Evening")} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="branch_id" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("staff.shiftBranch", "Branch")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger aria-label={t("staff.shiftBranch", "Branch")}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {wholeBusiness || field.value === WHOLE_BUSINESS ? (
                      <SelectItem value={WHOLE_BUSINESS}>{t("staff.wholeBusiness", "Every branch")}</SelectItem>
                    ) : null}
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>{t("staff.shiftBranchHint", "A branch's own shift is offered only there; its managers can edit it.")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <TimeRangeField
              id="shift-times"
              className="sm:col-span-2"
              startLabel={t("staff.startTime", "Start")}
              endLabel={t("staff.endTime", "End")}
              value={{ start, end }}
              error={rangeError}
              onChange={(r) => {
                const opts = { shouldDirty: true, shouldValidate: form.formState.isSubmitted };
                if (r.start !== start) form.setValue("start_time", r.start, opts);
                if (r.end !== end) form.setValue("end_time", r.end, opts);
              }}
            />

            <FormField control={form.control} name="valid_days" render={({ field, fieldState }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("staff.validDays", "Days it runs")}</FormLabel>
                <WeekdayPicker
                  aria-label={t("staff.validDays", "Days it runs")}
                  value={field.value}
                  invalid={!!fieldState.error}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <Collapsible open={dayTimesOpen} onOpenChange={setDayTimesOpen} className="rounded-lg border sm:col-span-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-start hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span>
                  <span className="block text-sm font-medium">{t("staff.dayTimes", "Its own times on some days")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ownDays.length
                      ? t("staff.dayTimesSome", { days: ownDays.map(dayLabel).join(", "), defaultValue: `Different on ${ownDays.map(dayLabel).join(", ")}` })
                      : t("staff.dayTimesNone", "Same times every day. Open to change a day, e.g. later on Thursday.")}
                  </span>
                </span>
                <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", dayTimesOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 border-t p-3">
                <p className="text-xs text-muted-foreground">
                  {t("staff.dayTimesHintV2", "Leave a day empty to use the times above.")}
                </p>
                {WEEK_ORDER.filter((d) => validDays.includes(d)).map((dow) => {
                  const k = String(dow);
                  const dt = dayTimes[k] ?? { start: "", end: "" };
                  return (
                    <div key={dow} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
                      <span className="pt-2 text-sm font-medium">{dayLabel(dow)}</span>
                      <TimeRangeField
                        id={`day-${k}`}
                        optional
                        hideLabels
                        startLabel={t("staff.dayStart", { day: dayLabel(dow), defaultValue: `${dayLabel(dow)} start` })}
                        endLabel={t("staff.dayEnd", { day: dayLabel(dow), defaultValue: `${dayLabel(dow)} end` })}
                        value={dt}
                        error={dayTimeErrors?.[k]?.message}
                        onChange={(r) => form.setValue(`day_times.${k}`, r, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {kitNumber("grace_minutes", t("staff.graceMinutesV2", "Grace before late"), (p) => (
              <DurationField {...p} unit="min" max={240} presets={[0, 5, 10, 15, 30]} />
            ), t("staff.graceHint", "Arriving within this is on time."))}
            {kitNumber("break_minutes", t("staff.breakMinutesV2", "Break"), (p) => (
              <DurationField {...p} unit="min" max={480} presets={[0, 15, 30, 60]} />
            ))}

            <FormField control={form.control} name="paid_break" render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
                <div>
                  <FormLabel>{t("staff.paidBreak", "Paid break")}</FormLabel>
                  <FormDescription>{t("staff.paidBreakHint", "When off, the break is subtracted from hours worked.")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="rounded-lg border sm:col-span-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-start hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span>
                  <span className="block text-sm font-medium">{t("staff.moreShiftSettings", "Overtime and check-in")}</span>
                  <span className="block text-xs text-muted-foreground">{t("staff.moreShiftSettingsHint", "Most shifts keep these as they are.")}</span>
                </span>
                <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", moreOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-4 border-t p-3 sm:grid-cols-2">
                {kitNumber("overtime_threshold_minutes", t("staff.otThreshold", "Overtime after (minutes)"), (p) => (
                  <DurationField {...p} unit="min" max={600} presets={[0, 15, 30]} />
                ), t("staff.otThresholdHint", "Staying less than this past the end isn't overtime."))}
                {kitNumber("overtime_multiplier", t("staff.otMultiplier", "Overtime multiplier"), (p) => (
                  <NumberField {...p} prefix="×" step={0.05} decimals={2} min={0.05} max={10} />
                ))}
                {kitNumber("ot_day_multiplier", t("staff.otDayMultiplier", "Day overtime rate"), (p) => (
                  <NumberField {...p} prefix="×" step={0.05} decimals={2} min={0.05} max={10} allowEmpty emptyLabel={t("staff.branchRate", "Branch rules")} />
                ), t("staff.otRateHint", "Empty = the branch's rules."))}
                {kitNumber("ot_night_multiplier", t("staff.otNightMultiplier", "Night overtime rate"), (p) => (
                  <NumberField {...p} prefix="×" step={0.05} decimals={2} min={0.05} max={10} allowEmpty emptyLabel={t("staff.branchRate", "Branch rules")} />
                ), t("staff.otRateHint", "Empty = the branch's rules."))}
                {kitNumber("half_day_threshold_minutes", t("staff.halfDayThreshold", "Half day below (minutes)"), (p) => (
                  <DurationField {...p} unit="min" min={1} max={1440} step={30} allowEmpty emptyLabel={t("staff.halfDayDefault", "Half the shift")} />
                ))}
                {kitNumber("checkin_window_minutes", t("staff.checkinWindow", "Check-in opens (minutes early)"), (p) => (
                  <DurationField {...p} unit="min" min={1} max={720} step={15} presets={[30, 60, 120]} />
                ))}
              </CollapsibleContent>
            </Collapsible>

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
                <div>
                  <FormLabel>{t("staff.active", "Active")}</FormLabel>
                  <FormDescription>{t("staff.activeShiftHint", "An inactive shift stays on past rosters but can't be rostered again.")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="submit" form="shift-form" loading={busy}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
