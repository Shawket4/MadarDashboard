/**
 * Approvals (Dawam app tab "Approvals", DSH-1): everything that waits on a
 * manager or the owner, in one queue — requests and corrections, salary
 * advances, covers, swaps, open-shift claims, overtime, and pay lines over a
 * manager's limit. Each kind shows only to someone who may decide it; the
 * server checks again.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight, CalendarPlus, Check, HandCoins, Inbox, ReceiptText, Timer, UserRoundCheck, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Restricted } from "@/components/app/restricted";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  decideAdjustment, decideClaim, decideCover, decideOvertime, decideRequest, decideSwap, reviewAdvance,
  useListAdjustments, useListAdvances, useListAttendance, useListOpenShifts, useListRequests, useListSwaps,
} from "@/data/api/generated/api";
import type { StaffRequest } from "@/data/api/generated/models";
import { getErrorMessage, isStaleRefusal } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";
import {
  ApproveWithPayDialog, approveMeans, ASKS_PAY, confirmMissionOverPunches, describeWindow, kindMeta, mayDecide, RequestBadges, useOwnEmployeeIds,
} from "@/features/staff/requests-inbox";
import { fmtHours, fmtMinutes, invalidateStaff, isoDaysFromToday } from "@/features/staff/util";
import { dawamQuery, failedEmpty } from "./live";
import { DawamRefreshButton } from "./refresh-button";
import { AdvanceCapNote, RejectDialog, ReviewAdvanceDialog } from "./money-dialogs";
import { capView, warningsOf } from "./phase-d";

/** An approval the approver backed out of: nothing was sent, nothing to say. */
const BACKED_OUT = Symbol("backed out");

export type Section = "all" | "requests" | "money" | "shifts";

/** One thing waiting, whatever its kind. */
export interface Pending {
  key: string;
  section: Exclude<Section, "all">;
  icon: LucideIcon;
  who: string;
  kind: string;
  /** Extra markers for a request row: half day, unpaid, for the owner. */
  badges?: ReactNode;
  detail: string;
  at: string;
  approve: () => Promise<unknown> | void;
  /** Its month is approved or paid: only a rejection goes through (month_closed). */
  rejectOnly?: boolean;
  /** Its month is closed and nothing about it can be decided any more. */
  locked?: boolean;
  /** A rejection that must say why (money, D8): its reason goes to the server. */
  reasonRequired?: boolean;
  /** A rejection that may say why (a request's note, shown to the requester). */
  reasonOptional?: boolean;
  reject: (reason?: string) => Promise<unknown>;
  /** What approving does, in plain words. */
  effect?: string;
  /** Approved in one step with nothing to ask, so it can go in a batch. */
  bulk?: () => Promise<unknown>;
}

export function ApprovalsPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const confirm = useConfirm();
  const [section, setSection] = useState<Section>("all");
  const [paying, setPaying] = useState<StaffRequest | null>(null);
  const [reviewing, setReviewing] = useState<Parameters<typeof ReviewAdvanceDialog>[0]["advance"]>(null);
  const [rejecting, setRejecting] = useState<Pending | null>(null);
  /** Rows ticked for a batch approval. */
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const can = {
    requests: authz.canAny(Cap.hrLeaveEdit, Cap.hrAttendanceEdit),
    advances: authz.can(Cap.hrAdvancesDecide),
    roster: authz.can(Cap.hrScheduleEdit),
    covers: authz.can(Cap.hrShiftCoverConfirm),
    overtime: authz.can(Cap.hrOvertimeApprove),
    payLines: authz.can(Cap.hrPayrollRun),
  };
  // The owner (payroll run everywhere) may pass the advance cap; a manager can't (D7).
  const mayPassCap = authz.canEverywhere(Cap.hrPayrollRun);
  const any = Object.values(can).some(Boolean);

  const requestsQ = useListRequests({ status: "pending" }, { query: dawamQuery({ enabled: can.requests }) });
  // A manager's own requests are decided above them (RQ-5): not in their queue.
  const own = useOwnEmployeeIds(can.requests);
  const advancesQ = useListAdvances({}, { query: dawamQuery({ enabled: can.advances }) });
  const swapsQ = useListSwaps({ status: "pending" }, { query: dawamQuery({ enabled: can.roster }) });
  // A claim can sit on any published week, however far ahead (O-8), and one
  // left undecided past its day stays in the queue too (a -35-day window lost it).
  const claimsQ = useListOpenShifts({ from: isoDaysFromToday(-366), to: isoDaysFromToday(366) }, { query: dawamQuery({ enabled: can.roster }) });
  // Every pending cover and overtime, however old (H2-B5): a 35-day window
  // dropped older ones out of every queue.
  const coversQ = useListAttendance({ cover_status: "pending" }, { query: dawamQuery({ enabled: can.covers }) });
  const overtimeQ = useListAttendance({ overtime_status: "pending" }, { query: dawamQuery({ enabled: can.overtime }) });
  const payLinesQ = useListAdjustments({ status: "pending" }, { query: dawamQuery({ enabled: can.payLines }) });
  // Each list stands on its own (DSH-1, PAGE-Approvals): one that fails —
  // a 403 on advances for a branch manager, say — is reported in its place,
  // and everything else still shows and can be decided.
  const sections: { key: string; label: string; q: { error: unknown; data: unknown; refetch: () => unknown } }[] = [
    { key: "requests", label: t("staff.requests", "Requests"), q: requestsQ },
    { key: "advances", label: t("dawam.salaryAdvances", "Salary advances"), q: advancesQ },
    { key: "swaps", label: t("dawam.swap", "Shift swap"), q: swapsQ },
    { key: "claims", label: t("dawam.openShiftClaim", "Open-shift claim"), q: claimsQ },
    { key: "covers", label: t("dawam.cover", "Cover"), q: coversQ },
    { key: "overtime", label: t("dawam.overtime", "Overtime"), q: overtimeQ },
    { key: "payLines", label: t("dawam.payLines", "Bonuses & deductions"), q: payLinesQ },
  ];
  const queries = [requestsQ, advancesQ, swapsQ, claimsQ, coversQ, overtimeQ, payLinesQ];
  const loading = queries.some((q) => q.isLoading);
  const failedSections = sections.filter((s) => failedEmpty(s.q));

  const decided = () => {
    toast.success(t("staff.decisionSaved", "Decision saved"));
    void invalidateStaff();
  };
  /** The item being decided: its buttons wait, so a double click sends once (H2-D10). */
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown> | void) => {
    if (busy) return;
    setBusy(key);
    try {
      const r = fn();
      if (r instanceof Promise) {
        const out = await r;
        if (out === BACKED_OUT) return;
        decided();
        // A claim that makes a long day passes a labour limit: said, never blocked (RU-13, M26).
        for (const w of warningsOf(out)) {
          toast.warning(
            t("dawam.limitWarning", {
              limit: t(`dawam.warn_${w.kind}`, w.kind),
              minutes: fmtHours(w.minutes),
              cap: fmtHours(w.limit_minutes),
              defaultValue: "{{limit}}: {{minutes}} of {{cap}}. Only a warning.",
            }),
          );
        }
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      // Decided by someone else first: the queue reads again (H2-B2).
      if (isStaleRefusal(e)) void invalidateStaff();
    } finally {
      setBusy(null);
    }
  };

  const items: Pending[] = useMemo(() => {
    const out: Pending[] = [];
    for (const r of can.requests ? requestsQ.data ?? [] : []) {
      // Only what the server says this caller may decide (RQ-5, `can_decide`).
      if (!mayDecide(r, own)) continue;
      const meta = kindMeta(r.kind);
      const asksPay = ASKS_PAY.includes(r.kind);
      out.push({
        key: `q|${r.id}`,
        section: "requests",
        icon: meta.icon,
        who: r.employee_name ?? "—",
        kind: t(meta.labelKey, meta.fallback),
        badges: <RequestBadges r={r} mine={false} />,
        detail: [describeWindow(r, t), r.title, r.reason].filter(Boolean).join(" · "),
        at: r.created_at,
        approve: asksPay
          ? () => setPaying(r)
          : async () => ((await confirmMissionOverPunches(r, confirm, t)) ? decideRequest(r.id, { status: "approved" }) : BACKED_OUT),
        rejectOnly: !!r.month_closed,
        reasonOptional: true,
        reject: (reason) => decideRequest(r.id, { status: "rejected", note: reason?.trim() || null }),
        effect: approveMeans(r, t),
        // A pay question or a mission over worked days needs its own look: never batched.
        bulk: asksPay || r.kind === "mission" || r.month_closed ? undefined : () => decideRequest(r.id, { status: "approved" }),
      });
    }
    for (const a of can.advances ? (advancesQ.data ?? []).filter((x) => x.status === "pending") : []) {
      // Over the cap, only the owner can approve: a manager may still reject (D7).
      const overForMe = capView(a).within === false && !mayPassCap;
      out.push({
        key: `v|${a.id}`,
        section: "money",
        icon: HandCoins,
        who: a.employee_name ?? "—",
        kind: t("dawam.salaryAdvance", "Salary advance"),
        detail: [t("dawam.advanceMeta", { amount: fmtMoney(a.amount_piastres), count: a.installments }), a.reason].filter(Boolean).join(" · "),
        at: a.created_at,
        badges: <AdvanceCapNote advance={a} mayPassCap={mayPassCap} />,
        approve: () => setReviewing(a),
        rejectOnly: overForMe,
        reasonRequired: true,
        reject: (reason) => reviewAdvance(a.id, { approve: false, reason }),
        effect: t("dawamOps.meansAdvance", "Approving: you set the amount and installments; it is paid back from salary."),
      });
    }
    for (const a of can.payLines ? payLinesQ.data ?? [] : []) {
      out.push({
        key: `a|${a.kind}|${a.id}`,
        section: "money",
        icon: ReceiptText,
        who: a.employee_name,
        kind: a.kind === "bonus" ? t("dawam.bonusOverLimit", "Bonus over the limit") : t("dawam.deductionOverLimit", "Deduction over the limit"),
        detail: [a.percent_of_base != null ? `${a.percent_of_base}%` : fmtMoney(a.amount_piastres ?? 0), a.reason].join(" · "),
        at: a.created_at,
        approve: () => decideAdjustment(a.kind, a.id, { approve: true }),
        reasonRequired: true,
        reject: (reason) => decideAdjustment(a.kind, a.id, { approve: false, reason }),
        effect: a.kind === "bonus"
          ? t("dawamOps.meansBonus", "Approving: the bonus goes on their payslip.")
          : t("dawamOps.meansDeduction", "Approving: the deduction comes off their payslip."),
      });
    }
    for (const s of can.roster ? swapsQ.data ?? [] : []) {
      out.push({
        key: `w|${s.id}`,
        section: "shifts",
        icon: ArrowLeftRight,
        who: `${s.requester_name} ↔ ${s.peer_name}`,
        kind: t("dawam.swap", "Shift swap"),
        detail: `${s.requester_shift_name} ${fmtDate(s.requester_date)} ↔ ${s.peer_shift_name} ${fmtDate(s.peer_date)}`,
        at: s.created_at,
        approve: () => decideSwap(s.id, { approve: true }),
        reject: () => decideSwap(s.id, { approve: false }),
        effect: t("dawamOps.meansSwap", "Approving: the two swap these shifts on the schedule, and both are told."),
        bulk: () => decideSwap(s.id, { approve: true }),
      });
    }
    for (const o of can.roster ? (claimsQ.data ?? []).filter((x) => x.status === "claimed") : []) {
      out.push({
        key: `o|${o.id}`,
        section: "shifts",
        icon: CalendarPlus,
        who: o.claimed_by_name ?? "—",
        kind: t("dawam.openShiftClaim", "Open-shift claim"),
        detail: `${o.shift_name} · ${fmtDate(o.on_date)}`,
        at: o.on_date,
        approve: () => decideClaim(o.id, { approve: true }),
        reject: () => decideClaim(o.id, { approve: false }),
        effect: t("dawamOps.meansClaim", "Approving: the open shift goes on their schedule."),
        bulk: () => decideClaim(o.id, { approve: true }),
      });
    }
    for (const r of can.covers ? coversQ.data ?? [] : []) {
      if (r.covered_employee_id && r.cover_status === "pending") {
        out.push({
          key: `c|${r.id}`,
          section: "shifts",
          icon: UserRoundCheck,
          who: r.employee_name ?? "—",
          kind: t("dawam.cover", "Cover"),
          detail: t("dawam.coverDetail", {
            shift: r.work_shift_name ?? "",
            date: fmtDate(r.business_date),
            from: fmtTime(r.check_in_at),
            defaultValue: `${r.work_shift_name ?? ""} · ${fmtDate(r.business_date)} · from ${fmtTime(r.check_in_at)}`,
          }),
          at: r.check_in_at ?? r.created_at,
          approve: () => decideCover(r.id, { approve: true }),
          reject: () => decideCover(r.id, { approve: false }),
          effect: t("dawamOps.meansCover", "Approving: they are paid for covering this shift."),
          bulk: r.month_closed ? undefined : () => decideCover(r.id, { approve: true }),
          // A closed month can't take a confirmed cover; rejecting one still goes through.
          rejectOnly: !!r.month_closed,
          badges: r.month_closed ? <ClosedMonthNote /> : undefined,
        });
      }
    }
    for (const r of can.overtime ? overtimeQ.data ?? [] : []) {
      if (r.overtime_status === "pending") {
        out.push({
          key: `t|${r.id}`,
          section: "shifts",
          icon: Timer,
          who: r.employee_name ?? "—",
          kind: t("dawam.overtime", "Overtime"),
          detail: `${fmtMinutes(r.overtime_minutes)} · ${fmtDate(r.business_date)}`,
          at: r.check_out_at ?? r.created_at,
          approve: () => decideOvertime(r.id, { approve: true }),
          reject: () => decideOvertime(r.id, { approve: false }),
          effect: t("dawamOps.meansOvertime", "Approving: this overtime is paid with the month."),
          bulk: r.month_closed ? undefined : () => decideOvertime(r.id, { approve: true }),
          // A closed month takes no new pay; rejecting moves none, so it goes through (owner decision 32).
          rejectOnly: !!r.month_closed,
          badges: r.month_closed ? <ClosedMonthNote /> : undefined,
        });
      }
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsQ.data, own, advancesQ.data, payLinesQ.data, swapsQ.data, claimsQ.data, coversQ.data, overtimeQ.data, t, mayPassCap]);

  if (authz.ready && !any) {
    return <Restricted title={t("dawam.approvals", "Approvals")} who={t("dawam.approvalsNoAccess", "Nothing here is yours to decide. The owner can give you access.")} />;
  }

  const count = (s: Section) => (s === "all" ? items.length : items.filter((i) => i.section === s).length);
  const shown = section === "all" ? items : items.filter((i) => i.section === section);
  const batchable = shown.filter((i) => i.bulk && !i.rejectOnly && !i.locked);
  const picked = batchable.filter((i) => selected.has(i.key));
  const toggle = (key: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  /**
   * Approve what was ticked, one by one: only kinds that ask nothing more
   * (no pay choice, no money review, no mission over worked days). Each
   * failure is said with its reason and stays in the queue.
   */
  const approvePicked = async () => {
    if (busy || picked.length === 0) return;
    const ok = await confirm({
      title: t("dawamOps.bulkTitle", { count: picked.length, defaultValue: "Approve {{count}} items?" }),
      description: `${picked.map((i) => `${i.who} · ${i.kind}`).join(t("common.listSeparator", ", "))}. ${t("dawamOps.bulkHint", "Each person is told. Anything that fails stays in the queue and says why.")}`,
      confirmLabel: t("dawamOps.approveCount", { count: picked.length, defaultValue: "Approve {{count}}" }),
    });
    if (!ok) return;
    setBusy("bulk");
    let done = 0;
    const failed: string[] = [];
    for (const i of picked) {
      try {
        const out = await i.bulk!();
        done++;
        for (const w of warningsOf(out)) {
          toast.warning(t("dawam.limitWarning", {
            limit: t(`dawam.warn_${w.kind}`, w.kind), minutes: fmtHours(w.minutes), cap: fmtHours(w.limit_minutes),
            defaultValue: "{{limit}}: {{minutes}} of {{cap}}. Only a warning.",
          }));
        }
      } catch (e) {
        failed.push(`${i.who}: ${getErrorMessage(e)}`);
      }
    }
    setBusy(null);
    setSelected(new Set());
    if (done) toast.success(t("dawamOps.bulkDone", { count: done, defaultValue: "{{count}} approved" }));
    if (failed.length) {
      toast.error(t("dawamOps.bulkFailed", { count: failed.length, first: failed[0], defaultValue: "{{count}} not approved. {{first}}" }));
    }
    void invalidateStaff();
  };
  const label = (s: Section, text: string) => `${text} (${count(s)})`;

  const reject = async (i: Pending) => {
    // Money says why it was refused (D8); a request may say why (its note); the rest confirms.
    if (i.reasonRequired || i.reasonOptional) {
      setRejecting(i);
      return;
    }
    const ok = await confirm({
      title: t("dawam.rejectTitle", { name: i.who, kind: i.kind, defaultValue: `Reject ${i.who}'s ${i.kind}?` }),
      // A rejected request leaves the day as if nothing was filed, so its
      // lateness or absence is charged; anything else just isn't paid.
      description: i.section === "requests"
        ? t("staff.rejectRequestHint", "The day is treated as if no request was filed, so any lateness or absence penalty applies.")
        : t("dawam.rejectHint", "They are told, and nothing is paid or changed for it."),
      confirmLabel: t("common.reject", "Reject"),
      destructive: true,
    });
    if (ok) await run(i.key, i.reject);
  };

  return (
    <Page>
      <PageHeader
        title={t("dawam.approvals", "Approvals")}
        description={t("dawam.approvalsSubtitle", "Everything waiting on you, from requests to pay lines over a manager's limit.")}
        actions={<DawamRefreshButton />}
        below={
          <SegmentedControl
            value={section}
            onChange={setSection}
            options={[
              { value: "all", label: label("all", t("dawam.all", "All")) },
              { value: "requests", label: label("requests", t("staff.requests", "Requests")) },
              { value: "money", label: label("money", t("dawam.money", "Money")) },
              { value: "shifts", label: label("shifts", t("dawam.shifts", "Shifts")) },
            ]}
          />
        }
      />
      {failedSections.map((s) => (
        <ErrorState
          key={s.key}
          title={t("dawam.sectionLoadError", { section: s.label, defaultValue: `Couldn't load ${s.label}` })}
          message={getErrorMessage(s.q.error)}
          onRetry={() => void s.q.refetch()}
        />
      ))}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : shown.length === 0 ? (
        <EmptyState icon={Inbox} title={t("dawam.nothingWaiting", "Nothing is waiting on you")} description={t("dawam.nothingWaitingHint", "New requests, covers, swaps and claims land here.")} />
      ) : (
        <div className="space-y-2">
          {batchable.length > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2 sm:px-5">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={picked.length === batchable.length ? true : picked.length > 0 ? "indeterminate" : false}
                  onCheckedChange={(on) => setSelected(on === true ? new Set(batchable.map((i) => i.key)) : new Set())}
                />
                <span>
                  {t("dawamOps.selectAll", { count: batchable.length, defaultValue: "Select the {{count}} that need no extra answer" })}
                </span>
              </label>
              <span className="flex items-center gap-2">
                {picked.length === 0 ? (
                  <span className="text-xs text-muted-foreground">{t("dawamOps.pickToBatch", "Tick items to approve them together.")}</span>
                ) : null}
                <Button size="sm" disabled={picked.length === 0 || !!busy} loading={busy === "bulk"} onClick={() => void approvePicked()}>
                  <Check className="size-4" />
                  {t("dawamOps.approveCount", { count: picked.length, defaultValue: "Approve {{count}}" })}
                </Button>
              </span>
            </div>
          ) : null}
          <ListCard>
            {shown.map((i) => {
              const canBatch = batchable.length > 1 && batchable.includes(i);
              return (
                <ListRow
                  key={i.key}
                  icon={i.icon}
                  leading={batchable.length > 1 ? (
                    <span className="flex shrink-0 items-center gap-3">
                      {canBatch ? (
                        <Checkbox
                          checked={selected.has(i.key)}
                          onCheckedChange={(on) => toggle(i.key, on === true)}
                          aria-label={t("dawamOps.selectItem", { name: i.who, kind: i.kind, defaultValue: "Select {{name}}'s {{kind}}" })}
                        />
                      ) : (
                        <span className="size-4" aria-hidden />
                      )}
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-secondary text-muted-foreground">
                        <i.icon className="size-4" />
                      </span>
                    </span>
                  ) : undefined}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate">{i.who}</span>
                      <Badge variant="secondary">{i.kind}</Badge>
                      {i.badges}
                    </span>
                  }
                  wrapMeta
                  meta={
                    <>
                      {i.detail}
                      {i.effect && !i.rejectOnly ? <span className="mt-0.5 block text-xs text-foreground/80">{i.effect}</span> : null}
                    </>
                  }
                  trailing={
                    i.locked ? undefined : <span className="flex items-center gap-1">
                      {i.rejectOnly ? null : (
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void run(i.key, i.approve)}>
                          <Check className="size-4" />{t("common.approve", "Approve")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={!!busy} aria-label={t("common.reject", "Reject")} onClick={() => void reject(i)}>
                        <X className="size-4" /><span className="hidden sm:inline">{t("common.reject", "Reject")}</span>
                      </Button>
                    </span>
                  }
                />
              );
            })}
          </ListCard>
        </div>
      )}
      <ApproveWithPayDialog key={paying?.id} request={paying} onOpenChange={(o) => !o && setPaying(null)} />
      <ReviewAdvanceDialog key={reviewing?.id} advance={reviewing} onOpenChange={(o) => !o && setReviewing(null)} />
      <RejectDialog
        key={rejecting?.key}
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title={rejecting ? t("dawam.rejectTitle", { name: rejecting.who, kind: rejecting.kind, defaultValue: `Reject ${rejecting.who}'s ${rejecting.kind}?` }) : ""}
        description={rejecting?.section === "requests"
          ? t("staff.rejectRequestHint", "The day is treated as if no request was filed, so any lateness or absence penalty applies.")
          : t("dawam.rejectWhyHint", "They are told, with your reason, and nothing is paid for it. The reason is kept in the audit log.")}
        optional={!!rejecting?.reasonOptional}
        onReject={(reason) => rejecting!.reject(reason)}
      />
    </Page>
  );
}

/** A cover or overtime in an approved or paid month: reject it, or pay it as a line next month (owner decision 32). */
function ClosedMonthNote() {
  const { t } = useTranslation();
  return (
    <>
      <Badge variant="outline">{t("staff.monthClosedRejectOnly", "Month closed: reject only")}</Badge>
      <span className="basis-full text-xs font-normal text-muted-foreground">
        {t("dawam.closedMonthNextLine", "To pay it, add it as a line in next month.")}
      </span>
    </>
  );
}

