/**
 * The Attendance page's two forms: add a record by hand, correct one.
 * React Hook Form + Zod (the dashboard's form convention), and every time is
 * typed and shown on the BRANCH's clock (AT-1): a `datetime-local` input has
 * no zone, so it used to be read in the browser's.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  correctRecord, createManualRecord, useListAttendance, useListBranches, useListEmployees, useListWorkShifts,
} from "@/data/api/generated/api";
import type { AttendanceRecord } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { getActiveTz } from "@/lib/format";
import { fromZonedInput, toZonedInput } from "@/lib/zoned-input";

import { coveredBy, invalidateAttendance, todayIso } from "./util";
import { DateField } from "@/components/inputs";
import { DateTimeField } from "./date-time-field";

const NONE = "__none__";
/** "From the times": the server derives the status (no override). */
const DERIVED = "__derived__";
const STATUSES = ["present", "late", "half_day", "absent", "on_leave"] as const;

/** The branch's zone, falling back to the page's. */
function useBranchZone(branchId: string | null | undefined): string {
  const orgId = useOrgId();
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId && !!branchId } });
  return useMemo(
    () => branches.data?.find((b) => b.id === branchId)?.timezone || getActiveTz(),
    [branches.data, branchId],
  );
}

function StatusOptions({ derived }: { derived?: boolean }) {
  const { t } = useTranslation();
  const label: Record<(typeof STATUSES)[number], string> = {
    present: t("staff.att_present", "Present"),
    late: t("staff.att_late", "Late"),
    half_day: t("staff.att_half_day", "Half day"),
    absent: t("staff.att_absent", "Absent"),
    on_leave: t("staff.att_on_leave", "On leave"),
  };
  return (
    <SelectContent>
      {derived ? <SelectItem value={DERIVED}>{t("staff.statusFromTimes", "From the times")}</SelectItem> : null}
      {STATUSES.map((s) => (
        <SelectItem key={s} value={s}>{label[s]}</SelectItem>
      ))}
    </SelectContent>
  );
}

/** The out stamp, when both are typed, comes after the in stamp. */
const outAfterIn = (v: { check_in: string; check_out: string }) =>
  !v.check_in || !v.check_out || v.check_out > v.check_in;

// ── Add a record by hand ─────────────────────────────────────────────────────

function manualSchema(t: (k: string, d: string) => string) {
  return z
    .object({
      employee_id: z.string().min(1, t("staff.pickEmployee", "Pick an employee")),
      business_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("staff.pickDate", "Pick a date")),
      status: z.string(),
      work_shift_id: z.string(),
      /** Only asked when no single branch is in scope and the person works at several. */
      branch_id: z.string(),
      check_in: z.string(),
      check_out: z.string(),
      reason: z.string().trim().min(1, t("staff.reasonRequired", "Say why")),
    })
    .refine(outAfterIn, { path: ["check_out"], message: t("staff.outBeforeIn", "Out must be after in") });
}
type ManualValues = z.infer<ReturnType<typeof manualSchema>>;

/** Hand-entered attendance — the escape hatch for a day the app never saw. */
export function ManualRecordDialog({
  open,
  onOpenChange,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled: open } });
  const shiftsQ = useListWorkShifts({ query: { enabled: open } });
  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: open && !!orgId && !branchId } });

  const empty: ManualValues = {
    employee_id: "",
    business_date: todayIso(),
    status: DERIVED,
    work_shift_id: NONE,
    branch_id: "",
    check_in: "",
    check_out: "",
    reason: "",
  };
  const form = useForm<ManualValues>({ resolver: zodResolver(manualSchema(t)), defaultValues: empty });
  useEffect(() => {
    if (open) form.reset(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [open]);

  // With every branch in scope, the record's branch is the person's: their
  // only one, or the one picked among theirs (box verify: a one-branch
  // manager was told to pick a single branch first).
  const person = (employeesQ.data ?? []).find((e) => e.id === form.watch("employee_id"));
  const theirBranches = person?.branch_ids ?? [];
  const pickedBranch = form.watch("branch_id");
  const recordBranch = branchId ?? (theirBranches.length === 1 ? theirBranches[0] : theirBranches.includes(pickedBranch) ? pickedBranch : null);
  const askBranch = !branchId && theirBranches.length > 1;
  const tz = useBranchZone(recordBranch);

  // The picked day's records: a colleague covering the picked shift refuses a
  // clock-in for its owner (D1, 409 SHIFT_COVERED).
  const [pickedEmployee, pickedDate, pickedShift, typedIn] = form.watch(["employee_id", "business_date", "work_shift_id", "check_in"]);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(pickedDate ?? "");
  // The picked day and the weeks after it: a record there in an approved or
  // paid month means the day's month is closed too (months close in order),
  // and nothing is written into it (BC-3 decision a).
  const aheadQ = useListAttendance(
    { from: pickedDate, to: validDate ? addDaysIso(pickedDate, 40) : pickedDate },
    { query: { enabled: open && validDate } },
  );
  const monthClosed = (aheadQ.data ?? []).some((r) => r.month_closed && r.business_date >= pickedDate);
  const coverer = pickedEmployee && validDate && pickedShift !== NONE
    ? coveredBy(aheadQ.data ?? [], pickedEmployee, pickedDate, pickedShift)
    : null;
  const coverBlocks = !!coverer && !!typedIn;

  const save = form.handleSubmit(async (v) => {
    if (!recordBranch) {
      form.setError("branch_id", { message: t("dawam.pickBranch", "Pick a branch") });
      return;
    }
    setBusy(true);
    try {
      await createManualRecord({
        employee_id: v.employee_id,
        branch_id: recordBranch,
        business_date: v.business_date,
        work_shift_id: v.work_shift_id === NONE ? null : v.work_shift_id,
        check_in_at: fromZonedInput(v.check_in, tz),
        check_out_at: fromZonedInput(v.check_out, tz),
        status: v.status === DERIVED ? null : v.status,
        reason: v.reason.trim(),
      });
      toast.success(t("staff.recordAdded", "Record added"));
      void invalidateAttendance();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("staff.addRecord", "Add record")}</DialogTitle>
          <DialogDescription>
            {t(
              "staff.addRecordHint",
              "Marked as manual and stamped with your name. Use this to record an absence, approved leave, or a day the app missed.",
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => void save(e)} className="grid gap-3" noValidate>
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.employee", "Employee")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(employeesQ.data ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {askBranch ? (
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dawam.branch", "Branch")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("dawam.pickBranch", "Pick a branch")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {theirBranches.map((id) => (
                          <SelectItem key={id} value={id}>{(branchesQ.data ?? []).find((b) => b.id === id)?.name ?? id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="business_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.date", "Date")}</FormLabel>
                    <FormControl><DateField value={field.value ?? ""} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.attendanceStatus", "Status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <StatusOptions derived />
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="work_shift_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.workShift", "Work shift")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("staff.unscheduled", "Unscheduled")}</SelectItem>
                      {/* The record's branch's blocks and business-wide ones only. */}
                      {(shiftsQ.data ?? []).filter((s) => !s.branch_id || s.branch_id === recordBranch).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <TimesFields tz={tz} />
            {coverer ? <CoveredNote name={coverer} /> : null}
            {monthClosed ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                {t("staff.dayMonthClosed", "That day is in an approved payroll month: nothing can be added to it. Pick a day in an open month, or add a pay line in the next one.")}
              </p>
            ) : null}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.reason", "Reason")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("staff.reasonPlaceholder", "Why this record exists")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy || coverBlocks || monthClosed}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** `yyyy-mm-dd` plus `n` days. */
const addDaysIso = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** A colleague covers this shift, so its owner can't be clocked in on it (D1). */
function CoveredNote({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
      {t("dawam.coveredByHint", {
        name,
        defaultValue: "Covered by {{name}}: nobody can clock its owner in. End or reject the cover first.",
      })}
    </p>
  );
}

/** In and out, on the branch's clock, with the zone named under them. */
function TimesFields({ tz }: { tz: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          name="check_in"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("staff.checkIn", "In")}</FormLabel>
              <FormControl><DateTimeField value={field.value} onChange={field.onChange} onBlur={field.onBlur} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="check_out"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("staff.checkOut", "Out")}</FormLabel>
              <FormControl><DateTimeField value={field.value} onChange={field.onChange} onBlur={field.onBlur} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("staff.timesInZone", { tz, defaultValue: "Times are the branch's clock ({{tz}})." })}
      </p>
    </div>
  );
}

// ── Correct a record ─────────────────────────────────────────────────────────

function correctSchema(t: (k: string, d: string) => string) {
  return z
    .object({
      check_in: z.string(),
      check_out: z.string(),
      status: z.string(),
      reason: z.string().trim().min(1, t("staff.reasonRequired", "Say why")),
    })
    .refine(outAfterIn, { path: ["check_out"], message: t("staff.outBeforeIn", "Out must be after in") });
}
type CorrectValues = z.infer<ReturnType<typeof correctSchema>>;

/** Correct an existing record. The server recomputes late/overtime/status from
 *  the new stamps, so a corrected row is indistinguishable from a clocked one.
 *  Only what changed is sent: an untouched stamp or status is kept as it is. */
export function CorrectRecordDialog({
  record,
  coveredBy: coverer = null,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  /** A colleague covering this shift (D1): its owner can't be clocked in on it. */
  coveredBy?: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const tz = useBranchZone(record?.branch_id);
  const [busy, setBusy] = useState(false);
  const initial = useMemo<CorrectValues>(
    () => ({
      check_in: toZonedInput(record?.check_in_at, tz),
      check_out: toZonedInput(record?.check_out_at, tz),
      status: record?.status ?? "present",
      reason: "",
    }),
    [record, tz],
  );
  const form = useForm<CorrectValues>({ resolver: zodResolver(correctSchema(t)), defaultValues: initial });
  useEffect(() => form.reset(initial), [form, initial]);
  const typedIn = form.watch("check_in");
  const coverBlocks = !!coverer && !!typedIn && typedIn !== initial.check_in;

  const save = form.handleSubmit(async (v) => {
    if (!record) return;
    setBusy(true);
    try {
      await correctRecord(record.id, {
        check_in_at: v.check_in !== initial.check_in ? fromZonedInput(v.check_in, tz) : null,
        check_out_at: v.check_out !== initial.check_out ? fromZonedInput(v.check_out, tz) : null,
        status: v.status !== initial.status ? v.status : null,
        reason: v.reason.trim(),
      });
      toast.success(t("staff.recordCorrected", "Record corrected"));
      void invalidateAttendance();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("staff.correctRecord", "Correct record")}</DialogTitle>
          <DialogDescription>
            {record?.employee_name} · {record?.business_date}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void save(e)} className="grid gap-3" noValidate>
            <TimesFields tz={tz} />
            {coverer ? <CoveredNote name={coverer} /> : null}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.attendanceStatus", "Status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <StatusOptions />
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.reason", "Reason")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("staff.correctionReason", "Why this is being changed")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy || coverBlocks}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
