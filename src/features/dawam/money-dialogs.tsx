/**
 * The small money forms payroll, approvals and the team board share: a bonus
 * or deduction, a salary advance recorded by a manager, an expense advance,
 * marking someone paid, waiving / overriding / un-waiving a rule-made
 * deduction, and reopening a month. Each is one server call; the server
 * checks the limits (a manager's pay line over their limit waits for the
 * owner, AD-5), the open month (AD-10) and the cap (AV-5), and answers in
 * words, which the toast shows. React Hook Form + Zod on every form.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useForm, type UseFormReturn, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import {
  clearExpenseAdvance, createAdjustment, logExpenseAdvance, reassignExpenseAdvance, markPaid, overrideDeduction, recordAdvance, reviewAdvance,
  setPeriodStatus, stopAdjustment, unwaiveDeduction, useCurrent, useListBranches, useListEmployees, waiveDeduction,
} from "@/data/api/generated/api";
import type { PayrollPeriod } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { getErrorMessage, type ReasonFor } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { cairoNow, egpToPiastres, fmtMoney } from "@/lib/format";
import { invalidateStaff } from "@/features/staff/util";
import type { SalaryAdvance } from "@/data/api/generated/models";
import { capView } from "./phase-d";

/** Pounds as typed → piastres; null when it isn't a positive amount. */
export const readPounds = (s: string): number | null => {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? egpToPiastres(n) : null;
};

/** Today in the active (branch) zone, as `YYYY-MM-DD` / `YYYY-MM`. */
const isoToday = () => cairoNow().toISOString().slice(0, 10);
/** A month picker's `YYYY-MM` → the first day the server files the line under. */
export const monthToDate = (m: string) => `${m}-01`;

/**
 * The first month that can still take a line (AD-10, owner decision 27): the
 * open period's month, or the next one once it is approved or paid (an early
 * approval leaves no room this month). Today's month when the period is
 * unknown (no payroll right).
 */
export function firstOpenMonth(period: Pick<PayrollPeriod, "status" | "end_date"> | undefined, today: string): string {
  if (!period) return today.slice(0, 7);
  const [y, m] = period.end_date.split("-").map(Number);
  if (period.status === "draft") return period.end_date.slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)); // month is 1-based here, so this is the month after
  return next.toISOString().slice(0, 7);
}

/** The first open month, from the payroll run when this person may read it. */
function useFirstOpenMonth(enabled: boolean): string {
  const authz = useAuthz();
  const canRead = authz.canAny(Cap.hrPayrollRead, Cap.hrPayrollRun);
  const q = useCurrent({ query: { enabled: enabled && canRead } });
  return firstOpenMonth(canRead ? q.data?.period : undefined, isoToday());
}

const pounds = (t: (k: string, d: string) => string) =>
  z.coerce.number<number>({ message: t("dawam.amountRequired", "Type an amount") }).positive(t("dawam.amountRequired", "Type an amount"));
const nonEmpty = (t: (k: string, d: string) => string, msg: [string, string]) => z.string().trim().min(1, t(msg[0], msg[1]));

function FormDialog<V extends FieldValues>({
  open, onOpenChange, title, description, children, form, onSave, saveLabel, destructive, reasonFor, monthForm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  form: UseFormReturn<V, unknown, V> | UseFormReturn<never, unknown, V>;
  onSave: (values: V) => Promise<void>;
  saveLabel?: string;
  destructive?: boolean;
  /** Which situation a REASON_REQUIRED refusal is worded for (A5). */
  reasonFor?: ReasonFor;
  /** Its date is a month picker (the pay-line form). */
  monthForm?: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const f = form as unknown as UseFormReturn<V>;
  const save = f.handleSubmit(async (values) => {
    setBusy(true);
    try {
      await onSave(values as V);
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      // The server's words: over the limit, an approved month, the cap.
      toast.error(getErrorMessage(e, { reasonFor, monthForm }));
    } finally {
      setBusy(false);
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <Form {...f}>
          <form onSubmit={(e) => void save(e)} className="grid gap-3" noValidate>
            {children}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={busy}>
                {saveLabel ?? t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PersonField<V extends FieldValues>({ form, name, enabled, notSelf = false }: { form: UseFormReturn<V>; name: Path<V>; enabled: boolean; notSelf?: boolean }) {
  const { t } = useTranslation();
  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled } });
  // A pay line is never for yourself (AD-4): the server refuses it, so it isn't offered.
  const me = useAuthStore((s) => s.user?.id);
  const people = (employeesQ.data ?? []).filter((e) => !notSelf || !me || e.user_id !== me);
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("staff.employee", "Employee")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger aria-label={t("staff.employee", "Employee")}>
                <SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {people.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextField<V extends FieldValues>({ form, name, label, type = "text", hint, step, min, max }: {
  form: UseFormReturn<V>; name: Path<V>; label: string; type?: string; hint?: string; step?: string; min?: string; max?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} step={step} min={min} max={max} inputMode={type === "number" ? "decimal" : undefined} {...field} value={field.value ?? ""} />
          </FormControl>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A bonus or deduction: an amount or a % of salary, one-off or every month, in a chosen open month (AD-1..AD-3, AD-10). */
export function AdjustmentDialog({
  open, onOpenChange, userId: fixedUser, bonus: initialBonus = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId?: string;
  bonus?: boolean;
}) {
  const { t } = useTranslation();
  const schema = z
    .object({
      employee_id: nonEmpty(t, ["staff.pickEmployee", "Pick an employee"]),
      kind: z.enum(["bonus", "deduction"]),
      by: z.enum(["amount", "percent"]),
      amount: z.string(),
      reason: nonEmpty(t, ["dawam.reasonRequired", "A reason is needed"]).max(500),
      recurring: z.boolean(),
      month: z.string().regex(/^\d{4}-\d{2}$/, t("dawam.monthRequired", "Pick a month")),
    })
    .refine((v) => (v.kind === "bonus" && v.by === "percent" ? Number(v.amount) > 0 && Number(v.amount) <= 100 : readPounds(v.amount) !== null), {
      path: ["amount"],
      message: t("dawam.amountRequired", "Type an amount"),
    });
  type Values = z.infer<typeof schema>;
  // Lands in the first open month, not a closed one (owner decision 27).
  const openMonth = useFirstOpenMonth(open);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: fixedUser ?? "", kind: initialBonus ? "bonus" : "deduction", by: "amount", amount: "", reason: "", recurring: false, month: openMonth,
    },
  });
  // The run may arrive after the form: follow it until the month is touched.
  const monthTouched = form.formState.dirtyFields.month;
  useEffect(() => {
    if (!monthTouched && form.getValues("month") !== openMonth) form.setValue("month", openMonth);
  }, [openMonth, monthTouched, form]);
  const kind = form.watch("kind");
  const recurring = form.watch("recurring");
  // A deduction is always an amount (AD-2); only a bonus can be a % of salary.
  const by = kind === "bonus" ? form.watch("by") : "amount";
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      reasonFor="payLine"
      monthForm
      title={t("dawam.addPayLine", "Add a bonus or deduction")}
      description={t("dawam.addPayLineHint", "Over your limit, it waits for the owner before it counts.")}
      onSave={async (v) => {
        const line = await createAdjustment({
          employee_id: v.employee_id,
          kind: v.kind,
          reason: v.reason.trim(),
          recurring: v.recurring,
          amount_piastres: by === "amount" ? readPounds(v.amount) : null,
          percent_of_base: by === "percent" ? Number(v.amount) : null,
          effective_date: monthToDate(v.month),
        });
        // Over the manager's limit the server keeps it pending for the owner (AD-5).
        if (line?.status === "pending") toast.info(t("dawam.payLinePending", "Over your limit: it waits for the owner before it counts."));
        else toast.success(t("dawam.payLineAdded", "Pay line added"));
      }}
    >
      {fixedUser ? null : <PersonField form={form} name="employee_id" enabled={open} notSelf />}
      <FormField
        control={form.control}
        name="kind"
        render={({ field }) => (
          <SegmentedControl
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "bonus", label: t("dawam.bonus", "Bonus") },
              { value: "deduction", label: t("dawam.deduction", "Deduction") },
            ]}
          />
        )}
      />
      {kind === "bonus" ? (
        <FormField
          control={form.control}
          name="by"
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "amount", label: t("dawam.byAmount", "Amount") },
                { value: "percent", label: t("dawam.byPercent", "% of salary") },
              ]}
            />
          )}
        />
      ) : null}
      <TextField form={form} name="amount" type="number" label={by === "percent" ? t("dawam.percent", "Percent") : t("dawam.amountEgp", "Amount (EGP)")} />
      <TextField form={form} name="reason" label={t("staff.reason", "Reason")} hint={t("dawam.reasonShown", "The employee sees this reason on their payslip.")} />
      <TextField
        form={form}
        name="month"
        type="month"
        label={recurring ? t("dawam.recurringFrom", "Every month from") : t("dawam.effectiveMonth", "Counts in the month of")}
        hint={t("dawam.monthHint", "Only open months: an approved month can't take new lines (AD-10).")}
      />
      <FormField
        control={form.control}
        name="recurring"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="adj-recurring">{t("dawam.everyMonth", "Every month")}</Label>
              <p className="text-xs text-muted-foreground">{t("dawam.everyMonthHint", "Added to every payslip until you stop it — a meal allowance, say.")}</p>
            </div>
            <Switch id="adj-recurring" checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </FormDialog>
  );
}

/** A salary advance a manager hands over directly (AV-2): one atomic call, recorded and approved. */
export function RecordAdvanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const schema = z.object({
    employee_id: nonEmpty(t, ["staff.pickEmployee", "Pick an employee"]),
    amount: pounds(t),
    installments: z.coerce.number<number>().int().min(1).max(24, t("dawam.installmentsHint", "1 to 24 monthly installments")),
    reason: z.string().max(500),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", amount: "" as unknown as number, installments: 1, reason: "" },
  });
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      title={t("dawam.recordAdvance", "Record a salary advance")}
      description={t("dawam.recordAdvanceHint", "Paid back from the next payslips, oldest first, never below zero.")}
      onSave={async (v) => {
        await recordAdvance({
          employee_id: v.employee_id,
          amount_piastres: egpToPiastres(v.amount),
          installments: v.installments,
          reason: v.reason.trim() || null,
        });
        toast.success(t("dawam.advanceRecorded", "Advance recorded"));
      }}
    >
      <PersonField form={form as unknown as UseFormReturn<Values>} name="employee_id" enabled={open} />
      <TextField form={form as unknown as UseFormReturn<Values>} name="amount" type="number" step="0.01" label={t("dawam.amountEgp", "Amount (EGP)")} />
      <TextField form={form as unknown as UseFormReturn<Values>} name="installments" type="number" min="1" max="24" label={t("dawam.installments", "Monthly installments")} hint={t("dawam.installmentsHint", "1 to 24 monthly installments")} />
      <TextField form={form as unknown as UseFormReturn<Values>} name="reason" label={t("dawam.whatFor", "What for (optional)")} />
    </FormDialog>
  );
}

/** Cash for shop purchases: logged only, never deducted or settled (AV-7), dated and placed where it was handed over. */
export function ExpenseAdvanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: open && !!orgId } }).data ?? [];
  const schema = z.object({
    employee_id: nonEmpty(t, ["staff.pickEmployee", "Pick an employee"]),
    amount: pounds(t),
    purpose: nonEmpty(t, ["dawam.purposeRequired", "Say what it's for"]).max(500),
    // The server's sources for a hand-logged one (AV-7, AV-10): the safe or
    // a bank transfer. A till pay-out is tagged on the POS, never typed here.
    via: z.enum(["safe", "bank"]),
    given_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("dawam.dateRequired", "Pick a date")),
    branch_id: nonEmpty(t, ["dawam.pickBranch", "Pick a branch"]),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", amount: "" as unknown as number, purpose: "", via: "safe", given_on: isoToday(), branch_id: "" },
  });
  const f = form as unknown as UseFormReturn<Values>;
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      title={t("dawam.logExpense", "Log an expense advance")}
      description={t("dawam.logExpenseHint", "A record of cash handed over for the shop. It never touches a payslip.")}
      onSave={async (v) => {
        await logExpenseAdvance({
          employee_id: v.employee_id,
          amount_piastres: egpToPiastres(v.amount),
          purpose: v.purpose.trim(),
          via: v.via,
          given_on: v.given_on,
          branch_id: v.branch_id,
        });
        toast.success(t("dawam.expenseLogged", "Expense advance logged"));
      }}
    >
      <PersonField form={f} name="employee_id" enabled={open} />
      <TextField form={f} name="amount" type="number" step="0.01" label={t("dawam.amountEgp", "Amount (EGP)")} />
      <TextField form={f} name="purpose" label={t("dawam.purpose", "What it's for")} />
      <TextField form={f} name="given_on" type="date" label={t("dawam.givenOn", "Handed over on")} />
      <FormField
        control={f.control}
        name="branch_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("dawam.givenAt", "Handed over at")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-label={t("dawam.givenAt", "Handed over at")}>
                  <SelectValue placeholder={t("dawam.pickBranch", "Pick a branch")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={f.control}
        name="via"
        render={({ field }) => (
          <SegmentedControl
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "safe", label: t("dawam.viaSafe", "From the safe") },
              { value: "bank", label: t("dawam.viaBank", "Bank transfer") },
            ]}
          />
        )}
      />
    </FormDialog>
  );
}

/**
 * Correct a till-tagged expense advance (owner decision 39, AV-10): clear the
 * tag, or move it to the person who really took the cash, with why. The
 * pay-out itself stays in the till's count.
 */
export function CorrectExpenseTagDialog({
  expense, onOpenChange,
}: {
  expense: { id: string; employee_id: string; employee_name: string } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const schema = z
    .object({
      action: z.enum(["reassign", "clear"]),
      employee_id: z.string(),
      reason: nonEmpty(t, ["dawam.reasonRequired", "A reason is needed"]).max(500),
    })
    .refine((v) => v.action === "clear" || (!!v.employee_id && v.employee_id !== expense?.employee_id), {
      path: ["employee_id"],
      message: t("dawam.pickSomeoneElse", "Pick who really took it"),
    });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { action: "reassign", employee_id: "", reason: "" } });
  const action = form.watch("action");
  return (
    <FormDialog
      open={!!expense}
      onOpenChange={onOpenChange}
      form={form}
      reasonFor="correctAdvance"
      title={t("dawam.correctTagTitle", { name: expense?.employee_name ?? "", defaultValue: `Correct ${expense?.employee_name ?? ""}'s till tag` })}
      description={t("dawam.correctTagHint", "The cash that left the till stays as it is. Only who it is logged against changes, and the reason is kept in the audit log.")}
      onSave={async (v) => {
        if (v.action === "clear") {
          await clearExpenseAdvance(expense!.id, { reason: v.reason.trim() });
          toast.success(t("dawam.tagCleared", "Tag cleared: it stays a plain till pay-out"));
        } else {
          await reassignExpenseAdvance(expense!.id, { employee_id: v.employee_id, reason: v.reason.trim() });
          toast.success(t("dawam.tagReassigned", "Moved to the right person"));
        }
      }}
    >
      <FormField
        control={form.control}
        name="action"
        render={({ field }) => (
          <SegmentedControl
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "reassign", label: t("dawam.reassignTag", "Someone else took it") },
              { value: "clear", label: t("dawam.clearTag", "Clear the tag") },
            ]}
          />
        )}
      />
      {action === "reassign" ? <PersonField form={form} name="employee_id" enabled={!!expense} /> : null}
      <TextField form={form} name="reason" label={t("staff.reason", "Reason")} />
    </FormDialog>
  );
}

export const PAY_METHODS = ["cash", "bank", "wallet"] as const;
export const PAY_METHOD_FALLBACK: Record<string, string> = { cash: "Cash", bank: "Bank transfer", wallet: "Mobile wallet", none: "Nothing to pay" };

/** Paid, per person, with how (PAY-7). */
export function MarkPaidDialog({
  periodId, person, onOpenChange,
}: {
  periodId: string;
  person: { employee_id: string; name: string; pay_method?: string } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const schema = z.object({ method: z.enum(PAY_METHODS) });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { method: (PAY_METHODS as readonly string[]).includes(person?.pay_method ?? "") ? (person!.pay_method as Values["method"]) : "cash" },
  });
  return (
    <FormDialog
      open={!!person}
      onOpenChange={onOpenChange}
      form={form}
      title={t("dawam.markPaidTitle", { name: person?.name ?? "", defaultValue: `Mark ${person?.name ?? ""} paid` })}
      description={t("dawam.markPaidHint", "Once anyone is paid, the month can't be reopened.")}
      saveLabel={t("dawam.markPaid", "Mark paid")}
      onSave={async (v) => {
        await markPaid(periodId, person!.employee_id, { method: v.method });
        toast.success(t("dawam.markedPaid", "Marked paid"));
      }}
    >
      <FormField
        control={form.control}
        name="method"
        render={({ field }) => (
          <SegmentedControl
            value={field.value}
            onChange={field.onChange}
            options={PAY_METHODS.map((m) => ({ value: m, label: t(`dawam.pay_${m}`, PAY_METHOD_FALLBACK[m]) }))}
          />
        )}
      />
    </FormDialog>
  );
}

/** A one-field reason form shared by waive, un-waive and reopen. */
function ReasonDialog({
  open, onOpenChange, title, description, saveLabel, destructive, onSave, done, reasonFor, optional = false, hint, children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  saveLabel: string;
  destructive?: boolean;
  onSave: (reason: string) => Promise<unknown>;
  done: string;
  reasonFor?: ReasonFor;
  /** The reason may be left empty (a request's rejection note; the server takes none as none). */
  optional?: boolean;
  /** Under the reason: who reads it. */
  hint?: string;
  /** What the decision does, above the reason. */
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const schema = z.object({
    reason: optional
      ? z.string().trim().max(500, t("staff.noteTooLong", "Keep the note under 500 characters"))
      : nonEmpty(t, ["dawam.reasonRequired", "A reason is needed"]).max(500),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      title={title}
      description={description}
      saveLabel={saveLabel}
      destructive={destructive}
      reasonFor={reasonFor}
      onSave={async (v) => {
        await onSave(v.reason.trim());
        toast.success(done);
      }}
    >
      {children}
      <TextField
        form={form}
        name="reason"
        label={optional ? t("dawamOps.reasonOptional", "Reason (optional)") : t("staff.reason", "Reason")}
        hint={hint}
      />
    </FormDialog>
  );
}

/** Reject an advance or a pay line, with why (owner decision 8, AD-9): the server refuses one without (REASON_REQUIRED). */
export function RejectDialog({
  open, onOpenChange, title, description, onReject, optional, children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  onReject: (reason: string) => Promise<unknown>;
  /** A request's reason is optional (sent as its note); money's is required (D8). */
  optional?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      saveLabel={t("common.reject", "Reject")}
      destructive
      onSave={onReject}
      reasonFor="decline"
      optional={optional}
      hint={t("dawamOps.reasonSeen", "They see it with the decision.")}
      done={t("staff.decisionSaved", "Decision saved")}
    >
      {children}
    </ReasonDialog>
  );
}

/** Waive a rule-made deduction with a reason; final unless undone with one (AD-7, AD-8, AT-7). */
export function WaiveDialog({
  deductionId, label, onOpenChange,
}: {
  deductionId: string | null;
  label: string;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <ReasonDialog
      open={!!deductionId}
      onOpenChange={onOpenChange}
      title={t("dawam.waiveTitle", { line: label, defaultValue: `Waive "${label}"` })}
      description={t("dawam.waiveHint", "A waiver is final: no recalculation brings the deduction back.")}
      saveLabel={t("dawam.waive", "Waive")}
      onSave={(reason) => waiveDeduction(deductionId!, { reason })}
      done={t("dawam.waived", "Deduction waived")}
    />
  );
}

/** Undo a waiver, with a reason (AT-7): the rule's figure comes back. */
export function UnwaiveDialog({
  deductionId, label, onOpenChange,
}: {
  deductionId: string | null;
  label: string;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <ReasonDialog
      open={!!deductionId}
      onOpenChange={onOpenChange}
      title={t("dawam.unwaiveTitle", { line: label, defaultValue: `Undo the waiver on "${label}"?` })}
      description={t("dawam.unwaiveHint", "The rule's figure comes back, and the reason is kept with the waiver.")}
      saveLabel={t("dawam.unwaive", "Undo the waiver")}
      onSave={(reason) => unwaiveDeduction(deductionId!, { reason })}
      done={t("dawam.unwaived", "Waiver undone")}
    />
  );
}

/** Stop a monthly line from next month, with why (AD-3, AD-9): the open month keeps it (owner decision 6). */
export function StopDialog({
  line, onOpenChange,
}: {
  line: { kind: string; id: string; reason: string } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <ReasonDialog
      open={!!line}
      onOpenChange={onOpenChange}
      title={t("dawam.stopTitle", { line: line?.reason ?? "", defaultValue: `Stop "${line?.reason ?? ""}"?` })}
      description={t("dawam.stopHint", "This month keeps it; it stops from next month. The reason is kept in the audit log.")}
      saveLabel={t("dawam.stop", "Stop")}
      destructive
      onSave={(reason) => stopAdjustment(line!.kind, line!.id, { reason })}
      reasonFor="stopLine"
      done={t("dawam.stoppedToast", "Stopped from next month")}
    />
  );
}

/** Reopen an approved month: back to a live preview, with why (PAY-6, AD-9). */
export function ReopenDialog({ periodId, onOpenChange }: { periodId: string | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <ReasonDialog
      open={!!periodId}
      onOpenChange={onOpenChange}
      title={t("dawam.reopenTitle", "Reopen this month?")}
      description={`${t("dawam.reopenHint", "The payslips go back to a live preview. Advance installments are given back, never taken twice.")} ${t("dawam.reopenReason", "Why reopen? It is kept in the audit log.")}`}
      saveLabel={t("dawam.reopen", "Reopen")}
      destructive
      onSave={(reason) => setPeriodStatus(periodId!, { status: "draft", reason })}
      done={t("dawam.reopened", "Payroll reopened")}
    />
  );
}

/** Override a rule-made deduction's amount with a reason (AD-7, AD-8): zero allowed, raising is limited (AD-5). */
export function OverrideDialog({
  deductionId, label, current, onOpenChange,
}: {
  deductionId: string | null;
  label: string;
  /** The line's current piastres. */
  current: number;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const schema = z.object({
    amount: z.coerce.number<number>({ message: t("dawam.amountRequired", "Type an amount") }).min(0, t("dawam.amountRequired", "Type an amount")),
    reason: nonEmpty(t, ["dawam.reasonRequired", "A reason is needed"]).max(500),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: current / 100, reason: "" },
  });
  const f = form as unknown as UseFormReturn<Values>;
  return (
    <FormDialog
      open={!!deductionId}
      onOpenChange={onOpenChange}
      form={form}
      title={t("dawam.overrideTitle", { line: label, defaultValue: `Override "${label}"` })}
      description={t("dawam.overrideHint", "The rule's figure stays on record. Lowering is a partial waiver; raising counts against your deduction limit.")}
      saveLabel={t("dawam.override", "Override")}
      onSave={async (v) => {
        await overrideDeduction(deductionId!, { amount_piastres: egpToPiastres(v.amount), reason: v.reason.trim() });
        toast.success(t("dawam.overridden", "Deduction overridden"));
      }}
    >
      <TextField form={f} name="amount" type="number" step="0.01" min="0" label={t("dawam.newAmount", "New amount (EGP)")} />
      <TextField form={f} name="reason" label={t("staff.reason", "Reason")} />
    </FormDialog>
  );
}

/** Decide a salary advance someone asked for, optionally changing it (AV-2, AV-3). */
export function ReviewAdvanceDialog({
  advance, onOpenChange,
}: {
  advance: { id: string; employee_name?: string | null; amount_piastres: number; installments: number } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const schema = z.object({
    amount: pounds(t),
    installments: z.coerce.number<number>().int().min(1).max(24, t("dawam.installmentsHint", "1 to 24 monthly installments")),
    note: z.string().max(500),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: advance ? advance.amount_piastres / 100 : ("" as unknown as number), installments: advance?.installments ?? 1, note: "" },
  });
  const f = form as unknown as UseFormReturn<Values>;
  return (
    <FormDialog
      open={!!advance}
      onOpenChange={onOpenChange}
      form={form}
      title={t("dawam.reviewAdvance", { name: advance?.employee_name ?? "", defaultValue: `Approve ${advance?.employee_name ?? ""}'s advance` })}
      description={t("dawam.reviewAdvanceHint", "Change the amount or the installments if you need to. Above the cap it waits for the owner.")}
      saveLabel={t("common.approve", "Approve")}
      onSave={async (v) => {
        // Sent exactly as approved: only what changed differs from the request (piastres kept).
        const amount = egpToPiastres(v.amount);
        await reviewAdvance(advance!.id, {
          approve: true,
          amount_piastres: amount === advance!.amount_piastres ? null : amount,
          installments: v.installments,
          note: v.note.trim() || null,
        });
        toast.success(t("staff.decisionSaved", "Decision saved"));
      }}
    >
      <TextField form={f} name="amount" type="number" step="0.01" label={t("dawam.amountEgp", "Amount (EGP)")} />
      <TextField form={f} name="installments" type="number" min="1" max="24" label={t("dawam.installments", "Monthly installments")} />
      <TextField form={f} name="note" label={t("staff.note", "Note")} />
    </FormDialog>
  );
}

/**
 * An advance against the owner's cap (AV-5, owner decision 7): "Within cap"
 * or "Over cap" for everyone. The figures show only when the server sends the
 * cap (it reveals the salary). Someone who may not pass the cap reads that
 * only the owner can approve it.
 */
export function AdvanceCapNote({ advance, mayPassCap }: { advance: SalaryAdvance; mayPassCap: boolean }) {
  const { t } = useTranslation();
  const { within, owed, cap } = capView(advance);
  if (within === null) return null;
  const figures = cap != null
    ? t("dawam.capFigures", { owed: fmtMoney(owed), cap: fmtMoney(cap), defaultValue: `Owes ${fmtMoney(owed)} of a ${fmtMoney(cap)} cap` })
    : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusPill tone={within ? "success" : "warning"}>
        {within
          ? t("dawam.withinCap", "Within cap")
          : mayPassCap
            ? t("dawam.overCap", "Over cap")
            : t("dawam.overCapOwner", "Over the cap: only the owner can approve")}
      </StatusPill>
      {figures ? <span className="text-xs text-muted-foreground">{figures}</span> : null}
    </span>
  );
}

