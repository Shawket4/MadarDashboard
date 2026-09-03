import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, MapPin, PencilLine, Plus } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  correctRecord, createManualRecord,
  useAttendanceSummary, useListAttendance, useListEmployees, useListWorkShifts,
} from "@/data/api/generated/api";
import type { AttendanceRecord } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime } from "@/lib/format";
import {
  ATTENDANCE_STATUS_CLASS, fmtMinutes, invalidateAttendance, isoDaysFromToday, todayIso,
} from "./util";

const ALL = "__all__";

export function AttendancePage() {
  const { t } = useTranslation();
  const { branchId } = useScope();
  const [from, setFrom] = useState(isoDaysFromToday(-6));
  const [to, setTo] = useState(todayIso());
  const [status, setStatus] = useState(ALL);
  const [manualOpen, setManualOpen] = useState(false);
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null);

  const params = {
    from,
    to,
    branch_id: branchId ?? undefined,
    status: status === ALL ? undefined : status,
  };
  const recordsQ = useListAttendance(params);
  const summaryQ = useAttendanceSummary(params);
  const records = useMemo(() => recordsQ.data ?? [], [recordsQ.data]);

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

  const columns: ColumnDef<AttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "user_name",
        header: t("staff.name", "Name"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.user_name ?? "—"}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.work_shift_name ?? t("staff.unscheduled", "Unscheduled")}
            </div>
          </div>
        ),
      },
      { accessorKey: "business_date", header: t("staff.date", "Date") },
      {
        accessorKey: "status",
        header: t("staff.attendanceStatus", "Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`border-transparent ${ATTENDANCE_STATUS_CLASS[row.original.status] ?? ""}`}
          >
            {t(`staff.att_${row.original.status}`, row.original.status)}
          </Badge>
        ),
      },
      {
        id: "in",
        header: t("staff.checkIn", "In"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span>{row.original.check_in_at ? fmtDateTime(row.original.check_in_at) : "—"}</span>
            {row.original.check_in_distance_meters !== null
              && row.original.check_in_distance_meters !== undefined ? (
              <span
                className="flex items-center gap-0.5 text-xs text-muted-foreground"
                title={t("staff.distanceFromBranch", "Distance from the branch when clocking in")}
              >
                <MapPin className="size-3" />
                {Math.round(row.original.check_in_distance_meters)}m
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "out",
        header: t("staff.checkOut", "Out"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span>{row.original.check_out_at ? fmtDateTime(row.original.check_out_at) : "—"}</span>
            {row.original.check_out_method === "auto" ? (
              <Badge variant="outline" className="text-xs">
                {t("staff.autoClosed", "auto")}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "worked",
        header: t("staff.worked", "Worked"),
        cell: ({ row }) => fmtMinutes(row.original.worked_minutes),
      },
      {
        id: "late",
        header: t("staff.late", "Late"),
        cell: ({ row }) =>
          row.original.late_minutes > 0 ? (
            <span className="text-warning">{fmtMinutes(row.original.late_minutes)}</span>
          ) : (
            "—"
          ),
      },
      {
        id: "overtime",
        header: t("staff.overtime", "Overtime"),
        cell: ({ row }) =>
          row.original.overtime_minutes > 0 ? (
            <span className="text-success">{fmtMinutes(row.original.overtime_minutes)}</span>
          ) : (
            "—"
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("staff.correct", "Correct")}
            onClick={(e) => {
              e.stopPropagation();
              setCorrecting(row.original);
            }}
          >
            <PencilLine className="size-4" />
          </Button>
        ),
      },
    ],
    [t],
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
          <Button onClick={() => setManualOpen(true)}>
            <Plus className="size-4" />
            {t("staff.addRecord", "Add record")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="att-from">{t("staff.from", "From")}</Label>
          <Input id="att-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="att-to">{t("staff.to", "To")}</Label>
          <Input id="att-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("staff.presentDays", "Present days")} value={String(totals.present)} />
        <StatCard label={t("staff.lateDays", "Late days")} value={String(totals.late)} />
        <StatCard label={t("staff.absentDays", "Absent days")} value={String(totals.absent)} />
        <StatCard label={t("staff.overtime", "Overtime")} value={fmtMinutes(totals.overtime)} />
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={recordsQ.isLoading}
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
      <CorrectRecordDialog record={correcting} onOpenChange={(o) => !o && setCorrecting(null)} />
    </Page>
  );
}

/** Hand-entered attendance — the escape hatch for a day the app never saw. */
function ManualRecordDialog({
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
  const [userId, setUserId] = useState("");
  const [shiftId, setShiftId] = useState(ALL);
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState("present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");

  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled: open } });
  const shiftsQ = useListWorkShifts({ query: { enabled: open } });

  const save = async () => {
    if (!branchId) {
      toast.error(t("staff.pickBranchFirst", "Pick a single branch first"));
      return;
    }
    setBusy(true);
    try {
      await createManualRecord({
        user_id: userId,
        branch_id: branchId,
        business_date: date,
        work_shift_id: shiftId === ALL ? null : shiftId,
        // datetime-local has no zone; the browser's own offset is applied so the
        // instant matches what the operator typed on their screen.
        check_in_at: checkIn ? new Date(checkIn).toISOString() : null,
        check_out_at: checkOut ? new Date(checkOut).toISOString() : null,
        status,
        reason,
      });
      toast.success(t("staff.recordAdded", "Record added"));
      void invalidateAttendance();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

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

        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>{t("staff.employee", "Employee")}</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} /></SelectTrigger>
              <SelectContent>
                {(employeesQ.data ?? []).map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mr-date">{t("staff.date", "Date")}</Label>
              <Input id="mr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("staff.attendanceStatus", "Status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">{t("staff.att_present", "Present")}</SelectItem>
                  <SelectItem value="late">{t("staff.att_late", "Late")}</SelectItem>
                  <SelectItem value="half_day">{t("staff.att_half_day", "Half day")}</SelectItem>
                  <SelectItem value="absent">{t("staff.att_absent", "Absent")}</SelectItem>
                  <SelectItem value="on_leave">{t("staff.att_on_leave", "On leave")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("staff.workShift", "Work shift")}</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("staff.unscheduled", "Unscheduled")}</SelectItem>
                {(shiftsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mr-in">{t("staff.checkIn", "In")}</Label>
              <Input id="mr-in" type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mr-out">{t("staff.checkOut", "Out")}</Label>
              <Input id="mr-out" type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mr-reason">{t("staff.reason", "Reason")}</Label>
            <Input
              id="mr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("staff.reasonPlaceholder", "Why this record exists")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={() => void save()} disabled={busy || !userId || !reason.trim()}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Correct an existing record. The server recomputes late/overtime/status from
 *  the new stamps, so a corrected row is indistinguishable from a clocked one. */
function CorrectRecordDialog({
  record,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");

  // `datetime-local` wants a local yyyy-MM-ddTHH:mm with no zone suffix.
  const toLocalInput = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const open = !!record;
  const key = record?.id ?? "";

  const save = async () => {
    if (!record) return;
    setBusy(true);
    try {
      await correctRecord(record.id, {
        check_in_at: checkIn ? new Date(checkIn).toISOString() : null,
        check_out_at: checkOut ? new Date(checkOut).toISOString() : null,
        status: status || null,
        reason,
      });
      toast.success(t("staff.recordCorrected", "Record corrected"));
      void invalidateAttendance();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && record) {
          setCheckIn(toLocalInput(record.check_in_at));
          setCheckOut(toLocalInput(record.check_out_at));
          setStatus(record.status);
          setReason("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent key={key} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("staff.correctRecord", "Correct record")}</DialogTitle>
          <DialogDescription>
            {record?.user_name} · {record?.business_date}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cr-in">{t("staff.checkIn", "In")}</Label>
              <Input
                id="cr-in"
                type="datetime-local"
                defaultValue={toLocalInput(record?.check_in_at)}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cr-out">{t("staff.checkOut", "Out")}</Label>
              <Input
                id="cr-out"
                type="datetime-local"
                defaultValue={toLocalInput(record?.check_out_at)}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("staff.attendanceStatus", "Status")}</Label>
            <Select value={status || record?.status || "present"} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">{t("staff.att_present", "Present")}</SelectItem>
                <SelectItem value="late">{t("staff.att_late", "Late")}</SelectItem>
                <SelectItem value="half_day">{t("staff.att_half_day", "Half day")}</SelectItem>
                <SelectItem value="absent">{t("staff.att_absent", "Absent")}</SelectItem>
                <SelectItem value="on_leave">{t("staff.att_on_leave", "On leave")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cr-reason">{t("staff.reason", "Reason")}</Label>
            <Input
              id="cr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("staff.correctionReason", "Why this is being changed")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={() => void save()} disabled={busy || !reason.trim()}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
