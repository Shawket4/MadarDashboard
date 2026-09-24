/**
 * Payroll (Dawam PAY-*): the period that opened itself on the business's start
 * day, its live preview (the same calculation approving produces, PAY-2), the
 * pay lines, advances and expense log behind it, approve and reopen, and
 * marking each person paid. The same run the staff app's Payroll tab does
 * (PAY-4). Every figure is the server's.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BadgeCheck, Banknote, CircleDollarSign, FileDown, HandCoins, History, PencilLine, Plus, ReceiptText, RotateCcw, Trash2, Undo2,
  UsersRound, Wallet, X,
} from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { ListCard, ListRow } from "@/components/app/list-row";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Restricted } from "@/components/app/restricted";
import { StatCard } from "@/components/app/stat-card";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  decideAdjustment, deleteBonus, deleteDeduction, exportPeriodCsv, generatePeriod,
  useCurrent, useListAdjustments, useListAdvances, useListEmployees,
  useListExpenseAdvances, useListPayslips,
} from "@/data/api/generated/api";
import type {
  Adjustment, ComputedPayslip, Employee, ExpenseAdvance, PayrollPeriod, Payslip, SalaryAdvance,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { RulesFirstBanner } from "./rules-banner";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useCurrentOrg } from "@/hooks/use-org-modules";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { invalidateStaff, REQUEST_STATUS_TONE, todayIso } from "@/features/staff/util";

import { payslipLines, reasonText, type PayLine } from "./lines";
import { printPayslip } from "./payslip-print";
import {
  AdjustmentDialog, ExpenseAdvanceDialog, MarkPaidDialog, OverrideDialog, PAY_METHOD_FALLBACK, RecordAdvanceDialog, ReopenDialog,
  ReviewAdvanceDialog, StopDialog, UnwaiveDialog, WaiveDialog, AdvanceCapNote, RejectDialog, CorrectExpenseTagDialog,
} from "./money-dialogs";
import type { AdjustmentD, AdvanceD, CurrentPayrollD, DecideD, PayslipD } from "./phase-d-contract";

type Slip = ComputedPayslip | Payslip;
type Row = Slip & { employee_name: string; paid_method: string | null };

/** Days from `today` to the month's last day, both counted; 0 once it has ended. */
export const daysStillToCome = (endDate: string, today: string): number =>
  Math.max(0, Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) + 1);

/** open · approved · paid, from the server's period status. */
export const periodPhase = (p: PayrollPeriod | undefined): "open" | "approved" | "paid" =>
  p?.status === "generated" ? "approved" : p?.status === "paid" || p?.status === "closed" ? "paid" : "open";

const PHASE_TONE = { open: "neutral", approved: "info", paid: "success" } as const;

export function PayrollPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const canRead = authz.canAny(Cap.hrPayrollRead, Cap.hrPayrollRun);
  const canRun = authz.can(Cap.hrPayrollRun);
  const canAdjust = authz.can(Cap.hrAdjustmentsCreate);
  // Bonuses and deductions have their own limits and capabilities (AD-5).
  const canDeduct = authz.can(Cap.hrDeductionsCreate);
  const canAdvance = authz.can(Cap.hrAdvancesDecide);
  const canExpense = authz.can(Cap.hrExpenseAdvancesLog);
  const [tab, setTab] = useState("payslips");
  // An id, not the row: the sheet must show the payslip as it is after a
  // waiver or a new line, not as it was when it was opened.
  const [personId, setPersonId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [logging, setLogging] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [exporting, setExporting] = useState(false);
  const confirm = useConfirm();
  const logoUrl = useExportLogo();

  const currentQ = useCurrent({ query: { enabled: canRead } });
  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled: canRead } });
  const period = currentQ.data?.period;
  const phase = periodPhase(period);
  const people = useMemo(() => new Map((employeesQ.data ?? []).map((e) => [e.id, e])), [employeesQ.data]);

  // After approval the frozen payslips are the truth; before, the live preview.
  const rows: Row[] = useMemo(() => {
    const frozen = currentQ.data?.payslips ?? [];
    const source: Slip[] = frozen.length ? frozen : (currentQ.data?.preview ?? []);
    return source.map((s) => ({
      ...s,
      employee_name: ("employee_name" in s && s.employee_name) || ("name" in s && s.name) || people.get(s.employee_id)?.name || "—",
      paid_method: ("paid_method" in s && s.paid_method) || null,
    }));
  }, [currentQ.data, people]);

  // The server adds the run up (AT-3): its totals and how many are paid.
  const totals = {
    net: currentQ.data?.totals?.net_piastres ?? 0,
    deductions: currentQ.data?.totals?.deductions_piastres ?? 0,
    advances: currentQ.data?.totals?.advances_piastres ?? 0,
    people: currentQ.data?.totals?.people ?? rows.length,
    paid: currentQ.data?.paid_count ?? 0,
  };

  // On payroll with no salary (owner decision 9): approval is refused until
  // each is set or marked not paid through Dawam (409 SALARY_MISSING).
  const missing = rows.filter((r) => (r as PayslipD).salary_missing);
  const cur = currentQ.data as CurrentPayrollD | undefined;
  const missingCount = cur?.missing_salary_count ?? cur?.totals?.missing_salary_count ?? missing.length;

  // Reopen closes once a PERSON is paid (PAY-6). A zero-net payslip settled at
  // approval (method "none", PAY-7) isn't anyone being paid; the server allows it.
  const paidByHand = rows.filter((r) => r.paid_method && r.paid_method !== "none").length;

  if (authz.ready && !canRead) {
    return <Restricted title={t("dawam.payroll", "Payroll")} who={t("dawam.payrollNoAccess", "Payroll needs payroll rights. The owner can give you access.")} />;
  }

  const approve = async () => {
    // Nothing is written into an approved month (BC-3 decision a), so its days still to come lose their clock-ins.
    const ahead = period ? daysStillToCome(period.end_date, todayIso()) : 0;
    const hint = t("dawam.approveHint", "Every payslip is frozen with the lines behind it, and people can see theirs. You can reopen until anyone is marked paid.");
    const ok = await confirm({
      title: t("dawam.approveTitle", "Approve this month's payroll?"),
      description: ahead > 0
        ? `${t("dawam.approveDaysAhead", { count: ahead, defaultValue: "{{count}} days of this month are still to come; nobody can clock in on them after approval." })} ${hint}`
        : hint,
      confirmLabel: t("dawam.approve", "Approve payroll"),
    });
    if (!ok || !period) return;
    try {
      await generatePeriod(period.id);
      toast.success(t("dawam.approved", "Payroll approved"));
      void invalidateStaff();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // Bank-transfer people as a bank file, wallet people as numbers and amounts (PAY-8).
  const exportLists = async () => {
    setExporting(true);
    try {
      // Only what is actually transferred: a payslip with nothing to pay (a 0.00 net) is no transfer (PAY-8).
      const pick = (m: string) => rows.filter((r) => r.net_piastres > 0 && (people.get(r.employee_id)?.pay_method ?? "cash") === m);
      const cols = (acct: string): ExcelColumn<Row>[] => [
        { header: t("staff.name", "Name"), accessor: (r) => r.employee_name, type: "text", width: 26 },
        { header: acct, accessor: (r) => people.get(r.employee_id)?.pay_account ?? "", type: "text", width: 30 },
        { header: t("dawam.net", "Net"), accessor: (r) => r.net_piastres, type: "money", width: 16, total: true },
      ];
      await exportToExcel({
        filename: "Madar-Payroll-Transfers",
        logoUrl,
        meta: period ? `${fmtDate(period.start_date)} → ${fmtDate(period.end_date)}` : "",
        sheets: [
          { name: t("dawam.pay_bank", "Bank transfer"), title: t("dawam.bankList", "Bank transfers"), rows: pick("bank") as never, columns: cols(t("dawam.iban", "Account (IBAN)")) as never, totals: true },
          { name: t("dawam.pay_wallet", "Mobile wallet"), title: t("dawam.walletList", "Mobile wallets"), rows: pick("wallet") as never, columns: cols(t("dawam.walletNumber", "Wallet number")) as never, totals: true },
        ],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = async () => {
    if (!period) return;
    try {
      const csv = await exportPeriodCsv(period.id);
      const url = URL.createObjectURL(new Blob([csv as unknown as string], { type: "text/csv" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `payroll-${period.start_date}.csv` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "employee_name",
      header: t("staff.name", "Name"),
      meta: { label: t("staff.name", "Name"), phone: "title" },
      cell: ({ row }) => <span className="font-medium">{row.original.employee_name}</span>,
    },
    {
      id: "base",
      header: t("dawam.salary", "Salary"),
      meta: { numeric: true, align: "end" },
      cell: ({ row }) =>
        (row.original as PayslipD).salary_missing
          ? <Badge variant="outline" className="border-warning/60">{t("dawam.notSet", "Not set")}</Badge>
          : fmtMoney(payslipLines(row.original)[0].amount),
    },
    { id: "ot", header: t("dawam.overtime", "Overtime"), meta: { numeric: true, align: "end" }, cell: ({ row }) => fmtMoney(row.original.overtime_piastres) },
    { id: "bonuses", header: t("dawam.bonuses", "Bonuses"), meta: { numeric: true, align: "end" }, cell: ({ row }) => fmtMoney(row.original.bonuses_piastres) },
    { id: "deductions", header: t("dawam.deductions", "Deductions"), meta: { numeric: true, align: "end" }, cell: ({ row }) => fmtMoney(-row.original.deductions_piastres) },
    { id: "advance", header: t("dawam.advance", "Advance"), meta: { numeric: true, align: "end" }, cell: ({ row }) => fmtMoney(-row.original.advance_installment_piastres) },
    {
      id: "net",
      header: t("dawam.net", "Net"),
      meta: { numeric: true, align: "end" },
      cell: ({ row }) => (
        <span className="font-semibold">
          {fmtMoney(row.original.net_piastres)}
          {row.original.carry_out_piastres > 0 ? (
            <Badge variant="outline" className="ms-2">{t("dawam.carries", { amount: fmtMoney(row.original.carry_out_piastres), defaultValue: `carries ${fmtMoney(row.original.carry_out_piastres)}` })}</Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: "paid",
      header: t("dawam.paid", "Paid"),
      cell: ({ row }) =>
        row.original.paid_method ? (
          <StatusPill tone="success">{t(`dawam.pay_${row.original.paid_method}`, PAY_METHOD_FALLBACK[row.original.paid_method] ?? row.original.paid_method)}</StatusPill>
        ) : phase === "approved" && canRun ? (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setPaying(row.original); }}>
            {t("dawam.markPaid", "Mark paid")}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{phase === "open" ? t("dawam.estimate", "Estimate") : "—"}</span>
        ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("dawam.payroll", "Payroll")}
        description={
          period
            ? t("dawam.periodLine", { from: fmtDate(period.start_date), to: fmtDate(period.end_date), defaultValue: `${fmtDate(period.start_date)} → ${fmtDate(period.end_date)}` })
            : t("dawam.payrollSubtitle", "One run for the whole business, from the preview to paid.")
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {period ? <StatusPill tone={PHASE_TONE[phase]}>{t(`dawam.phase_${phase}`, phase)}</StatusPill> : null}
            {canRun && phase === "open" && period ? (
              <Button onClick={() => void approve()} disabled={missingCount > 0} aria-describedby={missingCount > 0 ? "salary-missing" : undefined}>
                <BadgeCheck className="size-4" />{t("dawam.approve", "Approve payroll")}
              </Button>
            ) : null}
            {canRun && phase === "approved" && paidByHand === 0 ? (
              <Button variant="outline" onClick={() => setReopening(true)}><RotateCcw className="size-4" />{t("dawam.reopen", "Reopen")}</Button>
            ) : null}
            {phase !== "open" ? (
              <>
                <ExportButton onExport={() => void exportLists()} loading={exporting} label={t("dawam.transferLists", "Bank & wallet lists")} />
                <Button variant="ghost" onClick={() => void exportCsv()}>{t("dawam.csv", "CSV")}</Button>
              </>
            ) : null}
          </div>
        }
      />
      <RulesFirstBanner />
      {phase === "open" && missingCount > 0 ? (
        <div id="salary-missing" role="alert" className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">
            {t("dawam.salaryMissingTitle", { count: missingCount, defaultValue: "{{count}} people on payroll have no salary" })}
          </p>
          <p className="text-muted-foreground">
            {missing.length ? `${missing.map((r) => r.employee_name).join(t("common.listSeparator", ", "))}. ` : ""}
            {t("dawam.salaryMissingHint", "Set their salary on Employees, or mark them not paid through Dawam. Payroll can't be approved until then.")}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dawam.totalNet", "Net pay")} value={totals.net} formatType="money" icon={CircleDollarSign} loading={currentQ.isLoading} />
        <StatCard label={t("dawam.people", "People")} value={totals.people} formatType="number" icon={UsersRound} loading={currentQ.isLoading} hint={phase === "open" ? undefined : t("dawam.paidCount", { paid: totals.paid, people: totals.people, defaultValue: `Paid ${totals.paid} of ${totals.people}` })} />
        <StatCard label={t("dawam.deductions", "Deductions")} value={totals.deductions} formatType="money" icon={ReceiptText} loading={currentQ.isLoading} />
        <StatCard label={t("dawam.advancesCollected", "Advances collected")} value={totals.advances} formatType="money" icon={HandCoins} loading={currentQ.isLoading} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <PageTabsList>
          <PageTabsTrigger value="payslips"><Banknote className="size-4" />{t("dawam.payslips", "Payslips")}</PageTabsTrigger>
          <PageTabsTrigger value="lines"><ReceiptText className="size-4" />{t("dawam.payLines", "Bonuses & deductions")}</PageTabsTrigger>
          <PageTabsTrigger value="advances"><HandCoins className="size-4" />{t("dawam.salaryAdvances", "Salary advances")}</PageTabsTrigger>
          <PageTabsTrigger value="expenses"><Wallet className="size-4" />{t("dawam.expenseAdvances", "Expense advances")}</PageTabsTrigger>
          <PageTabsTrigger value="history"><History className="size-4" />{t("dawam.history", "History")}</PageTabsTrigger>
        </PageTabsList>

        <TabsContent value="payslips">
          {currentQ.error ? (
            <ErrorState title={t("dawam.payrollLoadError", "Couldn't load payroll")} message={getErrorMessage(currentQ.error)} onRetry={() => void currentQ.refetch()} />
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              loading={currentQ.isLoading}
              getRowId={(r) => r.employee_id}
              onRowClick={(r) => setPersonId(r.employee_id)}
              emptyState={<EmptyState icon={Banknote} title={t("dawam.noPayslips", "Nobody on payroll yet")} description={t("dawam.noPayslipsHint", "Active employees with a salary show here.")} />}
            />
          )}
        </TabsContent>

        <TabsContent value="lines">
          <PayLinesTab canAdjust={canAdjust || canDeduct} owner={canRun} onAdd={() => setAdding(true)} />
        </TabsContent>
        <TabsContent value="advances">
          <AdvancesTab canAdvance={canAdvance} onRecord={() => setRecording(true)} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab canLog={canExpense} onLog={() => setLogging(true)} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab periods={currentQ.data?.history ?? []} people={people} />
        </TabsContent>
      </Tabs>

      <PayslipSheet
        row={rows.find((r) => r.employee_id === personId) ?? null}
        onOpenChange={(o) => !o && setPersonId(null)}
        editable={phase === "open" && canAdjust}
        canDeduct={phase === "open" && canDeduct}
        phase={phase}
        period={period ?? null}
      />
      <ReopenDialog key={`reopen-${reopening}`} periodId={reopening && period ? period.id : null} onOpenChange={(o) => !o && setReopening(false)} />
      {period ? (
        <MarkPaidDialog
          key={paying?.employee_id}
          periodId={period.id}
          person={paying ? { employee_id: paying.employee_id, name: paying.employee_name, pay_method: people.get(paying.employee_id)?.pay_method } : null}
          onOpenChange={(o) => !o && setPaying(null)}
        />
      ) : null}
      <AdjustmentDialog key={`add-${adding}`} open={adding} onOpenChange={setAdding} />
      <RecordAdvanceDialog key={`adv-${recording}`} open={recording} onOpenChange={setRecording} />
      <ExpenseAdvanceDialog key={`exp-${logging}`} open={logging} onOpenChange={setLogging} />
    </Page>
  );
}

function lineLabel(l: PayLine, t: (k: string, o?: Record<string, unknown>) => string) {
  return l.labelKey ? t(l.labelKey, { ...l.vars, defaultValue: l.label }) : l.label;
}

/** "Waived", with why when the server says (AD-6, M29). */
function waivedText(l: PayLine, t: (k: string, o?: Record<string, unknown>) => string) {
  return l.waiveReason
    ? t("dawam.lineWaivedWhy", { reason: l.waiveReason, defaultValue: `Waived: ${l.waiveReason}` })
    : t("dawam.lineWaived", { defaultValue: "Waived" });
}

/** One person's payslip, every line with its reason (AD-6), and what can change on it. */
function PayslipSheet({
  row, onOpenChange, editable, canDeduct, phase, period,
}: {
  row: Row | null;
  onOpenChange: (o: boolean) => void;
  /** May add bonuses and delete manual bonus lines (hr.adjustments.create). */
  editable: boolean;
  /** May add, waive, override, un-waive and delete deductions (hr.deductions.create). */
  canDeduct: boolean;
  phase: "open" | "approved" | "paid";
  period: PayrollPeriod | null;
}) {
  const { t, i18n } = useTranslation();
  const org = useCurrentOrg();
  const confirm = useConfirm();
  const [waiving, setWaiving] = useState<PayLine | null>(null);
  const [overriding, setOverriding] = useState<PayLine | null>(null);
  const [unwaiving, setUnwaiving] = useState<PayLine | null>(null);
  const [adding, setAdding] = useState<"bonus" | "deduction" | null>(null);
  const lines = row ? payslipLines(row) : [];
  const mayTouch = (l: PayLine) => (l.manual?.kind === "deduction" || l.rule || l.waivedId ? canDeduct : editable);

  const remove = async (l: PayLine) => {
    if (!l.manual) return;
    const ok = await confirm({
      title: t("dawam.deleteLineTitle", { line: l.label, defaultValue: `Delete "${l.label}"?` }),
      description: t("dawam.deleteLineHint", "Manual lines can be deleted until the month is approved."),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await (l.manual.kind === "bonus" ? deleteBonus(l.manual.id) : deleteDeduction(l.manual.id));
      toast.success(t("dawam.lineDeleted", "Line deleted"));
      void invalidateStaff();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const pdf = () => {
    if (!row) return;
    const ok = printPayslip({
      company: org?.name ?? "",
      period,
      person: row.employee_name,
      lines: lines.map((l) => ({ label: lineLabel(l, t), line: l, waivedNote: l.waived ? waivedText(l, t) : undefined })),
      net: row.net_piastres,
      carryOut: row.carry_out_piastres,
      labels: {
        title: t("dawam.payslip", "Payslip"),
        period: t("dawam.period", "Period"),
        employee: t("staff.employee", "Employee"),
        net: t("dawam.net", "Net"),
        waived: t("dawam.lineWaived", "Waived"),
        carryOut: t("dawam.lineCarryOut", "Carries to next month"),
      },
      lang: i18n.language,
      dir: i18n.dir(),
    });
    if (!ok) toast.error(t("dawam.popupBlocked", "Allow pop-ups for this site to download the payslip."));
  };

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{row?.employee_name}</SheetTitle>
          <SheetDescription>
            {phase === "open" ? t("dawam.estimateHint", "A live estimate: approving produces exactly this.") : t("dawam.frozenHint", "Frozen when payroll was approved.")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <ListCard>
            {lines.map((l) => (
              <ListRow
                key={l.key}
                variant="ledger"
                title={<span className={l.waived ? "text-muted-foreground line-through" : undefined}>{lineLabel(l, t)}</span>}
                meta={l.waived ? waivedText(l, t) : l.rule ? t("dawam.ruleLine", "From the rules") : l.manual ? t("dawam.manualLine", "Added by hand") : undefined}
                trailing={
                  <span className="flex items-center gap-1">
                    <span className={l.waived ? "text-muted-foreground line-through tabular-nums" : l.amount < 0 ? "text-destructive tabular-nums" : "tabular-nums"}>{fmtMoneySigned(l.amount)}</span>
                    {canDeduct && l.deductionId ? (
                      <>
                        <Button size="sm" variant="ghost" aria-label={t("dawam.waive", "Waive")} onClick={() => setWaiving(l)}>
                          <Undo2 className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={t("dawam.override", "Override")} onClick={() => setOverriding(l)}>
                          <PencilLine className="size-4" />
                        </Button>
                      </>
                    ) : null}
                    {canDeduct && l.waivedId ? (
                      <Button size="sm" variant="ghost" aria-label={t("dawam.unwaive", "Undo the waiver")} onClick={() => setUnwaiving(l)}>
                        <RotateCcw className="size-4" />
                      </Button>
                    ) : null}
                    {mayTouch(l) && l.manual ? (
                      <Button size="sm" variant="ghost" aria-label={t("common.delete", "Delete")} onClick={() => void remove(l)}>
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </span>
                }
              />
            ))}
          </ListCard>
          {row ? (
            <div className="flex items-center justify-between rounded-xl border p-4 font-semibold">
              <span>{t("dawam.net", "Net")}</span>
              <span className="tabular-nums">{fmtMoney(row.net_piastres)}</span>
            </div>
          ) : null}
          {row && row.carry_out_piastres > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dawam.carryHint", { amount: fmtMoney(row.carry_out_piastres), defaultValue: `Deductions went past what was earned: ${fmtMoney(row.carry_out_piastres)} carries to next month.` })}
            </p>
          ) : null}
          {row ? (
            <Button variant="outline" onClick={pdf}><FileDown className="size-4" />{t("dawam.downloadPdf", "Download PDF")}</Button>
          ) : null}
          {editable || canDeduct ? (
            <div className="flex gap-2">
              {editable ? <Button variant="outline" onClick={() => setAdding("bonus")}><Plus className="size-4" />{t("dawam.bonus", "Bonus")}</Button> : null}
              {canDeduct ? <Button variant="outline" onClick={() => setAdding("deduction")}><Plus className="size-4" />{t("dawam.deduction", "Deduction")}</Button> : null}
            </div>
          ) : null}
        </div>
        <WaiveDialog key={waiving?.key} deductionId={waiving?.deductionId ?? null} label={waiving?.label ?? ""} onOpenChange={(o) => !o && setWaiving(null)} />
        <OverrideDialog key={`o-${overriding?.key}`} deductionId={overriding?.deductionId ?? null} label={overriding?.label ?? ""} current={-(overriding?.amount ?? 0)} onOpenChange={(o) => !o && setOverriding(null)} />
        <UnwaiveDialog key={`u-${unwaiving?.key}`} deductionId={unwaiving?.waivedId ?? null} label={unwaiving?.label ?? ""} onOpenChange={(o) => !o && setUnwaiving(null)} />
        {row && adding ? (
          <AdjustmentDialog open onOpenChange={(o) => !o && setAdding(null)} userId={row.employee_id} bonus={adding === "bonus"} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

const ADJ_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning", approved: "success", rejected: "danger",
};

function PayLinesTab({ canAdjust, owner, onAdd }: { canAdjust: boolean; owner: boolean; onAdd: () => void }) {
  const { t } = useTranslation();
  const q = useListAdjustments({});
  const [stopping, setStopping] = useState<Adjustment | null>(null);
  const [rejecting, setRejecting] = useState<Adjustment | null>(null);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      void invalidateStaff();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };
  const rows = q.data ?? [];
  return (
    <div className="space-y-3">
      {canAdjust ? <Button onClick={onAdd}><Plus className="size-4" />{t("dawam.addPayLine", "Add a bonus or deduction")}</Button> : null}
      {q.isLoading ? <Skeleton className="h-40 w-full rounded-2xl" /> : rows.length === 0 ? (
        <EmptyState icon={ReceiptText} title={t("dawam.noPayLines", "No bonuses or deductions")} description={t("dawam.noPayLinesHint", "Lines added by hand show here, with who added them and why.")} />
      ) : (
        <ListCard>
          {rows.map((a: Adjustment) => {
            // Stop ends a monthly line at the end of the open month, which keeps it (D6):
            // until then it still counts, and it can't be stopped twice.
            const endsOn = a.ends_on ?? null;
            const stopped = !!endsOn && endsOn < todayIso();
            const value = a.percent_of_base != null ? `${a.percent_of_base}%` : fmtMoney(a.kind === "bonus" ? (a.amount_piastres ?? 0) : -(a.amount_piastres ?? 0));
            return (
              <ListRow
                key={`${a.kind}|${a.id}`}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate">{a.employee_name}</span>
                    <Badge variant="secondary">{a.kind === "bonus" ? t("dawam.bonus", "Bonus") : t("dawam.deduction", "Deduction")}</Badge>
                    {a.recurring ? (
                      <Badge variant="outline">
                        {stopped
                          ? t("dawam.stopped", "stopped")
                          : endsOn
                            ? t("dawam.monthlyUntil", { date: fmtDate(endsOn), defaultValue: `monthly until ${fmtDate(endsOn)}` })
                            : t("dawam.monthly", "monthly")}
                      </Badge>
                    ) : null}
                  </span>
                }
                meta={[
                  reasonText(t, a.reason_code, a.reason_vars as Record<string, unknown> | null, a.reason),
                  fmtDate(a.effective_date),
                  // Why the owner refused it (D8).
                  a.status === "rejected" && (a as AdjustmentD).decision_note
                    ? t("dawam.rejectedWhy", { reason: (a as AdjustmentD).decision_note, defaultValue: `Rejected: ${(a as AdjustmentD).decision_note}` })
                    : null,
                ].filter(Boolean).join(" · ")}
                trailing={
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{value}</span>
                    <StatusPill tone={ADJ_TONE[a.status] ?? "neutral"}>{t(`dawam.adj_${a.status}`, a.status)}</StatusPill>
                    {owner && a.status === "pending" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => void act(() => decideAdjustment(a.kind, a.id, { approve: true }), t("staff.decisionSaved", "Decision saved"))}>{t("common.approve", "Approve")}</Button>
                        <Button size="sm" variant="ghost" aria-label={t("common.reject", "Reject")} onClick={() => setRejecting(a)}><X className="size-4" /></Button>
                      </>
                    ) : null}
                    {canAdjust && a.recurring && !endsOn && a.status === "approved" ? (
                      <Button size="sm" variant="ghost" onClick={() => setStopping(a)}>{t("dawam.stop", "Stop")}</Button>
                    ) : null}
                  </span>
                }
              />
            );
          })}
        </ListCard>
      )}
      <StopDialog key={`stop-${stopping?.id}`} line={stopping} onOpenChange={(o) => !o && setStopping(null)} />
      <RejectDialog
        key={`reject-${rejecting?.id}`}
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title={t("dawam.rejectLineTitle", { name: rejecting?.employee_name ?? "", defaultValue: `Reject ${rejecting?.employee_name ?? ""}'s line?` })}
        description={t("dawam.rejectWhyHint", "They are told, with your reason, and nothing is paid for it. The reason is kept in the audit log.")}
        onReject={(reason) => decideAdjustment(rejecting!.kind, rejecting!.id, { approve: false, reason } as DecideD)}
      />
    </div>
  );
}

function AdvancesTab({ canAdvance, onRecord }: { canAdvance: boolean; onRecord: () => void }) {
  const { t } = useTranslation();
  const authz = useAuthz();
  // The owner may pass the cap and sees its figures; a manager reads within / over only (D7).
  const mayPassCap = authz.canEverywhere(Cap.hrPayrollRun);
  const q = useListAdvances({});
  const [reviewing, setReviewing] = useState<SalaryAdvance | null>(null);
  const rows = q.data ?? [];
  return (
    <div className="space-y-3">
      {canAdvance ? <Button onClick={onRecord}><Plus className="size-4" />{t("dawam.recordAdvance", "Record a salary advance")}</Button> : null}
      {q.isLoading ? <Skeleton className="h-40 w-full rounded-2xl" /> : rows.length === 0 ? (
        <EmptyState icon={HandCoins} title={t("dawam.noAdvances", "No salary advances")} description={t("dawam.noAdvancesHint", "Advances asked for in the app, or recorded here, and what is left to pay back.")} />
      ) : (
        <ListCard>
          {rows.map((a) => (
            <ListRow
              key={a.id}
              title={a.employee_name ?? "—"}
              meta={[
                t("dawam.advanceMeta", { amount: fmtMoney(a.amount_piastres), count: a.installments }),
                a.reason,
              ].filter(Boolean).join(" · ")}
              trailing={
                <span className="flex flex-wrap items-center justify-end gap-2">
                  {a.status === "pending" || a.status === "approved" ? <AdvanceCapNote advance={a as AdvanceD} mayPassCap={mayPassCap} /> : null}
                  {a.status === "approved" ? (
                    <span className="text-sm tabular-nums text-muted-foreground">{t("dawam.remaining", { amount: fmtMoney(a.remaining_piastres), defaultValue: `${fmtMoney(a.remaining_piastres)} left` })}</span>
                  ) : null}
                  <StatusPill tone={REQUEST_STATUS_TONE[a.status] ?? "neutral"}>{t(`staff.req_${a.status}`, a.status)}</StatusPill>
                  {canAdvance && a.status === "pending" ? (
                    <Button size="sm" variant="outline" onClick={() => setReviewing(a)}>{t("dawam.review", "Review")}</Button>
                  ) : null}
                </span>
              }
            />
          ))}
        </ListCard>
      )}
      <ReviewAdvanceDialog key={reviewing?.id} advance={reviewing} onOpenChange={(o) => !o && setReviewing(null)} />
    </div>
  );
}

function ExpensesTab({ canLog, onLog }: { canLog: boolean; onLog: () => void }) {
  const { t } = useTranslation();
  // The owner corrects a till tag here, since the POS has no correction screen (owner decision 39).
  const canCorrectTag = useAuthz().owner;
  const [correcting, setCorrecting] = useState<ExpenseAdvance | null>(null);
  // The scope bar's branch (the expense's own branch, AV-9); every branch when none is picked.
  const { branchId } = useScope();
  const q = useListExpenseAdvances(branchId ? { branch_id: branchId } : {});
  const rows = q.data ?? [];
  return (
    <div className="space-y-3">
      {canLog ? <Button onClick={onLog}><Plus className="size-4" />{t("dawam.logExpense", "Log an expense advance")}</Button> : null}
      <p className="text-sm text-muted-foreground">{t("dawam.expenseNever", "Expense advances are a log: never deducted, never settled, never on a payslip.")}</p>
      {q.isLoading ? <Skeleton className="h-40 w-full rounded-2xl" /> : rows.length === 0 ? (
        <EmptyState icon={Wallet} title={t("dawam.noExpenses", "Nothing logged")} description={t("dawam.noExpensesHint", "Cash handed over for the shop shows here, per person and branch.")} />
      ) : (
        <ListCard>
          {rows.map((x: ExpenseAdvance) => (
            <ListRow
              key={x.id}
              title={x.employee_name}
              meta={[x.purpose, fmtDate(x.given_on), t(`dawam.via_${x.via}`, x.via), x.handed_by_name].filter(Boolean).join(" · ")}
              trailing={
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{fmtMoney(x.amount_piastres)}</span>
                  {canCorrectTag && x.via === "till" ? (
                    <Button size="sm" variant="ghost" onClick={() => setCorrecting(x)}>{t("dawam.correctTag", "Correct the tag")}</Button>
                  ) : null}
                </span>
              }
            />
          ))}
        </ListCard>
      )}
      <CorrectExpenseTagDialog key={correcting?.id} expense={correcting} onOpenChange={(o) => !o && setCorrecting(null)} />
    </div>
  );
}

function HistoryTab({ periods, people }: { periods: PayrollPeriod[]; people: Map<string, Employee> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<PayrollPeriod | null>(null);
  const slipsQ = useListPayslips(open?.id ?? "", { query: { enabled: !!open } });
  if (periods.length === 0) {
    return <EmptyState icon={History} title={t("dawam.noHistory", "No earlier months yet")} description={t("dawam.noHistoryHint", "Approved months stay here with their frozen payslips.")} />;
  }
  return (
    <>
      <ListCard>
        {periods.map((p) => (
          <ListRow
            key={p.id}
            variant="nav"
            title={p.name}
            meta={`${fmtDate(p.start_date)} → ${fmtDate(p.end_date)}`}
            onClick={() => setOpen(p)}
            trailing={
              <span className="flex items-center gap-2">
                <span className="tabular-nums">{fmtMoney(p.total_net_piastres)}</span>
                <StatusPill tone={PHASE_TONE[periodPhase(p)]}>{t(`dawam.phase_${periodPhase(p)}`, periodPhase(p))}</StatusPill>
              </span>
            }
          />
        ))}
      </ListCard>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
            <SheetDescription>{t("dawam.frozenHint", "Frozen when payroll was approved.")}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {slipsQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <ListCard>
                {(slipsQ.data ?? []).map((s) => (
                  <ListRow
                    key={s.id}
                    title={s.employee_name ?? people.get(s.employee_id)?.name ?? "—"}
                    meta={s.paid_method ? t(`dawam.pay_${s.paid_method}`, PAY_METHOD_FALLBACK[s.paid_method] ?? s.paid_method) : t("dawam.unpaid", "Not paid")}
                    trailing={<span className="tabular-nums">{fmtMoney(s.net_piastres)}</span>}
                  />
                ))}
              </ListCard>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
