import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { AlarmClock, CalendarCheck, CalendarClock, CalendarX, Info, MapPin, PencilLine, Plus, Timer } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { StatCard } from "@/components/app/stat-card";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangeField, EmployeePicker } from "@/components/inputs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listAttendance, useAttendanceSummary, useListAttendance, useListBranches, useListEmployees,
} from "@/data/api/generated/api";
import type { AttendanceRecord } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST } from "@/lib/export-all";
import { fmtDate, fmtDateTime, fmtNumber, fmtTime } from "@/lib/format";
import { usePeriodStartDay } from "@/features/dawam/period";
import { dawamQuery, failedEmpty } from "@/features/dawam/live";
import { DawamRefreshButton } from "@/features/dawam/refresh-button";
import { CorrectRecordDialog, ManualRecordDialog } from "./attendance-dialogs";
import {
  ATTENDANCE_STATUS_TONE, coveredBy, fmtHours, fmtMinutes, isoDaysFromToday, todayIso,
} from "./util";

const ALL = "__all__";

export function AttendancePage() {
  const { t } = useTranslation();
  const { branchId } = useScope();
  const [from, setFrom] = useState(isoDaysFromToday(-6));
  const [to, setTo] = useState(todayIso());
  const [status, setStatus] = useState(ALL);
  /** One person's days, or everyone's. */
  const [person, setPerson] = useState(ALL);
  const periodStartDay = usePeriodStartDay();
  const employeesQ = useListEmployees({}, { query: dawamQuery() });
  const [manualOpen, setManualOpen] = useState(false);
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();
  // The server checks each at the record's branch (hr.attendance.create /
  // .edit); a person without them is never offered the button.
  const authz = useAuthz();
  const canAdd = authz.can(Cap.hrAttendanceCreate);
  const canCorrect = authz.can(Cap.hrAttendanceEdit);

  const params = {
    from,
    to,
    branch_id: branchId ?? undefined,
    status: status === ALL ? undefined : status,
    employee_id: person === ALL ? undefined : person,
  };
  const recordsQ = useListAttendance(params, { query: dawamQuery() });
  const summaryQ = useAttendanceSummary(params, { query: dawamQuery() });
  const records = useMemo(() => recordsQ.data ?? [], [recordsQ.data]);
  // Each punch reads on its own branch's clock (AT-1), also with "All
  // branches" in scope, as the Correct dialog does.
  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const zones = useMemo(
    () => new Map((branchesQ.data ?? []).map((b) => [b.id, b.timezone || undefined])),
    [branchesQ.data],
  );

  // The owner's day of a shift a colleague covers: no punch goes on it (D1).
  const coverer = (r: AttendanceRecord) =>
    r.covered_employee_id || r.check_in_at ? null : coveredBy(records, r.employee_id, r.business_date, r.work_shift_id ?? null);

  // Roll the per-employee summary up to a headline for the window.
  const totals = useMemo(() => {
    const rows = summaryQ.data ?? [];
    return rows.reduce(
      (acc, r) => ({
        present: acc.present + r.present_days,
        late: acc.late + r.late_days,
        absent: acc.absent + r.absent_days,
        overtime: acc.overtime + r.total_overtime_minutes,
      }),
      { present: 0, late: 0, absent: 0, overtime: 0 },
    );
  }, [summaryQ.data]);

  // `/staff/attendance` answers a window in one unpaged response, so the export
  // re-runs the page's own query rather than walking pages — with the same
  // from/to/branch/status, so the file is the window the operator is looking at.
  //
  // Worked, late and overtime travel as MINUTES, not as the "7h 30m" the table
  // renders: a payroll sheet's whole point is to add these up, and a duration
  // written as prose is a column of text to Excel.
  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await listAttendance(params, EXPORT_REQUEST);
      const cols: ExcelColumn<AttendanceRecord>[] = [
        { header: t("staff.name", "Name"), accessor: (r) => r.employee_name ?? "—", type: "text", width: 24 },
        { header: t("staff.workShift", "Work shift"), accessor: (r) => r.work_shift_name ?? t("staff.unscheduled", "Unscheduled"), type: "text", width: 20 },
        { header: t("staff.date", "Date"), accessor: (r) => r.business_date, type: "date", width: 14 },
        { header: t("staff.attendanceStatus", "Status"), accessor: (r) => t(`staff.att_${r.status}`, r.status), type: "text", width: 14 },
        { header: t("staff.checkIn", "In"), accessor: (r) => r.check_in_at ?? null, type: "dateTime", width: 22 },
        {
          header: t("staff.checkInDistance", "In distance (m)"),
          accessor: (r) => (r.check_in_distance_meters == null ? null : Math.round(r.check_in_distance_meters)),
          type: "integer",
          width: 16,
        },
        { header: t("staff.checkOut", "Out"), accessor: (r) => r.check_out_at ?? null, type: "dateTime", width: 22 },
        { header: t("staff.autoClosedColumn", "Auto-closed"), accessor: (r) => r.check_out_method === "auto", type: "bool", width: 14 },
        { header: t("staff.inMethodColumn", "In by"), accessor: (r) => methodText(t, r.check_in_method), type: "text", width: 16 },
        { header: t("staff.outMethodColumn", "Out by"), accessor: (r) => methodText(t, r.check_out_method), type: "text", width: 16 },
        { header: t("staff.inReasonColumn", "Why punched in"), accessor: (r) => r.punch_reason ?? "", type: "text", width: 24 },
        { header: t("staff.outReasonColumn", "Why punched out"), accessor: (r) => r.check_out_reason ?? "", type: "text", width: 24 },
        { header: t("staff.workedMinutes", "Worked (minutes)"), accessor: (r) => r.worked_minutes, type: "integer", width: 16, total: true },
        { header: t("staff.lateMinutes", "Late (minutes)"), accessor: (r) => r.late_minutes, type: "integer", width: 16, total: true },
        { header: t("dawamOps.leftEarlyMinutes", "Left early (minutes)"), accessor: (r) => r.early_leave_minutes, type: "integer", width: 18, total: true },
        { header: t("staff.overtimeMinutes", "Overtime (minutes)"), accessor: (r) => r.overtime_minutes, type: "integer", width: 18, total: true },
      ];
      const title = t("staff.attendance", "Attendance");
      await exportToExcel({
        filename: "Madar-Attendance",
        logoUrl,
        meta: `${from} → ${to}`,
        sheets: [{
          name: title,
          title,
          subtitle: status === ALL ? t("staff.allStatuses", "All statuses") : t(`staff.att_${status}`, status),
          rows: rows as unknown as Record<string, unknown>[],
          columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
          totals: true,
        }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnDef<AttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "employee_name",
        header: t("staff.name", "Name"),
        meta: { label: t("staff.name", "Name"), phone: "title" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.employee_name ?? "—"}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.work_shift_name ?? t("staff.unscheduled", "Unscheduled")}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "business_date",
        header: t("staff.date", "Date"),
        meta: { label: t("staff.date", "Date"), numeric: true, align: "start" },
        cell: ({ row }) => fmtDate(row.original.business_date),
      },
      {
        accessorKey: "status",
        header: t("staff.attendanceStatus", "Status"),
        meta: { label: t("staff.attendanceStatus", "Status") },
        cell: ({ row }) => (
          <span className="inline-flex flex-wrap items-center gap-1">
            <StatusPill tone={ATTENDANCE_STATUS_TONE[row.original.status] ?? "neutral"}>
              {t(`staff.att_${row.original.status}`, row.original.status)}
            </StatusPill>
            {/* Its month is approved or paid: the server refuses a correction (PERIOD_CLOSED). */}
            {row.original.month_closed ? <Badge variant="outline">{t("staff.monthClosed", "Month closed")}</Badge> : null}
            {/* A colleague covers this shift: the owner can't be punched in on it (D1). */}
            {coverer(row.original) ? (
              <Badge variant="outline">{t("dawam.coveredBy", { name: coverer(row.original), defaultValue: `Covered by ${coverer(row.original)}` })}</Badge>
            ) : null}
          </span>
        ),
      },
      {
        id: "in",
        header: t("staff.checkIn", "In"),
        meta: { label: t("staff.checkIn", "In"), numeric: true, align: "start" },
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>{row.original.check_in_at ? fmtDateTime(row.original.check_in_at, zones.get(row.original.branch_id)) : "—"}</span>
            <MethodBadge method={row.original.check_in_method} />
            {row.original.check_in_distance_meters !== null
              && row.original.check_in_distance_meters !== undefined ? (
              <span
                className="flex items-center gap-0.5 text-xs text-muted-foreground"
                title={t("staff.distanceFromBranch", "Distance from the branch when clocking in")}
              >
                <MapPin className="size-3" />
                <bdi>{t("staff.metres", { n: fmtNumber(Math.round(row.original.check_in_distance_meters)), defaultValue: "{{n}}m" })}</bdi>
              </span>
            ) : null}
            <PunchReason text={row.original.punch_reason} />
          </div>
        ),
      },
      {
        id: "out",
        header: t("staff.checkOut", "Out"),
        meta: { label: t("staff.checkOut", "Out"), numeric: true, align: "start" },
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>{row.original.check_out_at ? fmtDateTime(row.original.check_out_at, zones.get(row.original.branch_id)) : "—"}</span>
            {row.original.check_out_method === "auto" ? (
              <Badge variant="secondary" className="font-sans text-xs">
                {t("staff.autoClosed", "auto")}
              </Badge>
            ) : (
              <MethodBadge method={row.original.check_out_method} />
            )}
            <PunchReason text={row.original.check_out_reason} />
          </div>
        ),
      },
      {
        id: "worked",
        header: t("staff.worked", "Worked"),
        meta: { label: t("staff.worked", "Worked"), numeric: true },
        cell: ({ row }) => fmtMinutes(row.original.worked_minutes),
      },
      {
        id: "late",
        header: t("staff.late", "Late"),
        meta: { label: t("staff.late", "Late"), numeric: true },
        cell: ({ row }) =>
          row.original.late_minutes > 0 ? (
            <span className="inline-flex flex-col items-end">
              <span className="text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]">{fmtMinutes(row.original.late_minutes)}</span>
              {row.original.scheduled_start_at ? (
                <span className="font-sans text-[11px] text-muted-foreground">
                  {t("dawamOps.lateAfter", { time: fmtTime(row.original.scheduled_start_at, zones.get(row.original.branch_id)), defaultValue: "after {{time}}" })}
                </span>
              ) : null}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "early",
        header: t("dawamOps.leftEarly", "Left early"),
        meta: { label: t("dawamOps.leftEarly", "Left early"), numeric: true },
        cell: ({ row }) =>
          row.original.early_leave_minutes > 0 ? (
            <span className="inline-flex flex-col items-end">
              <span className="text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]">{fmtMinutes(row.original.early_leave_minutes)}</span>
              {row.original.scheduled_end_at ? (
                <span className="font-sans text-[11px] text-muted-foreground">
                  {t("dawamOps.earlyBefore", { time: fmtTime(row.original.scheduled_end_at, zones.get(row.original.branch_id)), defaultValue: "before {{time}}" })}
                </span>
              ) : null}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "overtime",
        header: t("staff.overtime", "Overtime"),
        meta: { label: t("staff.overtime", "Overtime"), numeric: true },
        cell: ({ row }) =>
          row.original.overtime_minutes > 0 ? (
            <span className="text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]">{fmtMinutes(row.original.overtime_minutes)}</span>
          ) : (
            "—"
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- coverer reads `records`
    [t, zones, records],
  );

  return (
    <Page>
      <PageHeader
        title={t("staff.attendance", "Attendance")}
        description={t(
          "staff.attendanceSubtitle",
          "Every clock-in is verified against the branch's location by the server. Records can be corrected here; corrections are audited.",
        )}
        actions={
          <>
            <DawamRefreshButton />
            <ExportButton onExport={handleExport} loading={exporting} disabled={!records.length} />
            {canAdd ? (
              <Button onClick={() => setManualOpen(true)}>
                <Plus className="size-4" />
                {t("staff.addRecord", "Add record")}
              </Button>
            ) : null}
          </>
        }
        below={
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <DateRangeField
              id="att"
              className="w-full max-w-md"
              value={{ from, to }}
              onChange={(r) => { setFrom(r.from); setTo(r.to); }}
              quick={["this_week", "last_week", "this_period", "last_period"]}
              periodStartDay={periodStartDay}
              fromLabel={t("staff.from", "From")}
              toLabel={t("staff.to", "To")}
            />
            <EmployeePicker
              className="w-52"
              aria-label={t("staff.employee", "Employee")}
              value={person}
              onChange={setPerson}
              items={[
                { id: ALL, name: t("dawamOps.everyone", "Everyone") },
                ...(employeesQ.data ?? []).map((e) => ({ id: e.id, name: e.name })),
              ]}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40" aria-label={t("staff.attendanceStatus", "Status")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("staff.allStatuses", "All statuses")}</SelectItem>
                <SelectItem value="present">{t("staff.att_present", "Present")}</SelectItem>
                <SelectItem value="late">{t("staff.att_late", "Late")}</SelectItem>
                <SelectItem value="half_day">{t("staff.att_half_day", "Half day")}</SelectItem>
                <SelectItem value="absent">{t("staff.att_absent", "Absent")}</SelectItem>
                <SelectItem value="on_leave">{t("staff.att_on_leave", "On leave")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* A failed summary has no counts: a dash, never a reassuring 0 (H3, as the Team board). */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label={t("staff.presentDays", "Present days")} value={failedEmpty(summaryQ) ? "—" : totals.present} loading={summaryQ.isLoading} />
        <StatCard icon={AlarmClock} label={t("staff.lateDays", "Late days")} value={failedEmpty(summaryQ) ? "—" : totals.late} loading={summaryQ.isLoading} />
        <StatCard icon={CalendarX} label={t("staff.absentDays", "Absent days")} value={failedEmpty(summaryQ) ? "—" : totals.absent} loading={summaryQ.isLoading} />
        <StatCard icon={Timer} label={t("staff.overtime", "Overtime")} value={failedEmpty(summaryQ) ? "—" : fmtHours(totals.overtime)} loading={summaryQ.isLoading} />
      </div>
      <AttendanceWords />

      <DataTable
        columns={columns}
        data={records}
        loading={recordsQ.isLoading}
        error={recordsQ.error}
        onRetry={() => void recordsQ.refetch()}
        rowActions={
          canCorrect
            ? (r) =>
                r.month_closed ? null : (
                  <RowAction label={t("staff.correct", "Correct")} onClick={() => setCorrecting(r)}>
                    <PencilLine className="size-4" />
                  </RowAction>
                )
            : undefined
        }
        getRowId={(r) => r.id}
        searchPlaceholder={t("staff.searchEmployees", "Search employees…")}
        emptyState={
          <EmptyState
            icon={CalendarClock}
            title={t("staff.noAttendance", "No attendance in this range")}
            description={t(
              "staff.noAttendanceHint",
              "Records appear as staff clock in from the mobile app, or when you add one by hand.",
            )}
          />
        }
      />

      <ManualRecordDialog open={manualOpen} onOpenChange={setManualOpen} branchId={branchId} />
      <CorrectRecordDialog record={correcting} coveredBy={correcting ? coverer(correcting) : null} onOpenChange={(o) => !o && setCorrecting(null)} />
    </Page>
  );
}

/**
 * How a punch was made (CL-16), for every way but the phone's own: a
 * manager's punch, the till PIN, a correction, a punch queued offline, a
 * cover. `mobile_gps` (the app, live) is the normal case and says nothing.
 */
const METHOD_LABEL: Record<string, [string, string]> = {
  manager: ["staff.method_manager", "by a manager"],
  manual: ["staff.method_manual", "entered by hand"],
  till: ["staff.method_till", "till PIN"],
  correction: ["staff.method_correction", "corrected"],
  offline: ["staff.method_offline", "queued offline"],
  cover: ["staff.method_cover", "cover"],
  kiosk: ["staff.method_kiosk", "kiosk"],
  auto: ["staff.method_auto", "auto-closed"],
};

function methodText(t: TFunction, method?: string | null): string {
  const m = method ? METHOD_LABEL[method] : undefined;
  return m ? t(m[0], m[1]) : "";
}

function MethodBadge({ method }: { method?: string | null }) {
  const { t } = useTranslation();
  const text = methodText(t, method);
  if (!text) return null;
  return (
    <Badge variant="outline" className="font-sans text-xs">
      {text}
    </Badge>
  );
}

/** Why someone else made this punch (AT-10; the out-reason is its own, BC-1). */
function PunchReason({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    // Its own line under the punch, so a narrow card never squeezes it to nothing.
    <span className="min-w-0 basis-full font-sans text-xs break-words whitespace-normal text-muted-foreground" title={text}>
      <bdi>{text}</bdi>
    </span>
  );
}

/** What late, left early and absent mean here: said once, above the rows that use them. */
function AttendanceWords() {
  const { t } = useTranslation();
  const words: [string, string][] = [
    [t("staff.late", "Late"), t("dawamOps.wordLate", "clocked in after the shift's start (after the grace minutes, if any). Charged unless a request covers it.")],
    [t("dawamOps.leftEarly", "Left early"), t("dawamOps.wordEarly", "clocked out before the shift's end: the time away is charged unless a request covers it.")],
    [t("staff.att_absent", "Absent"), t("dawamOps.wordAbsent", "rostered, never clocked in, and no approved leave or mission for the day.")],
    [t("staff.att_half_day", "Half day"), t("dawamOps.wordHalf", "worked less than the rules' half-day line.")],
  ];
  return (
    <details className="group rounded-xl border bg-card px-4 py-2.5 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
        <Info className="size-4 text-muted-foreground" aria-hidden />
        {t("dawamOps.wordsTitle", "What late, left early and absent mean")}
      </summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-muted-foreground sm:grid-cols-[auto_1fr]">
        {words.map(([term, def]) => (
          <div key={term} className="contents">
            <dt className="font-medium text-foreground">{term}</dt>
            <dd>{def}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
