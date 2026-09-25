/**
 * Team (Dawam app tab "Team", DSH-1): who is in, late, absent or on leave
 * right now at my branches, the flags the 15-minute pings raised (left
 * mid-shift, suspicious location, tracking off, time unverified, new phone,
 * cover) with what a manager can do about each (CL-6, CL-7), and punching for
 * someone whose phone died (CL-13).
 */
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  BatteryLow, CircleAlert, Clock3, FileSpreadsheet, LogIn, MapPinOff, ReceiptText, ShieldAlert, Smartphone, TimerOff, UserRoundCheck, UserRoundPlus,
  UsersRound, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { Restricted } from "@/components/app/restricted";
import { StatCard } from "@/components/app/stat-card";
import { StatusPill, type StatusTone } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { punchFor, resolveFlag, useListAttendance, useListAttendanceFlags, useTeamPresence } from "@/data/api/generated/api";
import type { AttendanceFlag, PresenceRow } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { RulesFirstBanner } from "./rules-banner";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { fmtDateTime, fmtMoney, fmtTime } from "@/lib/format";
import { coveredBy, fmtMinutes, invalidateStaff } from "@/features/staff/util";
import { AdjustmentDialog, ExpenseAdvanceDialog, readPounds } from "./money-dialogs";
import { AddEmployeeDialog, ImportPeopleDialog } from "./add-employees";
import { useOwnEmployeeIds } from "@/features/staff/requests-inbox";
import { punchWindowOpen, type PresenceRowD } from "./phase-d-contract";

const STATE_LABEL: Record<string, string> = {
  in: "In", late: "Late", absent: "Absent", on_leave: "On leave", off: "Off", done: "Done",
};

const STATE_TONE: Record<string, StatusTone> = {
  in: "success", late: "warning", absent: "danger", on_leave: "info", off: "neutral", done: "neutral",
};

export const FLAG_META: Record<string, { icon: LucideIcon; labelKey: string; fallback: string }> = {
  left_mid_shift: { icon: MapPinOff, labelKey: "dawam.flag_left_mid_shift", fallback: "Left mid-shift" },
  suspicious: { icon: ShieldAlert, labelKey: "dawam.flag_suspicious", fallback: "Location looks spoofed" },
  tracking_off: { icon: TimerOff, labelKey: "dawam.flag_tracking_off", fallback: "Tracking off" },
  time_unverified: { icon: Clock3, labelKey: "dawam.flag_time_unverified", fallback: "Time unverified" },
  new_phone: { icon: Smartphone, labelKey: "dawam.flag_new_phone", fallback: "New phone" },
  cover: { icon: UserRoundCheck, labelKey: "dawam.flag_cover", fallback: "Cover" },
  phone_died: { icon: BatteryLow, labelKey: "dawam.flag_phone_died", fallback: "Phone likely died" },
};

export function TeamPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const { branchId } = useScope();
  const canRead = authz.can(Cap.hrAttendanceRead);
  const canPunch = authz.can(Cap.hrAttendancePunchOthers);
  const canResolve = authz.can(Cap.hrAttendanceEdit);
  const [flag, setFlag] = useState<AttendanceFlag | null>(null);
  const [punching, setPunching] = useState<PresenceRow | null>(null);
  const [adding, setAdding] = useState<"one" | "sheet" | null>(null);
  const canCreate = authz.can(Cap.hrStaffCreate);
  // Money a branch manager handles from here, without the Payroll page (DSH-1).
  const canPayLine = authz.canAny(Cap.hrAdjustmentsCreate, Cap.hrDeductionsCreate);
  const canExpense = authz.can(Cap.hrExpenseAdvancesLog);
  const [money, setMoney] = useState<"line" | "expense" | null>(null);

  const presenceQ = useTeamPresence({ branch_id: branchId ?? undefined }, { query: { enabled: canRead, refetchInterval: 60_000 } });
  const flagsQ = useListAttendanceFlags({ branch_id: branchId ?? undefined }, { query: { enabled: canRead } });
  const rows = useMemo(() => presenceQ.data?.rows ?? [], [presenceQ.data]);
  // Today's records say whose shift a colleague is covering: that punch is refused (D1).
  const today = presenceQ.data?.business_date;
  const todayQ = useListAttendance(
    { from: today ?? "", to: today ?? "", branch_id: branchId ?? undefined },
    { query: { enabled: canPunch && !!today } },
  );
  const todayRecords = useMemo(() => todayQ.data ?? [], [todayQ.data]);
  const flags = useMemo(() => (flagsQ.data ?? []).filter((f) => !f.resolution), [flagsQ.data]);

  if (authz.ready && !canRead) {
    return <Restricted title={t("dawam.team", "Team")} who={t("dawam.teamNoAccess", "The team board needs attendance rights. The owner can give you access.")} />;
  }
  const p = presenceQ.data;

  return (
    <Page>
      <PageHeader
        title={t("dawam.team", "Team")}
        description={t("dawam.teamSubtitle", "Who's in right now, and what the location pings noticed.")}
        actions={
          canCreate || canPayLine || canExpense ? (
            <div className="flex flex-wrap gap-2">
              {canPayLine ? <Button variant="outline" onClick={() => setMoney("line")}><ReceiptText className="size-4" />{t("dawam.addPayLineHere", "Add a bonus or deduction")}</Button> : null}
              {canExpense ? <Button variant="outline" onClick={() => setMoney("expense")}><Wallet className="size-4" />{t("dawam.logExpense", "Log an expense advance")}</Button> : null}
              {canCreate ? <Button variant="outline" onClick={() => setAdding("sheet")}><FileSpreadsheet className="size-4" />{t("dawam.importTitle", "Import from a spreadsheet")}</Button> : null}
              {canCreate ? <Button onClick={() => setAdding("one")}><UserRoundPlus className="size-4" />{t("dawam.addEmployee", "Add employee")}</Button> : null}
            </div>
          ) : undefined
        }
      />
      <RulesFirstBanner />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dawam.stateIn", "In")} value={p?.present ?? 0} formatType="number" icon={UsersRound} accent="success" loading={presenceQ.isLoading} />
        <StatCard label={t("dawam.stateLate", "Late")} value={p?.late ?? 0} formatType="number" icon={Clock3} accent="warning" loading={presenceQ.isLoading} />
        <StatCard label={t("dawam.stateAbsent", "Absent")} value={p?.absent ?? 0} formatType="number" icon={CircleAlert} accent="destructive" loading={presenceQ.isLoading} />
        <StatCard label={t("dawam.openFlags", "Open flags")} value={flags.length} formatType="number" icon={ShieldAlert} loading={flagsQ.isLoading} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("dawam.flags", "Flags")}</h2>
        {flagsQ.error ? (
          <ErrorState title={t("dawam.flagsLoadError", "Couldn't load the flags")} message={getErrorMessage(flagsQ.error)} onRetry={() => void flagsQ.refetch()} />
        ) : flagsQ.isLoading ? <Skeleton className="h-24 w-full rounded-2xl" /> : flags.length === 0 ? (
          <EmptyState icon={ShieldAlert} title={t("dawam.noFlags", "No open flags")} description={t("dawam.noFlagsHint", "Leaving mid-shift, spoofed locations and new phones show up here.")} />
        ) : (
          <ListCard>
            {flags.map((f) => {
              const meta = FLAG_META[f.kind] ?? FLAG_META.suspicious;
              return (
                <ListRow
                  key={f.id}
                  icon={meta.icon}
                  variant="nav"
                  title={`${f.employee_name} · ${t(meta.labelKey, meta.fallback)}`}
                  meta={[fmtDateTime(f.detected_at), f.minutes_away ? t("dawam.minutesAway", { m: f.minutes_away, defaultValue: `${f.minutes_away} min away` }) : null].filter(Boolean).join(" · ")}
                  onClick={canResolve ? () => setFlag(f) : undefined}
                />
              );
            })}
          </ListCard>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("dawam.rightNow", "Right now")}{p?.business_date ? ` · ${p.business_date}` : ""}
        </h2>
        {presenceQ.error ? (
          <ErrorState title={t("dawam.teamLoadError", "Couldn't load the team")} message={getErrorMessage(presenceQ.error)} onRetry={() => void presenceQ.refetch()} />
        ) : presenceQ.isLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : rows.length === 0 ? (
          <EmptyState icon={UsersRound} title={t("dawam.nobodyRostered", "Nobody is rostered today")} />
        ) : (
          <ListCard>
            {rows.map((r) => (
              <ListRow
                key={r.employee_id}
                title={r.employee_name}
                meta={[
                  r.branch_name,
                  r.check_in_at ? t("dawam.inAt", { time: fmtTime(r.check_in_at), defaultValue: `in ${fmtTime(r.check_in_at)}` }) : null,
                  r.late_minutes > 0 ? t("dawam.lateBy", { m: fmtMinutes(r.late_minutes), defaultValue: `late ${fmtMinutes(r.late_minutes)}` }) : null,
                ].filter(Boolean).join(" · ")}
                trailing={(() => {
                  const out = !!r.check_in_at && !r.check_out_at;
                  const coverer = !out && today ? coveredBy(todayRecords, r.employee_id, today) : null;
                  return (
                    <span className="flex flex-wrap items-center justify-end gap-2">
                      <StatusPill tone={STATE_TONE[r.state] ?? "neutral"}>{t(`dawam.state_${r.state}`, STATE_LABEL[r.state] ?? r.state)}</StatusPill>
                      {coverer ? (
                        <span className="text-xs text-muted-foreground">{t("dawam.coveredBy", { name: coverer, defaultValue: `Covered by ${coverer}` })}</span>
                      ) : null}
                      {canPunch && (["in", "late", "absent"].includes(r.state) || punchWindowOpen(r as PresenceRowD)) ? (
                        <Button size="sm" variant="outline" disabled={!!coverer} onClick={() => setPunching(r)}>
                          <LogIn className="size-4" />
                          {out ? t("dawam.punchOut", "Punch out") : t("dawam.punchIn", "Punch in")}
                        </Button>
                      ) : null}
                    </span>
                  );
                })()}
              />
            ))}
          </ListCard>
        )}
      </section>

      <FlagDialog key={flag?.id} flag={flag} onOpenChange={(o) => !o && setFlag(null)} />
      {adding === "one" ? <AddEmployeeDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
      {adding === "sheet" ? <ImportPeopleDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
      <PunchDialog key={punching?.employee_id} person={punching} onOpenChange={(o) => !o && setPunching(null)} />
      <AdjustmentDialog key={`line-${money === "line"}`} open={money === "line"} onOpenChange={(o) => !o && setMoney(null)} />
      <ExpenseAdvanceDialog key={`exp-${money === "expense"}`} open={money === "expense"} onOpenChange={(o) => !o && setMoney(null)} />
    </Page>
  );
}

/** What a manager does with a flag. Nothing is charged automatically (CL-6). */
function FlagDialog({ flag, onOpenChange }: { flag: AttendanceFlag | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  // Each act on its own right, as the server checks it (PM-4): a deduction
  // (or an unpaid excuse, which deducts) is hr.deductions.create — or asking
  // the owner for one; a cover is hr.shift_cover.confirm; a phone sign-out is
  // hr.staff.edit. Handling the flag at all is hr.attendance.edit.
  const authz = useAuthz();
  const canDeduct = authz.can(Cap.hrDeductionsCreate) || authz.canAsk(Cap.hrDeductionsCreate);
  // Above this, or only by asking, the deduction waits for the owner (AD-5, M33).
  const deductLimit = authz.limitsOf(Cap.hrDeductionsCreate)?.max_amount ?? null;
  const deductWaits = (piastres: number) =>
    !authz.can(Cap.hrDeductionsCreate) || (deductLimit != null && piastres > deductLimit);
  const canConfirmCover = authz.can(Cap.hrShiftCoverConfirm);
  const canRevoke = authz.can(Cap.hrStaffEdit);
  // Nobody decides their own flag (server 403 OWN_DECISION): nothing is offered.
  const own = useOwnEmployeeIds(!!flag);
  const mine = !!flag && own.has(flag.employee_id);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  // The typed deduction (CL-7), prefilled with the server's suggestion.
  const schema = useMemo(
    () => z.object({ amount: z.string().refine((v) => readPounds(v) !== null, t("dawam.badAmount", "Type an amount above zero")) }),
    [t],
  );
  const form = useForm<{ amount: string }>({
    resolver: zodResolver(schema),
    defaultValues: { amount: flag ? String(flag.suggested_deduction_piastres / 100) : "" },
  });
  if (!flag) return null;
  const meta = FLAG_META[flag.kind] ?? FLAG_META.suspicious;
  const send = async (action: string, amountPiastres?: number) => {
    setBusy(true);
    try {
      // A deduction is a pay line the employee reads: it carries why (AD-9).
      await resolveFlag(flag.id, { action, amount_piastres: amountPiastres ?? null, reason: action === "deduct" ? reason.trim() || null : null });
      // The flag's reply doesn't say, but the limit does: over it, the line waits for the owner.
      if (action === "deduct" && amountPiastres != null && deductWaits(amountPiastres)) {
        toast.info(t("dawam.payLinePending", "Over your limit: it waits for the owner before it counts."));
      } else {
        toast.success(t("dawam.flagHandled", "Flag handled"));
      }
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const onDeduct = form.handleSubmit((v) => send("deduct", readPounds(v.amount)!));
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`${flag.employee_name} · ${t(meta.labelKey, meta.fallback)}`}</DialogTitle>
          <DialogDescription>{t(`dawam.flagHint_${flag.kind}`, { m: flag.minutes_away, defaultValue: flagHint(flag) })}</DialogDescription>
        </DialogHeader>
        {mine ? (
          <p className="text-sm text-muted-foreground">{t("dawam.ownFlag", "Someone else decides your own flags: the owner, or a manager above you.")}</p>
        ) : null}
        {!mine && flag.kind === "left_mid_shift" ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={busy} onClick={() => void send("excuse_paid")}>{t("dawam.excusePaid", "Excuse, paid")}</Button>
              {canDeduct ? (
                <Button variant="outline" disabled={busy} onClick={() => void send("excuse_unpaid")}>{t("dawam.excuseUnpaid", "Excuse, unpaid")}</Button>
              ) : null}
            </div>
            {canDeduct ? (
              <Form {...form}>
                <form onSubmit={(e) => void onDeduct(e)} className="grid gap-3" noValidate>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("dawam.deductAmount", "Deduct (EGP)")}</FormLabel>
                        <FormControl><Input type="number" inputMode="decimal" {...field} /></FormControl>
                        <FormDescription>
                          {t("dawam.suggested", { amount: fmtMoney(flag.suggested_deduction_piastres), defaultValue: `Suggested: ${fmtMoney(flag.suggested_deduction_piastres)}, time away at their minute rate.` })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="flag-reason">{t("dawam.deductReason", "Reason (the employee sees it)")}</Label>
                    <Input id="flag-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                  <Button type="submit" variant="destructive" disabled={busy}>{t("dawam.deduct", "Deduct")}</Button>
                </form>
              </Form>
            ) : (
              <p className="text-xs text-muted-foreground">{t("dawam.deductNeedsRight", "Deducting for it needs the right to add deductions. The owner can give it to you.")}</p>
            )}
          </div>
        ) : null}
        {mine ? null : <DialogFooter className="gap-2">
          {flag.kind === "new_phone" && canRevoke ? (
            <Button variant="destructive" disabled={busy} onClick={() => void send("revoke")}>{t("dawam.revokePhone", "Revoke this phone")}</Button>
          ) : null}
          {flag.kind === "cover" && canConfirmCover ? (
            <Button disabled={busy} onClick={() => void send("confirm")}>{t("dawam.confirmCover", "Confirm the cover")}</Button>
          ) : null}
          <Button variant="ghost" disabled={busy} onClick={() => void send("ignore")}>{t("dawam.ignore", "Ignore")}</Button>
        </DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

function flagHint(f: AttendanceFlag): string {
  switch (f.kind) {
    case "left_mid_shift": return `Two pings in a row were outside the branch, ${f.minutes_away} minutes in all.`;
    case "suspicious": return "The location didn't move the way a real phone does, or the phone reported a fake location.";
    case "tracking_off": return "They clocked in without \"Always\" location, so there are no pings for this shift.";
    case "time_unverified": return "This punch was queued offline and its time rests on the phone's word (it restarted, or the time the server gave it can't be proven), so it couldn't be checked.";
    case "phone_died": return "The pings stopped with the battery low: the phone likely died on shift.";
    case "new_phone": return "They signed in on a new phone; the old one is already signed out.";
    default: return "A colleague covered this shift. Confirm it to pay them for it.";
  }
}

/** A punch for someone whose phone died (CL-13); a reason is required. */
function PunchDialog({ person, onOpenChange }: { person: PresenceRow | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const schema = useMemo(
    () => z.object({ reason: z.string().trim().min(1, t("staff.reasonRequired", "Say why")) }),
    [t],
  );
  const form = useForm<{ reason: string }>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  const reason = form.watch("reason");
  if (!person) return null;
  const out = !!person.check_in_at && !person.check_out_at;
  const save = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await punchFor({ employee_id: person.employee_id, reason: v.reason.trim() });
      toast.success(out ? t("dawam.punchedOut", "Punched out") : t("dawam.punchedIn", "Punched in"));
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  });
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{out ? t("dawam.punchOutFor", { name: person.employee_name, defaultValue: `Punch ${person.employee_name} out` }) : t("dawam.punchInFor", { name: person.employee_name, defaultValue: `Punch ${person.employee_name} in` })}</DialogTitle>
          <DialogDescription>{t("dawam.punchHint", "Recorded now, marked as done by you. They're told, and can ask for a fix.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void save(e)} className="grid gap-3" noValidate>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.reason", "Reason")}</FormLabel>
                  <FormControl><Input placeholder={t("dawam.punchReasonPlaceholder", "Phone died")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy || !reason.trim()}>{out ? t("dawam.punchOut", "Punch out") : t("dawam.punchIn", "Punch in")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
