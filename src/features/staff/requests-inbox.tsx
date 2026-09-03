import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  CalendarOff, Check, Clock3, LogOut, Plane, Plus, Timer, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createRequestAdmin, decideRequest,
  useListEmployees, useListLeaveTypes, useListRequests,
} from "@/data/api/generated/api";
import type { StaffRequest } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateRequests, REQUEST_STATUS_CLASS, todayIso } from "./util";

const ALL = "__all__";

/** The five kinds, with the icon and copy each one needs. */
const KINDS: { value: string; icon: LucideIcon; labelKey: string; fallback: string }[] = [
  { value: "leave", icon: CalendarOff, labelKey: "staff.kindLeave", fallback: "Leave" },
  { value: "late_arrival", icon: Timer, labelKey: "staff.kindLateArrival", fallback: "Late arrival" },
  { value: "early_departure", icon: LogOut, labelKey: "staff.kindEarlyDeparture", fallback: "Early departure" },
  { value: "excuse", icon: Clock3, labelKey: "staff.kindExcuse", fallback: "Permission" },
  { value: "mission", icon: Plane, labelKey: "staff.kindMission", fallback: "Mission" },
];

const kindMeta = (kind: string) => KINDS.find((k) => k.value === kind) ?? KINDS[0];

/**
 * One queue for every kind of request. Approving here is what stops the penalty
 * engine from charging that day — the decision is the mechanism, not a note.
 */
export function RequestsInboxPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("pending");
  const [kind, setKind] = useState(ALL);
  const [addOpen, setAddOpen] = useState(false);
  const [deciding, setDeciding] = useState<StaffRequest | null>(null);

  const requestsQ = useListRequests({
    status: status === ALL ? undefined : status,
    kind: kind === ALL ? undefined : kind,
  });
  const rows = useMemo(() => requestsQ.data ?? [], [requestsQ.data]);

  const quickDecide = async (r: StaffRequest, next: "approved" | "rejected") => {
    // Kinds that carry a pay decision get the dialog; the rest are one click.
    if (next === "approved" && (r.kind === "excuse" || r.kind === "early_departure")) {
      setDeciding(r);
      return;
    }
    try {
      await decideRequest(r.id, { status: next });
      toast.success(t("staff.decisionSaved", "Decision saved"));
      void invalidateRequests();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("staff.requests", "Requests")}
        description={t(
          "staff.requestsSubtitle",
          "Approving a request waives the penalty for that day at its source — there is nothing to correct afterwards.",
        )}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            {t("staff.newRequest", "New request")}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("staff.allStatuses", "All statuses")}</SelectItem>
            <SelectItem value="pending">{t("staff.req_pending", "Pending")}</SelectItem>
            <SelectItem value="approved">{t("staff.req_approved", "Approved")}</SelectItem>
            <SelectItem value="rejected">{t("staff.req_rejected", "Rejected")}</SelectItem>
            <SelectItem value="cancelled">{t("staff.req_cancelled", "Cancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("staff.allKinds", "All kinds")}</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>{t(k.labelKey, k.fallback)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requestsQ.isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={t("staff.noRequests", "Nothing here")}
          description={t(
            "staff.noRequestsHint",
            "Requests filed from the staff app land here for a decision.",
          )}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const meta = kindMeta(r.kind);
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="gap-0 p-3">
                <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{r.user_name}</span>
                    <Badge variant="outline">{t(meta.labelKey, meta.fallback)}</Badge>
                    <Badge
                      variant="outline"
                      className={`border-transparent ${REQUEST_STATUS_CLASS[r.status] ?? ""}`}
                    >
                      {t(`staff.req_${r.status}`, r.status)}
                    </Badge>
                    {r.is_paid === false ? (
                      <Badge variant="outline">{t("staff.unpaidBadge", "unpaid")}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {describeWindow(r, t)}
                    {r.reason ? ` · ${r.reason}` : ""}
                    {r.decision_note ? ` · ${r.decision_note}` : ""}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => void quickDecide(r, "approved")}>
                      <Check className="size-4" />
                      {t("common.approve", "Approve")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void quickDecide(r, "rejected")}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <NewRequestDialog open={addOpen} onOpenChange={setAddOpen} />
      <ApproveWithPayDialog request={deciding} onOpenChange={(o) => !o && setDeciding(null)} />
    </Page>
  );
}

/** "10 Sep → 12 Sep", "arriving by 10:00", "12:00–14:00 on 4 Sep". */
function describeWindow(r: StaffRequest, t: TFunction): string {
  const time = (s?: string | null) => (s ? s.slice(0, 5) : "");
  switch (r.kind) {
    case "late_arrival":
      return t("staff.windowLate", "{{date}} · arriving by {{time}}", {
        date: r.on_date,
        time: time(r.to_time),
      });
    case "early_departure":
      return t("staff.windowEarly", "{{date}} · leaving at {{time}}", {
        date: r.on_date,
        time: time(r.from_time),
      });
    case "excuse":
      return t("staff.windowExcuse", "{{date}} · {{from}}–{{to}}", {
        date: r.on_date,
        from: time(r.from_time),
        to: time(r.to_time),
      });
    default:
      return r.end_date && r.end_date !== r.on_date
        ? `${r.on_date} → ${r.end_date}`
        : r.on_date;
  }
}

/** Approving a window kind asks the one extra question that matters: paid or not. */
function ApproveWithPayDialog({
  request,
  onOpenChange,
}: {
  request: StaffRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [paid, setPaid] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await decideRequest(request.id, {
        status: "approved",
        is_paid: paid,
        note: note || null,
      });
      toast.success(t("staff.decisionSaved", "Decision saved"));
      void invalidateRequests();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.approveRequest", "Approve request")}</DialogTitle>
          <DialogDescription>
            {request ? `${request.user_name} · ${describeWindow(request, t)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="ap-paid">{t("staff.paidTime", "Paid time")}</Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  "staff.paidTimeHint",
                  "On, the excused hours still count toward the day. Off, they are excused but unpaid.",
                )}
              </p>
            </div>
            <Switch id="ap-paid" checked={paid} onCheckedChange={setPaid} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-note">{t("staff.note", "Note")}</Label>
            <Input id="ap-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={() => void approve()} disabled={busy}>
            {t("common.approve", "Approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** File a request on someone's behalf — the phone-call path. */
function NewRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState("late_arrival");
  const [userId, setUserId] = useState("");
  const [onDate, setOnDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [fromTime, setFromTime] = useState("12:00");
  const [toTime, setToTime] = useState("14:00");
  const [leaveType, setLeaveType] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled: open } });
  const typesQ = useListLeaveTypes({ query: { enabled: open && kind === "leave" } });

  const needsFrom = kind === "early_departure" || kind === "excuse";
  const needsTo = kind === "late_arrival" || kind === "excuse";
  const isSpan = kind === "leave" || kind === "mission";

  const save = async () => {
    setBusy(true);
    try {
      await createRequestAdmin({
        user_id: userId,
        kind,
        on_date: onDate,
        end_date: isSpan ? endDate : null,
        from_time: needsFrom ? `${fromTime}:00` : null,
        to_time: needsTo ? `${toTime}:00` : null,
        leave_type_id: kind === "leave" ? leaveType : null,
        title: kind === "mission" ? title : null,
        reason: reason || null,
      });
      toast.success(t("staff.requestFiled", "Request filed"));
      void invalidateRequests();
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
          <DialogTitle>{t("staff.newRequest", "New request")}</DialogTitle>
          <DialogDescription>
            {t("staff.newRequestHint", "Filed as pending — approve it separately.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>{t("staff.kind", "Kind")}</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{t(k.labelKey, k.fallback)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          {kind === "leave" ? (
            <div className="space-y-1">
              <Label>{t("staff.leaveType", "Leave type")}</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue placeholder={t("staff.pickLeaveType", "Pick a type")} /></SelectTrigger>
                <SelectContent>
                  {(typesQ.data ?? []).filter((x) => x.is_active).map((x) => (
                    <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {kind === "mission" ? (
            <div className="space-y-1">
              <Label htmlFor="nr-title">{t("staff.missionTitle", "Title")}</Label>
              <Input id="nr-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nr-date">{isSpan ? t("staff.from", "From") : t("staff.date", "Date")}</Label>
              <Input id="nr-date" type="date" value={onDate} onChange={(e) => setOnDate(e.target.value)} />
            </div>
            {isSpan ? (
              <div className="space-y-1">
                <Label htmlFor="nr-end">{t("staff.to", "To")}</Label>
                <Input id="nr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            ) : null}
            {needsFrom ? (
              <div className="space-y-1">
                <Label htmlFor="nr-from">
                  {kind === "early_departure"
                    ? t("staff.leavingAt", "Leaving at")
                    : t("staff.windowFrom", "From")}
                </Label>
                <Input id="nr-from" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
              </div>
            ) : null}
            {needsTo ? (
              <div className="space-y-1">
                <Label htmlFor="nr-to">
                  {kind === "late_arrival"
                    ? t("staff.arrivingBy", "Arriving by")
                    : t("staff.windowTo", "To")}
                </Label>
                <Input id="nr-to" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
              </div>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="nr-reason">{t("staff.reason", "Reason")}</Label>
            <Input id="nr-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button
            onClick={() => void save()}
            disabled={busy || !userId || (kind === "leave" && !leaveType) || (kind === "mission" && !title.trim())}
          >
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
