/**
 * Dawam reports (DSH-3), over the period and branch in the scope bar:
 * attendance & discipline, labour cost against sales (only with POS on —
 * there are no sales without it, DSH-4), payroll history with overtime, and
 * advances — salary advances with what's left, and the expense log (`via` =
 * `till` when handed out of a POS drawer, AV-8). Every figure is the server's;
 * each table exports as CSV.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, CalendarClock, HandCoins, Scale } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Restricted } from "@/components/app/restricted";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useAdvances, useAttendanceSummary, useLabourVsSales, useListBranches, usePayrollHistory,
} from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { useOrgModules } from "@/hooks/use-org-modules";
import { downloadBlob } from "@/lib/download";
import { cairoParts, fmtDate, fmtMoney } from "@/lib/format";
import { fmtMinutes } from "@/features/staff/util";

/** A scope instant → the calendar day the backend's date params want, in the active zone. */
const localDate = (iso: string) => {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

/** One column: what the table shows and what the CSV gets. */
interface Col<R> {
  id: string;
  header: string;
  value: (r: R) => string | number;
  /** Piastres: shown as money, exported in pounds. */
  money?: boolean;
  numeric?: boolean;
}

const cell = (c: Col<never>, v: string | number) => (c.money ? fmtMoney(v as number) : v);

function columnsOf<R>(cols: Col<R>[]): ColumnDef<R>[] {
  return cols.map((c) => ({
    id: c.id,
    header: c.header,
    meta: c.money || c.numeric ? { numeric: true, align: "end" as const } : undefined,
    cell: ({ row }) => cell(c as Col<never>, c.value(row.original)),
  }));
}

/** RFC 4180 CSV; money in pounds so a spreadsheet adds it up. */
export function toCsv<R>(cols: Col<R>[], rows: R[]): string {
  const q = (v: string | number) => {
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map((c) => q(c.header)).join(",")];
  for (const r of rows) lines.push(cols.map((c) => q(c.money ? (c.value(r) as number) / 100 : c.value(r))).join(","));
  return lines.join("\r\n");
}

function Table<R>({ name, cols, rows, loading, empty }: { name: string; cols: Col<R>[]; rows: R[]; loading: boolean; empty: string }) {
  const { t } = useTranslation();
  const columns = useMemo(() => columnsOf(cols), [cols]);
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={rows.length === 0}
          onClick={() => downloadBlob(new Blob(["﻿" + toCsv(cols, rows)], { type: "text/csv;charset=utf-8" }), `${name}.csv`)}
        >
          {t("dawam.csv", "CSV")}
        </Button>
      </div>
      <DataTable columns={columns} data={rows} loading={loading} emptyState={<EmptyState icon={Scale} title={empty} />} />
    </div>
  );
}

export function StaffReportsPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const modules = useOrgModules();
  const { branchId, from, to } = useScope();
  const canAttendance = authz.can(Cap.hrAttendanceRead);
  const canPay = authz.can(Cap.hrPayrollRead);
  const hasPos = modules.includes("pos");
  const tabs = [
    canAttendance && "attendance",
    canPay && hasPos && "labour",
    canPay && "payroll",
    canPay && "advances",
  ].filter(Boolean) as string[];
  const [picked, setPicked] = useState<string | null>(null);
  const tab = picked && tabs.includes(picked) ? picked : tabs[0];

  if (authz.ready && tabs.length === 0) {
    return <Restricted title={t("dawam.reports", "Reports")} who={t("dawam.reportsNoAccess", "Reports need attendance or payroll rights. The owner can give you access.")} />;
  }
  const params = { from: localDate(from), to: localDate(to), branch_id: branchId ?? undefined };

  return (
    <Page>
      <PageHeader
        title={t("dawam.reports", "Reports")}
        description={t("dawam.reportsSubtitle", "Attendance, labour cost, payroll and advances over the period above.")}
      />
      <Tabs value={tab} onValueChange={setPicked} className="gap-6">
        <PageTabsList>
          {tabs.includes("attendance") ? <PageTabsTrigger value="attendance"><CalendarClock className="size-4" />{t("dawam.rAttendance", "Attendance & discipline")}</PageTabsTrigger> : null}
          {tabs.includes("labour") ? <PageTabsTrigger value="labour"><Scale className="size-4" />{t("dawam.rLabour", "Labour vs sales")}</PageTabsTrigger> : null}
          {tabs.includes("payroll") ? <PageTabsTrigger value="payroll"><Banknote className="size-4" />{t("dawam.rPayroll", "Overtime & payroll")}</PageTabsTrigger> : null}
          {tabs.includes("advances") ? <PageTabsTrigger value="advances"><HandCoins className="size-4" />{t("dawam.salaryAdvances", "Salary advances")}</PageTabsTrigger> : null}
        </PageTabsList>
        <TabsContent value="attendance">{tab === "attendance" ? <AttendanceTab params={params} /> : null}</TabsContent>
        <TabsContent value="labour">{tab === "labour" ? <LabourTab params={params} /> : null}</TabsContent>
        <TabsContent value="payroll">{tab === "payroll" ? <PayrollTab params={params} /> : null}</TabsContent>
        <TabsContent value="advances">{tab === "advances" ? <AdvancesTab params={params} /> : null}</TabsContent>
      </Tabs>
    </Page>
  );
}

type Params = { from: string; to: string; branch_id?: string };
const sum = <R,>(rows: R[], f: (r: R) => number) => rows.reduce((a, r) => a + f(r), 0);

function AttendanceTab({ params }: { params: Params }) {
  const { t } = useTranslation();
  const q = useAttendanceSummary(params);
  const rows = q.data ?? [];
  type R = (typeof rows)[number];
  const cols: Col<R>[] = [
    { id: "name", header: t("staff.name", "Name"), value: (r) => r.employee_name },
    { id: "present", header: t("dawam.rPresent", "Present"), value: (r) => r.present_days, numeric: true },
    { id: "late", header: t("dawam.stateLate", "Late"), value: (r) => r.late_days, numeric: true },
    { id: "absent", header: t("dawam.stateAbsent", "Absent"), value: (r) => r.absent_days, numeric: true },
    { id: "leave", header: t("dawam.state_on_leave", "On leave"), value: (r) => r.leave_days, numeric: true },
    { id: "worked", header: t("dawam.rWorked", "Worked"), value: (r) => fmtMinutes(r.total_worked_minutes), numeric: true },
    { id: "lateMin", header: t("dawam.rLateTime", "Late time"), value: (r) => fmtMinutes(r.total_late_minutes), numeric: true },
    { id: "ot", header: t("dawam.overtime", "Overtime"), value: (r) => fmtMinutes(r.total_overtime_minutes), numeric: true },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dawam.people", "People")} value={rows.length} formatType="number" loading={q.isLoading} />
        <StatCard label={t("dawam.stateLate", "Late")} value={sum(rows, (r) => r.late_days)} formatType="number" loading={q.isLoading} />
        <StatCard label={t("dawam.stateAbsent", "Absent")} value={sum(rows, (r) => r.absent_days)} formatType="number" loading={q.isLoading} />
        <StatCard label={t("dawam.overtime", "Overtime")} value={fmtMinutes(sum(rows, (r) => r.total_overtime_minutes))} loading={q.isLoading} />
      </div>
      <Table name="attendance" cols={cols} rows={rows} loading={q.isLoading} empty={t("dawam.rEmpty", "Nothing in this period")} />
    </div>
  );
}

function LabourTab({ params }: { params: Params }) {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const q = useLabourVsSales(params);
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } }).data ?? [];
  const names = new Map(branches.map((b) => [b.id, b.name]));
  const rows = q.data ?? [];
  type R = (typeof rows)[number];
  const share = (labour: number, sales: number) => (sales > 0 ? `${((labour / sales) * 100).toFixed(1)}%` : "—");
  const cols: Col<R>[] = [
    { id: "date", header: t("dawam.rDate", "Date"), value: (r) => fmtDate(r.date) },
    { id: "branch", header: t("dawam.branch", "Branch"), value: (r) => names.get(r.branch_id) ?? "—" },
    { id: "sales", header: t("dawam.rSales", "Sales"), value: (r) => r.sales_piastres, money: true },
    { id: "labour", header: t("dawam.rLabourCost", "Labour cost"), value: (r) => r.labour_piastres, money: true },
    { id: "share", header: t("dawam.rShare", "Labour share"), value: (r) => (r.labour_share_bp == null ? "—" : `${(r.labour_share_bp / 100).toFixed(1)}%`), numeric: true },
  ];
  const sales = sum(rows, (r) => r.sales_piastres);
  const labour = sum(rows, (r) => r.labour_piastres);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dawam.rSales", "Sales")} value={sales} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.rLabourCost", "Labour cost")} value={labour} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.rShare", "Labour share")} value={share(labour, sales)} loading={q.isLoading} />
      </div>
      <Table name="labour-vs-sales" cols={cols} rows={rows} loading={q.isLoading} empty={t("dawam.rEmpty", "Nothing in this period")} />
    </div>
  );
}

function PayrollTab({ params }: { params: Params }) {
  const { t } = useTranslation();
  const q = usePayrollHistory(params);
  const rows = q.data ?? [];
  type R = (typeof rows)[number];
  const cols: Col<R>[] = [
    { id: "period", header: t("dawam.period", "Period"), value: (r) => `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}` },
    { id: "people", header: t("dawam.people", "People"), value: (r) => r.people, numeric: true },
    { id: "base", header: t("dawam.salary", "Salary"), value: (r) => r.base_piastres, money: true },
    { id: "otMin", header: t("dawam.rOtTime", "Overtime hours"), value: (r) => fmtMinutes(r.overtime_minutes), numeric: true },
    { id: "ot", header: t("dawam.overtime", "Overtime"), value: (r) => r.overtime_piastres, money: true },
    { id: "bonuses", header: t("dawam.bonuses", "Bonuses"), value: (r) => r.bonuses_piastres, money: true },
    { id: "deductions", header: t("dawam.deductions", "Deductions"), value: (r) => r.deductions_piastres, money: true },
    { id: "advances", header: t("dawam.advancesCollected", "Advances collected"), value: (r) => r.advances_piastres, money: true },
    { id: "net", header: t("dawam.net", "Net"), value: (r) => r.net_piastres, money: true },
    { id: "status", header: t("common.status", "Status"), value: (r) => r.status },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dawam.totalNet", "Net pay")} value={sum(rows, (r) => r.net_piastres)} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.overtime", "Overtime")} value={sum(rows, (r) => r.overtime_piastres)} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.deductions", "Deductions")} value={sum(rows, (r) => r.deductions_piastres)} formatType="money" loading={q.isLoading} />
      </div>
      <Table name="payroll-history" cols={cols} rows={rows} loading={q.isLoading} empty={t("dawam.rEmpty", "Nothing in this period")} />
    </div>
  );
}

function AdvancesTab({ params }: { params: Params }) {
  const { t } = useTranslation();
  const q = useAdvances(params);
  const salary = q.data?.salary ?? [];
  const expense = q.data?.expense ?? [];
  type S = (typeof salary)[number];
  type E = (typeof expense)[number];
  const sCols: Col<S>[] = [
    { id: "name", header: t("staff.name", "Name"), value: (r) => r.employee_name },
    { id: "given", header: t("dawam.rGiven", "Given"), value: (r) => fmtDate(r.given_on) },
    { id: "amount", header: t("dawam.amountEgp", "Amount (EGP)"), value: (r) => r.amount_piastres, money: true },
    { id: "inst", header: t("dawam.installments", "Monthly installments"), value: (r) => r.installments, numeric: true },
    { id: "left", header: t("dawam.rLeft", "Left to pay"), value: (r) => r.remaining_piastres, money: true },
    { id: "status", header: t("common.status", "Status"), value: (r) => t(`staff.req_${r.status}`, r.status) },
  ];
  const eCols: Col<E>[] = [
    { id: "name", header: t("staff.name", "Name"), value: (r) => r.employee_name },
    { id: "given", header: t("dawam.rGiven", "Given"), value: (r) => fmtDate(r.given_on) },
    { id: "purpose", header: t("dawam.purpose", "What it's for"), value: (r) => r.purpose },
    { id: "via", header: t("dawam.rVia", "From"), value: (r) => t(`dawam.via_${r.via}`, r.via) },
    { id: "amount", header: t("dawam.amountEgp", "Amount (EGP)"), value: (r) => r.amount_piastres, money: true },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dawam.rSalaryGiven", "Salary advances given")} value={q.data?.salary_given_piastres ?? 0} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.rOutstanding", "Still owed")} value={q.data?.salary_outstanding_piastres ?? 0} formatType="money" loading={q.isLoading} />
        <StatCard label={t("dawam.rExpenseGiven", "Expense advances given")} value={q.data?.expense_given_piastres ?? 0} formatType="money" loading={q.isLoading} />
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("dawam.salaryAdvances", "Salary advances")}</h2>
        <Table name="salary-advances" cols={sCols} rows={salary} loading={q.isLoading} empty={t("dawam.noAdvances", "No salary advances")} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("dawam.expenseAdvances", "Expense advances")}</h2>
        <Table name="expense-advances" cols={eCols} rows={expense} loading={q.isLoading} empty={t("dawam.noExpenses", "Nothing logged")} />
      </section>
    </div>
  );
}
