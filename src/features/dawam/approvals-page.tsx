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
import { Skeleton } from "@/components/ui/skeleton";
import {
  decideAdjustment, decideClaim, decideCover, decideOvertime, decideRequest, decideSwap, reviewAdvance,
  useListAdjustments, useListAdvances, useListAttendance, useListOpenShifts, useListRequests, useListSwaps,
} from "@/data/api/generated/api";
import type { StaffRequest } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";
import { ApproveWithPayDialog, ASKS_PAY, describeWindow, kindMeta, mayDecide, RequestBadges, useOwnEmployeeIds } from "@/features/staff/requests-inbox";
import { fmtMinutes, invalidateStaff, isoDaysFromToday } from "@/features/staff/util";
import { ReviewAdvanceDialog } from "./money-dialogs";

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
  reject: () => Promise<unknown>;
}

export function ApprovalsPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const confirm = useConfirm();
  const [section, setSection] = useState<Section>("all");
  const [paying, setPaying] = useState<StaffRequest | null>(null);
  const [reviewing, setReviewing] = useState<Parameters<typeof ReviewAdvanceDialog>[0]["advance"]>(null);

  const can = {
    requests: authz.canAny(Cap.hrLeaveEdit, Cap.hrAttendanceEdit),
    advances: authz.can(Cap.hrAdvancesDecide),
    roster: authz.can(Cap.hrScheduleEdit),
    covers: authz.can(Cap.hrShiftCoverConfirm),
    overtime: authz.can(Cap.hrOvertimeApprove),
    payLines: authz.can(Cap.hrPayrollRun),
  };
  const any = Object.values(can).some(Boolean);
  const from = isoDaysFromToday(-35);
  const to = isoDaysFromToday(35);

  const requestsQ = useListRequests({ status: "pending" }, { query: { enabled: can.requests } });
  // A manager's own requests are decided above them (RQ-5): not in their queue.
  const own = useOwnEmployeeIds(can.requests);
  const advancesQ = useListAdvances({}, { query: { enabled: can.advances } });
  const swapsQ = useListSwaps({ status: "pending" }, { query: { enabled: can.roster } });
  const claimsQ = useListOpenShifts({ from, to }, { query: { enabled: can.roster } });
  const attendanceQ = useListAttendance({ from, to: isoDaysFromToday(0) }, { query: { enabled: can.covers || can.overtime } });
  const payLinesQ = useListAdjustments({ status: "pending" }, { query: { enabled: can.payLines } });
  // Each list stands on its own (DSH-1, PAGE-Approvals): one that fails —
  // a 403 on advances for a branch manager, say — is reported in its place,
  // and everything else still shows and can be decided.
  const sections: { key: string; label: string; q: { error: unknown; refetch: () => unknown } }[] = [
    { key: "requests", label: t("staff.requests", "Requests"), q: requestsQ },
    { key: "advances", label: t("dawam.salaryAdvances", "Salary advances"), q: advancesQ },
    { key: "swaps", label: t("dawam.swap", "Shift swap"), q: swapsQ },
    { key: "claims", label: t("dawam.openShiftClaim", "Open-shift claim"), q: claimsQ },
    { key: "attendance", label: t("dawam.overtime", "Overtime"), q: attendanceQ },
    { key: "payLines", label: t("dawam.payLines", "Bonuses & deductions"), q: payLinesQ },
  ];
  const queries = [requestsQ, advancesQ, swapsQ, claimsQ, attendanceQ, payLinesQ];
  const loading = queries.some((q) => q.isLoading);
  const failedSections = sections.filter((s) => s.q.error);

  const decided = () => {
    toast.success(t("staff.decisionSaved", "Decision saved"));
    void invalidateStaff();
  };
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      decided();
    } catch (e) {
      toast.error(getErrorMessage(e));
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
        detail: [describeWindow(r, t), r.reason].filter(Boolean).join(" · "),
        at: r.created_at,
        approve: asksPay ? () => setPaying(r) : () => decideRequest(r.id, { status: "approved" }),
        reject: () => decideRequest(r.id, { status: "rejected" }),
      });
    }
    for (const a of can.advances ? (advancesQ.data ?? []).filter((x) => x.status === "pending") : []) {
      out.push({
        key: `v|${a.id}`,
        section: "money",
        icon: HandCoins,
        who: a.employee_name ?? "—",
        kind: t("dawam.salaryAdvance", "Salary advance"),
        detail: [t("dawam.advanceMeta", { amount: fmtMoney(a.amount_piastres), count: a.installments }), a.reason].filter(Boolean).join(" · "),
        at: a.created_at,
        approve: () => setReviewing(a),
        reject: () => reviewAdvance(a.id, { approve: false }),
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
        reject: () => decideAdjustment(a.kind, a.id, { approve: false }),
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
      });
    }
    for (const r of attendanceQ.data ?? []) {
      if (can.covers && r.covered_employee_id && r.cover_status === "pending") {
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
        });
      }
      if (can.overtime && r.overtime_status === "pending") {
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
        });
      }
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsQ.data, own, advancesQ.data, payLinesQ.data, swapsQ.data, claimsQ.data, attendanceQ.data, t]);

  if (authz.ready && !any) {
    return <Restricted title={t("dawam.approvals", "Approvals")} who={t("dawam.approvalsNoAccess", "Nothing here is yours to decide. The owner can give you access.")} />;
  }

  const count = (s: Section) => (s === "all" ? items.length : items.filter((i) => i.section === s).length);
  const shown = section === "all" ? items : items.filter((i) => i.section === section);
  const label = (s: Section, text: string) => `${text} (${count(s)})`;

  const reject = async (i: Pending) => {
    const ok = await confirm({
      title: t("dawam.rejectTitle", { name: i.who, kind: i.kind, defaultValue: `Reject ${i.who}'s ${i.kind}?` }),
      description: t("dawam.rejectHint", "They are told, and nothing is paid or changed for it."),
      confirmLabel: t("common.reject", "Reject"),
      destructive: true,
    });
    if (ok) await run(i.reject);
  };

  return (
    <Page>
      <PageHeader
        title={t("dawam.approvals", "Approvals")}
        description={t("dawam.approvalsSubtitle", "Everything waiting on you, from requests to pay lines over a manager's limit.")}
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
        <ListCard>
          {shown.map((i) => (
            <ListRow
              key={i.key}
              icon={i.icon}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate">{i.who}</span>
                  <Badge variant="secondary">{i.kind}</Badge>
                  {i.badges}
                </span>
              }
              meta={i.detail}
              trailing={
                <span className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    const r = i.approve();
                    if (r instanceof Promise) void run(() => r);
                  }}>
                    <Check className="size-4" />{t("common.approve", "Approve")}
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={t("common.reject", "Reject")} onClick={() => void reject(i)}>
                    <X className="size-4" />
                  </Button>
                </span>
              }
            />
          ))}
        </ListCard>
      )}
      <ApproveWithPayDialog key={paying?.id} request={paying} onOpenChange={(o) => !o && setPaying(null)} />
      <ReviewAdvanceDialog key={reviewing?.id} advance={reviewing} onOpenChange={(o) => !o && setReviewing(null)} />
    </Page>
  );
}
