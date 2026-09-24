/**
 * The small money forms payroll, approvals and the team board share: a bonus
 * or deduction, a salary advance recorded by a manager, an expense advance,
 * marking someone paid, waiving / overriding / un-waiving a rule-made
 * deduction, and reopening a month. Each is one server call; the server
 * checks the limits (a manager's pay line over their limit waits for the
 * owner, AD-5), the open month (AD-10) and the cap (AV-5), and answers in
 * words, which the toast shows. React Hook Form + Zod on every form.
 */
import { useState, type ReactNode } from "react";
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
import {
  createAdjustment, logExpenseAdvance, markPaid, overrideDeduction, recordAdvance, reviewAdvance,
  setPeriodStatus, unwaiveDeduction, useListBranches, useListEmployees, waiveDeduction,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { cairoNow, egpToPiastres } from "@/lib/format";
import { invalidateStaff } from "@/features/staff/util";

/** Pounds as typed → piastres; null when it isn't a positive amount. */
export const readPounds = (s: string): number | null => {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? egpToPiastres(n) : null;
};

/** Today in the active (branch) zone, as `YYYY-MM-DD` / `YYYY-MM`. */
const isoToday = () => cairoNow().toISOString().slice(0, 10);
const isoMonth = () => isoToday().slice(0, 7);
/** A month picker's `YYYY-MM` → the first day the server files the line under. */
export const monthToDate = (m: string) => `${m}-01`;

const pounds = (t: (k: string, d: string) => string) =>
  z.coerce.number<number>({ message: t("dawam.amountRequired", "Type an amount") }).positive(t("dawam.amountRequired", "Type an amount"));
const nonEmpty = (t: (k: string, d: string) => string, msg: [string, string]) => z.string().trim().min(1, t(msg[0], msg[1]));

function FormDialog<V extends FieldValues>({
  open, onOpenChange, title, description, children, form, onSave, saveLabel, destructive,
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
      toast.error(getErrorMessage(e));
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
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: fixedUser ?? "", kind: initialBonus ? "bonus" : "deduction", by: "amount", amount: "", reason: "", recurring: false, month: isoMonth(),
    },
  });
  const kind = form.watch("kind");
  const recurring = form.watch("recurring");
  // A deduction is always an amount (AD-2); only a bonus can be a % of salary.
  const by = kind === "bonus" ? form.watch("by") : "amount";
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
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
  open, onOpenChange, title, description, saveLabel, destructive, onSave, done,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  saveLabel: string;
  destructive?: boolean;
  onSave: (reason: string) => Promise<unknown>;
  done: string;
}) {
  const { t } = useTranslation();
  const schema = z.object({ reason: nonEmpty(t, ["dawam.reasonRequired", "A reason is needed"]).max(500) });
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
      onSave={async (v) => {
        await onSave(v.reason.trim());
        toast.success(done);
      }}
    >
      <TextField form={form} name="reason" label={t("staff.reason", "Reason")} />
    </FormDialog>
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
