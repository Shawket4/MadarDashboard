/**
 * The small money forms payroll and approvals share: a bonus or deduction, a
 * salary advance recorded by a manager, an expense advance, marking someone
 * paid, and waiving a rule-made deduction. Each is one server call; the server
 * checks the limits (a manager's pay line over their limit waits for the owner,
 * AD-5) and answers in words, which the toast shows.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/app/segmented-control";
import {
  createAdjustment, createAdvanceAdmin, logExpenseAdvance, markPaid, reviewAdvance,
  useListEmployees, waiveDeduction,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres } from "@/lib/format";
import { invalidateStaff } from "@/features/staff/util";

/** Pounds as typed → piastres; null when it isn't a positive amount. */
export const readPounds = (s: string): number | null => {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? egpToPiastres(n) : null;
};

function FormDialog({
  open, onOpenChange, title, description, children, onSave, canSave, saveLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => Promise<void>;
  canSave: boolean;
  saveLabel?: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await onSave();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid gap-3">{children}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={() => void save()} disabled={busy || !canSave}>
            {saveLabel ?? t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonPicker({ value, onChange, enabled }: { value: string; onChange: (v: string) => void; enabled: boolean }) {
  const { t } = useTranslation();
  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled } });
  return (
    <div className="space-y-1">
      <Label>{t("staff.employee", "Employee")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={t("staff.employee", "Employee")}>
          <SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} />
        </SelectTrigger>
        <SelectContent>
          {(employeesQ.data ?? []).map((e) => (
            <SelectItem key={e.user_id} value={e.user_id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} inputMode={type === "number" ? "decimal" : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A bonus or deduction: an amount or a % of salary, one-off or every month (AD-1..AD-3). */
export function AdjustmentDialog({
  open, onOpenChange, userId: fixedUser, bonus: initialBonus = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId?: string;
  bonus?: boolean;
}) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState(fixedUser ?? "");
  const [kind, setKind] = useState<"bonus" | "deduction">(initialBonus ? "bonus" : "deduction");
  const [pickedBy, setBy] = useState<"amount" | "percent">("amount");
  // A deduction is always an amount (AD-2); only a bonus can be a % of salary.
  const by = kind === "bonus" ? pickedBy : "amount";
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [recurring, setRecurring] = useState(false);
  const who = fixedUser ?? userId;
  const pounds = readPounds(amount);
  const percent = Number(amount);
  const valid = !!who && reason.trim() !== "" && (by === "amount" ? pounds !== null : percent > 0 && percent <= 100);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("dawam.addPayLine", "Add a bonus or deduction")}
      description={t("dawam.addPayLineHint", "Over your limit, it waits for the owner before it counts.")}
      canSave={valid}
      onSave={async () => {
        await createAdjustment({
          user_id: who,
          kind,
          reason: reason.trim(),
          recurring,
          amount_piastres: by === "amount" ? pounds : null,
          percent_of_base: by === "percent" ? percent : null,
        });
        toast.success(t("dawam.payLineAdded", "Pay line added"));
      }}
    >
      {fixedUser ? null : <PersonPicker value={userId} onChange={setUserId} enabled={open} />}
      <SegmentedControl
        value={kind}
        onChange={setKind}
        options={[
          { value: "bonus", label: t("dawam.bonus", "Bonus") },
          { value: "deduction", label: t("dawam.deduction", "Deduction") },
        ]}
      />
      {kind === "bonus" ? (
        <SegmentedControl
          value={by}
          onChange={setBy}
          options={[
            { value: "amount", label: t("dawam.byAmount", "Amount") },
            { value: "percent", label: t("dawam.byPercent", "% of salary") },
          ]}
        />
      ) : null}
      <Field
        id="adj-amount"
        type="number"
        label={by === "percent" ? t("dawam.percent", "Percent") : t("dawam.amountEgp", "Amount (EGP)")}
        value={amount}
        onChange={setAmount}
      />
      <Field id="adj-reason" label={t("staff.reason", "Reason")} value={reason} onChange={setReason} hint={t("dawam.reasonShown", "The employee sees this reason on their payslip.")} />
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div>
          <Label htmlFor="adj-recurring">{t("dawam.everyMonth", "Every month")}</Label>
          <p className="text-xs text-muted-foreground">{t("dawam.everyMonthHint", "Added to every payslip until you stop it — a meal allowance, say.")}</p>
        </div>
        <Switch id="adj-recurring" checked={recurring} onCheckedChange={setRecurring} />
      </div>
    </FormDialog>
  );
}

/** A salary advance a manager hands over directly (AV-2): recorded and approved. */
export function RecordAdvanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("1");
  const pounds = readPounds(amount);
  const n = Math.trunc(Number(installments));
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("dawam.recordAdvance", "Record a salary advance")}
      description={t("dawam.recordAdvanceHint", "Paid back from the next payslips, oldest first, never below zero.")}
      canSave={!!userId && pounds !== null && n >= 1 && n <= 24}
      onSave={async () => {
        const a = await createAdvanceAdmin({ user_id: userId, amount_piastres: pounds!, installments: n });
        await reviewAdvance(a.id, { approve: true, installments: n });
        toast.success(t("dawam.advanceRecorded", "Advance recorded"));
      }}
    >
      <PersonPicker value={userId} onChange={setUserId} enabled={open} />
      <Field id="adv-amount" type="number" label={t("dawam.amountEgp", "Amount (EGP)")} value={amount} onChange={setAmount} />
      <Field id="adv-installments" type="number" label={t("dawam.installments", "Monthly installments")} value={installments} onChange={setInstallments} />
    </FormDialog>
  );
}

/** Cash for shop purchases: logged only, never deducted or settled (AV-7). */
export function ExpenseAdvanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  // The server's three sources (AV-7, AV-8): from the safe, a bank transfer,
  // or a till pay-out tagged on the POS.
  const [via, setVia] = useState("safe");
  const pounds = readPounds(amount);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("dawam.logExpense", "Log an expense advance")}
      description={t("dawam.logExpenseHint", "A record of cash handed over for the shop. It never touches a payslip.")}
      canSave={!!userId && pounds !== null && purpose.trim() !== ""}
      onSave={async () => {
        await logExpenseAdvance({ user_id: userId, amount_piastres: pounds!, purpose: purpose.trim(), via });
        toast.success(t("dawam.expenseLogged", "Expense advance logged"));
      }}
    >
      <PersonPicker value={userId} onChange={setUserId} enabled={open} />
      <Field id="exp-amount" type="number" label={t("dawam.amountEgp", "Amount (EGP)")} value={amount} onChange={setAmount} />
      <Field id="exp-purpose" label={t("dawam.purpose", "What it's for")} value={purpose} onChange={setPurpose} />
      <SegmentedControl
        value={via}
        onChange={setVia}
        options={[
          { value: "safe", label: t("dawam.viaSafe", "From the safe") },
          { value: "bank", label: t("dawam.viaBank", "Bank transfer") },
          { value: "till", label: t("dawam.viaTill", "Till pay-out") },
        ]}
      />
    </FormDialog>
  );
}

export const PAY_METHODS = ["cash", "bank", "wallet"] as const;
export const PAY_METHOD_FALLBACK: Record<string, string> = { cash: "Cash", bank: "Bank transfer", wallet: "Mobile wallet" };

/** Paid, per person, with how (PAY-7). */
export function MarkPaidDialog({
  periodId, person, onOpenChange,
}: {
  periodId: string;
  person: { user_id: string; name: string; pay_method?: string } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<string>(person?.pay_method ?? "cash");
  return (
    <FormDialog
      open={!!person}
      onOpenChange={onOpenChange}
      title={t("dawam.markPaidTitle", { name: person?.name ?? "", defaultValue: `Mark ${person?.name ?? ""} paid` })}
      description={t("dawam.markPaidHint", "Once anyone is paid, the month can't be reopened.")}
      canSave
      saveLabel={t("dawam.markPaid", "Mark paid")}
      onSave={async () => {
        await markPaid(periodId, person!.user_id, { method });
        toast.success(t("dawam.markedPaid", "Marked paid"));
      }}
    >
      <SegmentedControl
        value={method}
        onChange={setMethod}
        options={PAY_METHODS.map((m) => ({ value: m, label: t(`dawam.pay_${m}`, PAY_METHOD_FALLBACK[m]) }))}
      />
    </FormDialog>
  );
}

/** Waive a rule-made deduction with a reason; final, never recalculated back (AD-7, AD-8). */
export function WaiveDialog({
  deductionId, label, onOpenChange,
}: {
  deductionId: string | null;
  label: string;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  return (
    <FormDialog
      open={!!deductionId}
      onOpenChange={onOpenChange}
      title={t("dawam.waiveTitle", { line: label, defaultValue: `Waive "${label}"` })}
      description={t("dawam.waiveHint", "A waiver is final: no recalculation brings the deduction back.")}
      canSave={reason.trim() !== ""}
      saveLabel={t("dawam.waive", "Waive")}
      onSave={async () => {
        await waiveDeduction(deductionId!, { reason: reason.trim() });
        toast.success(t("dawam.waived", "Deduction waived"));
      }}
    >
      <Field id="waive-reason" label={t("staff.reason", "Reason")} value={reason} onChange={setReason} />
    </FormDialog>
  );
}

/** Decide a salary advance someone asked for, optionally changing it (AV-2, AV-3). */
export function ReviewAdvanceDialog({
  advance, onOpenChange,
}: {
  advance: { id: string; user_name?: string | null; amount_piastres: number; installments: number } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(advance ? String(advance.amount_piastres / 100) : "");
  const [installments, setInstallments] = useState(advance ? String(advance.installments) : "1");
  const [note, setNote] = useState("");
  const pounds = readPounds(amount);
  const n = Math.trunc(Number(installments));
  return (
    <FormDialog
      open={!!advance}
      onOpenChange={onOpenChange}
      title={t("dawam.reviewAdvance", { name: advance?.user_name ?? "", defaultValue: `Approve ${advance?.user_name ?? ""}'s advance` })}
      description={t("dawam.reviewAdvanceHint", "Change the amount or the installments if you need to. Above the cap it waits for the owner.")}
      canSave={pounds !== null && n >= 1 && n <= 24}
      saveLabel={t("common.approve", "Approve")}
      onSave={async () => {
        await reviewAdvance(advance!.id, { approve: true, amount_piastres: pounds, installments: n, note: note.trim() || null });
        toast.success(t("staff.decisionSaved", "Decision saved"));
      }}
    >
      <Field id="rev-amount" type="number" label={t("dawam.amountEgp", "Amount (EGP)")} value={amount} onChange={setAmount} />
      <Field id="rev-installments" type="number" label={t("dawam.installments", "Monthly installments")} value={installments} onChange={setInstallments} />
      <Field id="rev-note" label={t("staff.note", "Note")} value={note} onChange={setNote} />
    </FormDialog>
  );
}
