import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Ban, CalendarOff, Check, Clock3, LogOut, Plane, Plus, ShieldCheck, Timer, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { fmtDate, fmtTime, fmtWireTime } from "@/lib/format";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useListEmployees, useListRequests,
} from "@/data/api/generated/api";
import type { StaffRequest } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { dawamQuery } from "@/features/dawam/live";
import { DawamRefreshButton } from "@/features/dawam/refresh-button";
import { invalidateRequests, REQUEST_STATUS_TONE, todayIso } from "./util";

const ALL = "__all__";

/** Every kind, with the icon and copy each one needs. A correction is filed
 *  from the staff app against a record, never from this form. */
const KINDS: { value: string; icon: LucideIcon; labelKey: string; fallback: string; fileable: boolean }[] = [
  { value: "leave", icon: CalendarOff, labelKey: "staff.kindLeave", fallback: "Leave", fileable: true },
  { value: "late_arrival", icon: Timer, labelKey: "staff.kindLateArrival", fallback: "Late arrival", fileable: true },
  { value: "early_departure", icon: LogOut, labelKey: "staff.kindEarlyDeparture", fallback: "Early departure", fileable: true },
  { value: "excuse", icon: Clock3, labelKey: "staff.kindExcuse", fallback: "Permission", fileable: true },
  { value: "mission", icon: Plane, labelKey: "staff.kindMission", fallback: "Mission", fileable: true },
  { value: "correction", icon: ShieldCheck, labelKey: "dawam.kindCorrection", fallback: "Correction", fileable: false },
];
const FILEABLE = KINDS.filter((k) => k.fileable);

export const kindMeta = (kind: string) => KINDS.find((k) => k.value === kind) ?? KINDS[0];

/** Kinds whose approval carries a paid/unpaid call (RQ-2, RQ-7). */
export const ASKS_PAY = ["leave", "excuse", "early_departure"];

/**
 * The employee records linked to the signed-in user. Their own requests are
 * decided by someone above them (RQ-5): the server refuses a self-decision,
 * so the queue never offers one.
 */
export function useOwnEmployeeIds(enabled = true): Set<string> {
  // Only a fallback for a server that doesn't say (see isMine / mayDecide).
  const userId = useAuthStore((s) => s.user?.id);
  const q = useListEmployees({}, { query: dawamQuery({ enabled: enabled && !!userId }) });
  return useMemo(
    () => new Set((q.data ?? []).filter((e) => !!userId && e.user_id === userId).map((e) => e.id)),
    [q.data, userId],
  );
}

/** The caller's own request: the server says so (`is_own`); else guessed. */
export const isMine = (r: StaffRequest, own: Set<string>) => r.is_own ?? own.has(r.employee_id);

/**
 * May the caller approve or reject it? The server decides (`can_decide`: pending,
 * not theirs, at their branch, and they outrank a manager who filed it);
 * without it, pending and not theirs.
 */
export const mayDecide = (r: StaffRequest, own: Set<string>) =>
  r.status === "pending" && (r.can_decide ?? !isMine(r, own));

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
  const [cancelling, setCancelling] = useState<StaffRequest | null>(null);
  const own = useOwnEmployeeIds();
  const canFile = useAuthz().can(Cap.hrLeaveCreate);

  const requestsQ = useListRequests(
    {
      status: status === ALL ? undefined : status,
      kind: kind === ALL ? undefined : kind,
    },
    { query: dawamQuery() },
  );
  const rows = useMemo(() => requestsQ.data ?? [], [requestsQ.data]);

  const confirm = useConfirm();
  const quickDecide = async (r: StaffRequest, next: "approved" | "rejected") => {
    // Kinds that carry a pay decision get the dialog; the rest are one click.
    if (next === "approved" && ASKS_PAY.includes(r.kind)) {
      setDeciding(r);
      return;
    }
    if (next === "rejected") {
      const ok = await confirm({
        title: t("staff.rejectRequestTitle", { name: r.employee_name, defaultValue: `Reject ${r.employee_name}'s request?` }),
        description: t("staff.rejectRequestHint", "The day is treated as if no request was filed, so any lateness or absence penalty applies."),
        confirmLabel: t("common.reject", "Reject"),
        destructive: true,
      });
      if (!ok) return;
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
          <>
            <DawamRefreshButton />
            {/* Filing for someone is hr.leave.create; the server refuses anyone else (403). */}
            {canFile ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                {t("staff.newRequest", "New request")}
              </Button>
            ) : null}
          </>
        }
        below={
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
        }
      />

      {requestsQ.isLoading ? (
        <ListCard>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5">
              <Skeleton className="size-9 rounded-[10px]" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))}
        </ListCard>
      ) : requestsQ.error ? (
        <ErrorState
          title={t("staff.requestsLoadError", "Couldn't load requests")}
          message={getErrorMessage(requestsQ.error)}
          onRetry={() => void requestsQ.refetch()}
          retrying={requestsQ.isFetching}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={t("staff.noRequestsTitle", "No requests match these filters")}
          description={t(
            "staff.noRequestsHint",
            "Requests filed from the staff app land here for a decision.",
          )}
        />
      ) : (
        <ListCard>
          {rows.map((r) => {
            const meta = kindMeta(r.kind);
            const mine = isMine(r, own);
            // An approved correction already rewrote the punch: the server
            // refuses to cancel it (409), so it isn't offered.
            // Approved time in a closed month can't be cancelled either (month_closed).
            const live = r.status === "pending" || (r.status === "approved" && r.kind !== "correction" && !r.month_closed);
            return (
              <ListRow
                key={r.id}
                icon={meta.icon}
                title={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate">{r.employee_name}</span>
                    <Badge variant="secondary">{t(meta.labelKey, meta.fallback)}</Badge>
                    <RequestBadges r={r} mine={mine} />
                  </span>
                }
                meta={[describeWindow(r, t), r.reason, r.decision_note].filter(Boolean).join(" · ")}
                trailing={
                  <>
                    <StatusPill tone={REQUEST_STATUS_TONE[r.status] ?? "neutral"}>
                      {t(`staff.req_${r.status}`, r.status)}
                    </StatusPill>
                    {mayDecide(r, own) ? (
                      <>
                        {r.month_closed ? null : (
                          <Button size="sm" variant="outline" className="ms-2" onClick={() => void quickDecide(r, "approved")}>
                            <Check className="size-4" />
                            {t("common.approve", "Approve")}
                          </Button>
                        )}
                        <RowAction destructive label={t("common.reject", "Reject")} onClick={() => void quickDecide(r, "rejected")}>
                          <X className="size-4" />
                        </RowAction>
                      </>
                    ) : null}
                    {live ? (
                      <RowAction label={t("staff.cancelRequest", "Cancel request")} onClick={() => setCancelling(r)}>
                        <Ban className="size-4" />
                      </RowAction>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </ListCard>
      )}

      <NewRequestDialog open={addOpen} onOpenChange={setAddOpen} />
      <ApproveWithPayDialog key={deciding?.id} request={deciding} onOpenChange={(o) => !o && setDeciding(null)} />
      <CancelRequestDialog
        key={cancelling?.id}
        request={cancelling}
        mine={!!cancelling && isMine(cancelling, own)}
        onOpenChange={(o) => !o && setCancelling(null)}
      />
    </Page>
  );
}

/** What the server says about a request beyond its kind: unpaid, a half day,
 *  your own, waiting for the owner (RQ-5). */
export function RequestBadges({ r, mine }: { r: StaffRequest; mine: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {r.is_paid === false ? <Badge variant="outline">{t("staff.unpaidBadge", "unpaid")}</Badge> : null}
      {r.kind === "leave" && r.is_half_day ? (
        <Badge variant="outline">
          {r.leave_half === "second" ? t("staff.halfSecond", "½ day · second half") : t("staff.halfFirst", "½ day · first half")}
        </Badge>
      ) : null}
      {mine ? <Badge variant="outline">{t("staff.yourRequest", "Yours — decided above you")}</Badge> : null}
      {r.to_owner ? <Badge variant="outline">{t("staff.toOwner", "For the owner")}</Badge> : null}
      {/* A day of it is in an approved or paid month: approving is refused, rejecting isn't. */}
      {r.month_closed && r.status === "pending" ? (
        <Badge variant="outline">{t("staff.monthClosedRejectOnly", "Month closed: reject only")}</Badge>
      ) : null}
    </>
  );
}

/** "10 Sep → 12 Sep", "arriving by 10:00", "12:00–14:00 on 4 Sep",
 *  "in 09:12 → 09:00" for a correction against the record's punches. */
export function describeWindow(r: StaffRequest, t: TFunction): string {
  // Wall-clock times from the wire, in the same 12-hour style as fmtTime.
  const time = (s?: string | null) => (s ? fmtWireTime(s.slice(0, 5)) : "");
  switch (r.kind) {
    case "late_arrival":
      return t("staff.windowLate", "{{date}} · arriving by {{time}}", {
        date: fmtDate(r.on_date),
        time: time(r.to_time),
      });
    case "early_departure":
      return t("staff.windowEarly", "{{date}} · leaving at {{time}}", {
        date: fmtDate(r.on_date),
        time: time(r.from_time),
      });
    case "excuse":
      return t("staff.windowExcuse", "{{date}} · {{from}}–{{to}}", {
        date: fmtDate(r.on_date),
        from: time(r.from_time),
        to: time(r.to_time),
      });
    case "correction": {
      // What changes: the record's punch now → the proposed time (branch-local).
      const parts = [fmtDate(r.on_date)];
      if (r.from_time) {
        parts.push(t("staff.correctionIn", "in {{now}} → {{to}}", { now: fmtTime(r.record_check_in_at), to: time(r.from_time) }));
      }
      if (r.to_time) {
        parts.push(t("staff.correctionOut", "out {{now}} → {{to}}", { now: fmtTime(r.record_check_out_at), to: time(r.to_time) }));
      }
      return parts.join(" · ");
    }
    case "leave":
      if (r.is_half_day) {
        return t("staff.windowHalfDay", "{{date}} · half day", { date: fmtDate(r.on_date) });
      }
      return r.end_date && r.end_date !== r.on_date
        ? `${fmtDate(r.on_date)} → ${fmtDate(r.end_date)}`
        : fmtDate(r.on_date);
    default:
      return r.end_date && r.end_date !== r.on_date
        ? `${fmtDate(r.on_date)} → ${fmtDate(r.end_date)}`
        : fmtDate(r.on_date);
  }
}

/**
 * Approving leave, a permission or an early departure asks the one extra
 * question that matters: paid or not. It starts from the rule the server
 * sends (`paid_default`, branch then business, RQ-7); leave has no rule and
 * starts paid. Leave always sends the answer (the server requires it); a
 * window kind the approver didn't touch sends none, so the rule applies.
 */
export function ApproveWithPayDialog({
  request,
  onOpenChange,
}: {
  request: StaffRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const isLeave = request?.kind === "leave";
  const schema = z.object({ paid: z.boolean(), touched: z.boolean(), note: z.string().max(500) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { paid: request?.paid_default ?? true, touched: false, note: "" },
  });
  const paid = form.watch("paid");

  const approve = form.handleSubmit(async (v) => {
    if (!request) return;
    const sendPaid = isLeave || v.touched;
    try {
      await decideRequest(request.id, {
        status: "approved",
        ...(sendPaid ? { is_paid: v.paid } : {}),
        note: v.note.trim() || null,
      });
      toast.success(t("staff.decisionSaved", "Decision saved"));
      void invalidateRequests();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  });

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.approveRequest", "Approve request")}</DialogTitle>
          <DialogDescription>
            {request ? `${request.employee_name} · ${describeWindow(request, t)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form id="approve-pay" className="space-y-4" onSubmit={(e) => void approve(e)}>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="ap-paid">{isLeave ? t("staff.paidLeaveSwitch", "Paid leave") : t("staff.paidTime", "Paid time")}</Label>
              <p className="text-xs text-muted-foreground">
                {isLeave
                  ? t("staff.paidLeaveHint", "Off, the days are docked like an absence.")
                  : t(
                      "staff.paidTimeHint",
                      "On, the excused hours still count toward the day. Off, they are excused but unpaid.",
                    )}
              </p>
              {!isLeave && request?.paid_default != null ? (
                <p className="text-xs text-muted-foreground">
                  {request.paid_default
                    ? t("staff.ruleSaysPaid", "The rule says paid.")
                    : t("staff.ruleSaysUnpaid", "The rule says unpaid.")}
                </p>
              ) : null}
            </div>
            <Switch
              id="ap-paid"
              checked={paid}
              onCheckedChange={(v) => {
                form.setValue("paid", v);
                form.setValue("touched", true);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-note">{t("staff.note", "Note")}</Label>
            <Input id="ap-note" {...form.register("note")} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="submit" form="approve-pay" disabled={form.formState.isSubmitting}>
            {t("common.approve", "Approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Cancelling a request. Someone else's, or any approved one, needs a note
 * (AT-7); the server refuses it without one.
 */
export function CancelRequestDialog({
  request,
  mine,
  onOpenChange,
}: {
  request: StaffRequest | null;
  mine: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const noteRequired = !mine || request?.status === "approved";
  const schema = useMemo(
    () =>
      z.object({
        note: z.string().trim().max(500).refine((s) => !noteRequired || s.length > 0, {
          message: t("staff.cancelNoteRequired", "Say why it is cancelled"),
        }),
      }),
    [noteRequired, t],
  );
  const form = useForm<{ note: string }>({ resolver: zodResolver(schema), defaultValues: { note: "" } });
  useEffect(() => form.reset({ note: "" }), [request, form]);

  const submit = form.handleSubmit(async (v) => {
    if (!request) return;
    try {
      await decideRequest(request.id, { status: "cancelled", note: v.note.trim() || null });
      toast.success(t("staff.requestCancelled", "Request cancelled"));
      void invalidateRequests();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  });

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.cancelRequestTitle", "Cancel this request?")}</DialogTitle>
          <DialogDescription>
            {request ? `${request.employee_name} · ${describeWindow(request, t)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form id="cancel-request" className="space-y-1" onSubmit={(e) => void submit(e)}>
          <Label htmlFor="cr-note">{t("staff.cancelNote", "Why")}</Label>
          <Input id="cr-note" aria-invalid={!!form.formState.errors.note} {...form.register("note")} />
          {form.formState.errors.note ? (
            <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.back", "Back")}</Button>
          <Button type="submit" form="cancel-request" variant="destructive" disabled={form.formState.isSubmitting}>
            {t("staff.cancelRequest", "Cancel request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const newRequestSchema = (t: TFunction) =>
  z
    .object({
      kind: z.enum(["leave", "late_arrival", "early_departure", "excuse", "mission"]),
      employee_id: z.string().min(1, t("staff.pickEmployee", "Pick an employee")),
      on_date: z.string().min(1),
      end_date: z.string(),
      from_time: z.string(),
      to_time: z.string(),
      half_day: z.boolean(),
      leave_half: z.enum(["first", "second"]),
      /** Paid or unpaid — asked when the leave is approved as it is filed. */
      pay: z.enum(["", "paid", "unpaid"]),
      title: z.string().max(200),
      reason: z.string().max(500),
    })
    .superRefine((v, ctx) => {
      const span = v.kind === "mission" || (v.kind === "leave" && !v.half_day);
      if (span && v.end_date && v.end_date < v.on_date) {
        ctx.addIssue({ code: "custom", path: ["end_date"], message: t("staff.endBeforeStart", "The last day is before the first") });
      }
      if ((v.kind === "early_departure" || v.kind === "excuse") && !v.from_time) {
        ctx.addIssue({ code: "custom", path: ["from_time"], message: t("staff.timeNeeded", "Pick a time") });
      }
      if ((v.kind === "late_arrival" || v.kind === "excuse") && !v.to_time) {
        ctx.addIssue({ code: "custom", path: ["to_time"], message: t("staff.timeNeeded", "Pick a time") });
      }
      // The server takes the note as a mission's title; with neither it refuses.
      if (v.kind === "mission" && !v.title.trim() && !v.reason.trim()) {
        ctx.addIssue({ code: "custom", path: ["title"], message: t("staff.missionNeedsText", "Give the mission a title or a note") });
      }
    });

type NewRequestValues = z.infer<ReturnType<typeof newRequestSchema>>;

/** What the form sends. Leave has no type (RQ-2); a half day is one day. */
export function newRequestBody(v: NewRequestValues) {
  const half = v.kind === "leave" && v.half_day;
  const span = v.kind === "mission" || (v.kind === "leave" && !half);
  const hhmmss = (s: string) => (s.length === 5 ? `${s}:00` : s);
  return {
    employee_id: v.employee_id,
    kind: v.kind,
    on_date: v.on_date,
    end_date: span ? v.end_date || v.on_date : null,
    from_time: v.kind === "early_departure" || v.kind === "excuse" ? hhmmss(v.from_time) : null,
    to_time: v.kind === "late_arrival" || v.kind === "excuse" ? hhmmss(v.to_time) : null,
    ...(v.kind === "leave" ? { is_half_day: half, ...(half ? { leave_half: v.leave_half } : {}) } : {}),
    // A leave approved as it is filed carries its pay choice (RQ-2).
    ...(v.kind === "leave" && v.pay ? { is_paid: v.pay === "paid" } : {}),
    title: v.kind === "mission" ? v.title.trim() || null : null,
    reason: v.reason.trim() || null,
  };
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
  const schema = useMemo(() => newRequestSchema(t), [t]);
  const blank: NewRequestValues = {
    kind: "late_arrival", employee_id: "", on_date: todayIso(), end_date: todayIso(),
    from_time: "12:00", to_time: "14:00", half_day: false, leave_half: "first", pay: "", title: "", reason: "",
  };
  const form = useForm<NewRequestValues>({ resolver: zodResolver(schema), defaultValues: blank });
  const errors = form.formState.errors;
  const v = form.watch();
  useEffect(() => {
    if (open) form.reset({ ...blank, on_date: todayIso(), end_date: todayIso() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const employeesQ = useListEmployees({ employment_status: "active" }, { query: { enabled: open } });
  const authz = useAuthz();
  const userId = useAuthStore((s) => s.user?.id);

  const kind = v.kind;
  // Filing one's OWN leave while approving one's own requests: it is approved
  // as it is filed, with nobody to choose paid or unpaid — so the filer says
  // (RQ-2; the server refuses it otherwise, LEAVE_PAY_REQUIRED).
  const mine = (employeesQ.data ?? []).find((e) => e.id === v.employee_id)?.user_id;
  const needsPay =
    kind === "leave" && !!userId && mine === userId && authz.can(Cap.hrRequestsSelfApprove);
  const needsFrom = kind === "early_departure" || kind === "excuse";
  const needsTo = kind === "late_arrival" || kind === "excuse";
  const isSpan = kind === "mission" || (kind === "leave" && !v.half_day);

  const save = form.handleSubmit(async (values) => {
    if (needsPay && !values.pay) {
      form.setError("pay", { message: t("staff.payChoiceNeeded", "Say whether this leave is paid or unpaid") });
      return;
    }
    try {
      const row = await createRequestAdmin(newRequestBody(values));
      // The server decides whether it was approved as it was filed (RQ-5).
      toast.success(
        row?.status === "approved"
          ? t("staff.requestFiledApproved", "Request filed and approved")
          : t("staff.requestFiled", "Request filed"),
      );
      void invalidateRequests();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  });

  const err = (m?: string) => (m ? <p className="text-xs text-destructive">{m}</p> : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.newRequest", "New request")}</DialogTitle>
          <DialogDescription>
            {t("staff.newRequestHint", "Filed as pending — approve it separately.")}
          </DialogDescription>
        </DialogHeader>

        <form id="new-request" className="grid gap-3" onSubmit={(e) => void save(e)}>
          <div className="space-y-1">
            <Label>{t("staff.kind", "Kind")}</Label>
            <Select value={kind} onValueChange={(k) => form.setValue("kind", k as NewRequestValues["kind"])}>
              <SelectTrigger aria-label={t("staff.kind", "Kind")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILEABLE.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{t(k.labelKey, k.fallback)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("staff.employee", "Employee")}</Label>
            <Select value={v.employee_id} onValueChange={(id) => form.setValue("employee_id", id, { shouldValidate: true })}>
              <SelectTrigger aria-label={t("staff.employee", "Employee")}>
                <SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} />
              </SelectTrigger>
              <SelectContent>
                {(employeesQ.data ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err(errors.employee_id?.message)}
          </div>
          {kind === "leave" ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="nr-half">{t("staff.halfDayToggle", "Half a day")}</Label>
                <Switch id="nr-half" checked={v.half_day} onCheckedChange={(c) => form.setValue("half_day", c)} />
              </div>
              {v.half_day ? (
                <SegmentedControl
                  value={v.leave_half}
                  onChange={(h) => form.setValue("leave_half", h)}
                  options={[
                    { value: "first", label: t("staff.firstHalf", "First half") },
                    { value: "second", label: t("staff.secondHalf", "Second half") },
                  ]}
                />
              ) : null}
              {needsPay ? (
                <div className="space-y-1">
                  <Label>{t("staff.leavePayQuestion", "Paid or unpaid? It is approved as you file it.")}</Label>
                  <SegmentedControl
                    value={v.pay}
                    onChange={(p) => { form.setValue("pay", p); form.clearErrors("pay"); }}
                    options={[
                      { value: "paid", label: t("staff.paid", "Paid") },
                      { value: "unpaid", label: t("staff.unpaid", "Unpaid") },
                    ]}
                  />
                  {err(errors.pay?.message)}
                </div>
              ) : null}
            </div>
          ) : null}
          {kind === "mission" ? (
            <div className="space-y-1">
              <Label htmlFor="nr-title">{t("staff.missionTitleOptional", "Title (optional)")}</Label>
              <Input id="nr-title" {...form.register("title")} />
              {err(errors.title?.message)}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nr-date">{isSpan ? t("staff.from", "From") : t("staff.date", "Date")}</Label>
              <Input id="nr-date" type="date" {...form.register("on_date")} />
            </div>
            {isSpan ? (
              <div className="space-y-1">
                <Label htmlFor="nr-end">{t("staff.to", "To")}</Label>
                <Input id="nr-end" type="date" {...form.register("end_date")} />
                {err(errors.end_date?.message)}
              </div>
            ) : null}
            {needsFrom ? (
              <div className="space-y-1">
                <Label htmlFor="nr-from">
                  {kind === "early_departure"
                    ? t("staff.leavingAt", "Leaving at")
                    : t("staff.windowFrom", "From")}
                </Label>
                <Input id="nr-from" type="time" {...form.register("from_time")} />
                {err(errors.from_time?.message)}
              </div>
            ) : null}
            {needsTo ? (
              <div className="space-y-1">
                <Label htmlFor="nr-to">
                  {kind === "late_arrival"
                    ? t("staff.arrivingBy", "Arriving by")
                    : t("staff.windowTo", "To")}
                </Label>
                <Input id="nr-to" type="time" {...form.register("to_time")} />
                {err(errors.to_time?.message)}
              </div>
            ) : null}
          </div>
          {kind === "excuse" ? (
            <p className="text-xs text-muted-foreground">
              {t("staff.excuseMidnightHint", "An end before the start runs past midnight.")}
            </p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="nr-reason">{t("staff.reason", "Reason")}</Label>
            <Input id="nr-reason" {...form.register("reason")} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="submit" form="new-request" disabled={form.formState.isSubmitting || !v.employee_id}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
