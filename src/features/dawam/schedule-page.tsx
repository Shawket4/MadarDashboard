/**
 * Schedule (Dawam SC-*, DSH Schedule): one branch's dated week. The standing
 * pattern fills it (edited on Work shifts); here a manager changes single days
 * (SC-5), posts open shifts (SC-9), accepts or rejects the week's suggestions
 * (SC-13), sets up upcoming public holidays (RU-10) and publishes the week so
 * staff see it (SC-3). A change to a published week tells the people it
 * affects (SC-4) — the server does that. The server's labour-limit warnings
 * sit on the person and day they concern and never block (RU-13); coverage
 * needs are typed per hour (or follow POS sales); the owner sees who works
 * the nights, by gender, against who said they want them (SC-12).
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, Grid3x3, PartyPopper, Send, SlidersHorizontal, Sparkles, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { Restricted } from "@/components/app/restricted";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  cancelOpenShift, decideHoliday, decideSuggestion, postOpenShift, publish, useListBranches, useRoster, useSuggestions,
} from "@/data/api/generated/api";
import type { LabourWarning, OpenShift, RosterPerson, RosterShift, Suggestion } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { RulesFirstBanner } from "./rules-banner";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { Cap } from "@/generated/capabilities";
import { fmtDate } from "@/lib/format";
import { fmtHours, invalidateStaff, todayIso, WEEKDAYS } from "@/features/staff/util";
import { CoverageEditor } from "./coverage-editor";
import { blockTimesOn, blocksOn, DayEditor, ShiftTimes } from "./day-editor";
import { FairnessCard } from "./fairness-card";
import { dawamQuery } from "./live";
import { DawamRefreshButton } from "./refresh-button";
import { PreferencesDialog } from "./preferences-dialog";
import { weekDays, weekdayOf, weekStartOf, addDays } from "./week";

export function SchedulePage() {
  const { t, i18n } = useTranslation();
  const authz = useAuthz();
  const scope = useScope();
  const confirm = useConfirm();
  const canRead = authz.can(Cap.hrScheduleRead);
  const canEdit = authz.can(Cap.hrScheduleEdit);
  const canPublish = authz.can(Cap.hrSchedulePublish);
  const canSettings = authz.can(Cap.hrRosterSettings);
  const canStaffEdit = authz.can(Cap.hrStaffEdit);
  // Public holidays are the owner's, like the rules (D3): the rules right at
  // every branch decides them (else 403 OWNER_ONLY); everyone else reads them.
  const canDecideHoliday = authz.canEverywhere(Cap.hrRulesEdit);
  const [dayOpen, setDayOpen] = useState<{ person: RosterPerson; date: string } | null>(null);
  const [prefsOf, setPrefsOf] = useState<RosterPerson | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);
  const [week, setWeek] = useState(() => weekStartOf(todayIso()));
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: canRead && !!orgId } });
  const branchId = scope.branchId ?? picked ?? branchesQ.data?.[0]?.id ?? "";
  const days = weekDays(week);
  const rosterQ = useRoster({ branch_id: branchId, from: week, to: days[6] }, { query: dawamQuery({ enabled: canRead && !!branchId }) });
  const suggestionsQ = useSuggestions({ branch_id: branchId, week_start: week }, { query: dawamQuery({ enabled: canEdit && !!branchId }) });
  const upcoming = useRoster(
    { branch_id: branchId, from: todayIso(), to: addDays(todayIso(), 45) },
    { query: dawamQuery({ enabled: canRead && !!branchId }) },
  );

  const view = rosterQ.data;
  const published = view?.published_weeks.includes(week) ?? false;
  const templates = useMemo(
    () => (view?.work_shifts ?? []).filter((w) => !w.branch_id || w.branch_id === branchId),
    [view, branchId],
  );
  const cell = useMemo(() => {
    const m = new Map<string, RosterShift[]>();
    for (const s of view?.shifts ?? []) {
      const k = `${s.employee_id}|${s.date}`;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [view]);
  /** (employee|date) → the date holds its own set; `true` = a day off by date change. */
  const dateSets = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const d of view?.date_sets ?? []) m.set(`${d.employee_id}|${d.date}`, d.day_off);
    return m;
  }, [view]);
  const warningsAt = useMemo(() => {
    const m = new Map<string, LabourWarning[]>();
    for (const w of view?.warnings ?? []) {
      const k = `${w.employee_id}|${w.date}`;
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    return m;
  }, [view]);

  if (authz.ready && !canRead) {
    return <Restricted title={t("dawam.schedule", "Schedule")} who={t("dawam.scheduleNoAccess", "The schedule needs schedule rights. The owner can give you access.")} />;
  }

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      void invalidateStaff();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const cancelOpen = async (o: OpenShift) => {
    const ok = await confirm({
      title: t("dawam.cancelOpenTitle", { shift: o.shift_name, date: fmtDate(o.on_date), defaultValue: `Take back the open ${o.shift_name} on ${fmtDate(o.on_date)}?` }),
      description: o.claimed_by_name
        ? t("dawam.cancelOpenClaimed", { name: o.claimed_by_name, defaultValue: `${o.claimed_by_name} claimed it and will be told.` })
        : t("dawam.cancelOpenHint", "Nobody can claim it any more."),
      confirmLabel: t("dawam.cancelOpen", "Take it back"),
      destructive: true,
    });
    if (ok) await run(`open|${o.id}`, () => cancelOpenShift(o.id), t("dawam.openCancelled", "Open shift taken back"));
  };

  const doPublish = async () => {
    const ok = await confirm({
      title: t("dawam.publishTitle", { from: fmtDate(week), defaultValue: `Publish the week of ${fmtDate(week)}?` }),
      description: t("dawam.publishHint", "Everyone on it sees their shifts and gets a notification. Later changes tell the people they affect."),
      confirmLabel: t("dawam.publish", "Publish"),
    });
    if (ok) await run("publish", () => publish({ branch_id: branchId, week_start: week }), t("dawam.published", "Week published"));
  };

  // The next 45 days' holidays, and the viewed week's own (H2-D6: a holiday
  // further out than that could never be decided, even with its week shown).
  // Decided ones stay listed with their decision (D3: managers read them).
  const holidays = [...(upcoming.data?.holidays ?? []), ...(view?.holidays ?? [])]
    .filter((h, i, all) => all.findIndex((x) => x.on_date === h.on_date) === i)
    .sort((a, b) => a.on_date.localeCompare(b.on_date));

  // A pattern suggestion changes the person's standing week, not one day: say so first.
  const decide = async (g: Suggestion, accept: boolean) => {
    if (accept && g.id.startsWith("pattern|")) {
      const ok = await confirm({
        title: t("dawam.patternTitle", { name: g.employee_name, defaultValue: `Change ${g.employee_name}'s standing pattern?` }),
        description: t("dawam.patternHint", "Every week from now on follows it, not just this one. Single days can still be changed here."),
        confirmLabel: t("dawam.accept", "Accept"),
      });
      if (!ok) return;
    }
    await run(
      `g|${g.id}`,
      () => decideSuggestion({ branch_id: branchId, id: g.id, accept }),
      accept ? t("dawam.suggestionAccepted", "Suggestion accepted") : t("dawam.suggestionRejected", "Suggestion rejected"),
    );
  };

  return (
    <Page width="full">
      <PageHeader
        title={t("dawam.schedule", "Schedule")}
        description={t("dawam.scheduleSubtitle", "The week as it will be worked: change single days, post open shifts, then publish.")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DawamRefreshButton />
            {canEdit ? (
              <Button variant={showCoverage ? "secondary" : "outline"} aria-pressed={showCoverage} onClick={() => setShowCoverage((v) => !v)}>
                <Grid3x3 className="size-4" />{t("dawam.coverageTitle", "Coverage needs")}
              </Button>
            ) : null}
            {!scope.branchId && (branchesQ.data?.length ?? 0) > 1 ? (
              <Select value={branchId} onValueChange={setPicked}>
                <SelectTrigger className="w-44" aria-label={t("dawam.branch", "Branch")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(branchesQ.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            {/* The week's arrows and range move as one: a wrapped toolbar never splits them (L-12). */}
            <div role="group" aria-label={t("dawam.week", "Week")} className="flex flex-nowrap items-center gap-2">
              <Button variant="outline" size="icon" aria-label={t("dawam.prevWeek", "Previous week")} onClick={() => setWeek(addDays(week, -7))}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
              <span className="text-sm font-medium tabular-nums">{fmtDate(week)} – {fmtDate(days[6])}</span>
              <Button variant="outline" size="icon" aria-label={t("dawam.nextWeek", "Next week")} onClick={() => setWeek(addDays(week, 7))}><ChevronRight className="size-4 rtl:rotate-180" /></Button>
            </div>
            {published ? (
              <StatusPill tone="success" icon={CalendarCheck}>{t("dawam.isPublished", "Published")}</StatusPill>
            ) : canPublish ? (
              <Button onClick={() => void doPublish()} disabled={busy === "publish" || !view}><Send className="size-4" />{t("dawam.publish", "Publish")}</Button>
            ) : (
              <StatusPill tone="warning">{t("dawam.draft", "Draft")}</StatusPill>
            )}
          </div>
        }
      />
      <RulesFirstBanner />

      {canEdit && showCoverage && branchId ? <CoverageEditor branchId={branchId} /> : null}

      {(view?.warnings ?? []).length > 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          {view?.limits_unconfirmed
            ? t("dawam.warningsUnconfirmed", "Past a labour limit on the days marked. Only a warning: the limits are unconfirmed until a lawyer confirms them.")
            : t("dawam.warningsNote", "Past a labour limit on the days marked. Only a warning, nothing is blocked.")}
        </p>
      ) : null}

      {!branchId && branchesQ.error ? (
        // H2-D2: with no branch the roster never loads; say why, never a skeleton for ever.
        <ErrorState title={t("dawam.branchesLoadError", "Couldn't load the branches")} message={getErrorMessage(branchesQ.error)} onRetry={() => void branchesQ.refetch()} />
      ) : !branchId && branchesQ.data ? (
        <EmptyState icon={CalendarCheck} title={t("dawam.noBranchYet", "Add a branch first: the schedule is kept per branch.")} />
      ) : rosterQ.error ? (
        <ErrorState title={t("staff.rosterLoadError", "Couldn't load the roster")} message={getErrorMessage(rosterQ.error)} onRetry={() => void rosterQ.refetch()} />
      ) : rosterQ.isLoading || !view ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : view.staff.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("staff.noEmployeesYet", "No active employees to roster.")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky start-0 z-10 border-b bg-card px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground">{t("staff.employee", "Employee")}</th>
                {days.map((d) => {
                  const wd = WEEKDAYS.find((x) => x.value === weekdayOf(d))!;
                  return (
                    <th key={d} className="border-b px-1 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                      <div>{t(wd.labelKey, wd.fallback)}</div>
                      <div className="font-normal tabular-nums">{fmtDate(d)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {view.staff.map((p) => (
                <tr key={p.employee_id}>
                  <td className="sticky start-0 z-10 max-w-[12rem] border-t bg-card px-4 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="truncate font-medium">{p.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 sm:size-6"
                        aria-label={t("dawam.prefsOf", { name: p.name, defaultValue: `${p.name}'s preferences` })}
                        onClick={() => setPrefsOf(p)}
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </Button>
                    </div>
                    {p.pref_time || p.cant_work_days.length ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {[
                          p.pref_time ? t(`dawam.prefers_${p.pref_time}`, p.pref_time === "morning" ? "Prefers mornings" : "Prefers evenings") : null,
                          p.cant_work_days.length
                            ? t("dawam.cantWork", {
                                days: p.cant_work_days.map((d) => { const w = WEEKDAYS.find((x) => x.value === d); return w ? t(w.labelKey, w.fallback) : ""; }).join(", "),
                                defaultValue: "Can't work: {{days}}",
                              })
                            : null,
                          p.prefs_set_by === "manager" ? t("dawam.setByManager", "set by a manager") : null,
                        ].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  {days.map((d) => (
                    <DayCell
                      key={d}
                      name={p.name}
                      date={d}
                      shifts={cell.get(`${p.employee_id}|${d}`) ?? []}
                      warnings={warningsAt.get(`${p.employee_id}|${d}`) ?? []}
                      dayOff={dateSets.get(`${p.employee_id}|${d}`) === true}
                      editable={canEdit}
                      onOpen={() => setDayOpen({ person: p, date: d })}
                    />
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky start-0 z-10 border-t bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">{t("dawam.openShifts", "Open shifts")}</td>
                {days.map((d) => {
                  const open = view.open_shifts.filter((o) => o.on_date === d);
                  return (
                    <td key={d} className="border-t px-1 py-1 align-top">
                      <div className="flex flex-col items-center gap-1">
                        {open.map((o) => (
                          <Badge key={o.id} variant={o.status === "claimed" ? "secondary" : "outline"} className="gap-0.5">
                            {o.shift_name}{o.claimed_by_name ? ` · ${o.claimed_by_name}` : ""}
                            {canEdit ? (
                              <button
                                type="button"
                                className="ms-0.5 rounded-full p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                disabled={busy === `open|${o.id}`}
                                aria-label={t("dawam.cancelOpenOf", { shift: o.shift_name, date: fmtDate(o.on_date), defaultValue: `Take back the open ${o.shift_name} on ${fmtDate(o.on_date)}` })}
                                onClick={() => void cancelOpen(o)}
                              >
                                <X className="size-3" />
                              </button>
                            ) : null}
                          </Badge>
                        ))}
                        {canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8 sm:size-7" aria-label={t("dawam.postOpenOn", { date: fmtDate(d), defaultValue: `Post an open shift on ${fmtDate(d)}` })}>
                                <CalendarPlus className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>{t("dawam.postOpen", "Post an open shift")}</DropdownMenuLabel>
                              {blocksOn(templates, weekdayOf(d)).map((w) => {
                                const at = blockTimesOn(w, weekdayOf(d));
                                return (
                                  <DropdownMenuItem
                                    key={w.id}
                                    onSelect={() =>
                                      void run(
                                        `open|${d}`,
                                        () => postOpenShift({ branch_id: branchId, on_date: d, work_shift_id: w.id }),
                                        // H2-D3: staff can't see or claim it until the week is published.
                                        published
                                          ? t("dawam.openPosted", "Open shift posted")
                                          : t("dawam.openPostedUnpublished", "Open shift posted. Staff see it once you publish this week."),
                                      )
                                    }
                                  >
                                    <span className="flex-1">{w.name}</span>
                                    <bdi className="font-mono text-xs text-muted-foreground tabular-nums">{at.start}–{at.end}</bdi>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {canEdit ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Sparkles className="size-4" />{t("dawam.suggestions", "Suggestions")}</h2>
          {suggestionsQ.error ? (
            // H2-D1: a failed read is not "nothing to suggest".
            <ErrorState title={t("dawam.suggestionsLoadError", "Couldn't load the suggestions")} message={getErrorMessage(suggestionsQ.error)} onRetry={() => void suggestionsQ.refetch()} />
          ) : suggestionsQ.isLoading ? <Skeleton className="h-20 w-full rounded-2xl" /> : (suggestionsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dawam.noSuggestions", "Nothing to suggest for this week.")}</p>
          ) : (
            <ListCard>
              {(suggestionsQ.data ?? []).map((g) => {
                const args = (g.reason_args ?? {}) as Record<string, string | number>;
                const why = t(g.reason_key.replace(/^staff\./, "dawam."), { ...args, defaultValue: g.reason_key });
                return (
                  <ListRow
                    key={g.id}
                    icon={Sparkles}
                    title={g.from_employee_name ? `${g.employee_name} ↔ ${g.from_employee_name}` : `${g.employee_name} → ${g.shift_name}`}
                    meta={[fmtDate(g.date), why, g.by_default ? t("dawam.byDefault", "by the default") : null].filter(Boolean).join(" · ")}
                    trailing={
                      <span className="flex items-center gap-1">
                        <Badge variant="outline">{g.confidence}%</Badge>
                        <Button size="sm" variant="outline" disabled={busy === `g|${g.id}`} onClick={() => void decide(g, true)}>{t("dawam.accept", "Accept")}</Button>
                        <Button size="sm" variant="ghost" disabled={busy === `g|${g.id}`} onClick={() => void decide(g, false)}>{t("common.reject", "Reject")}</Button>
                      </span>
                    }
                  />
                );
              })}
            </ListCard>
          )}
        </section>
      ) : null}

      {holidays.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><PartyPopper className="size-4" />{t("dawam.holidays", "Public holidays")}</h2>
          {canDecideHoliday ? null : (
            <p className="text-sm text-muted-foreground">{t("dawam.holidaysOwnerOnly", "The owner decides public holidays.")}</p>
          )}
          <ListCard>
            {holidays.map((h) => (
              <ListRow
                key={h.on_date}
                icon={PartyPopper}
                title={i18n.language.startsWith("ar") ? h.name_ar : h.name_en}
                meta={t("dawam.holidayHint", { date: fmtDate(h.on_date), defaultValue: `${fmtDate(h.on_date)} · as a holiday nobody is marked absent, and working it pays extra` })}
                trailing={
                  h.decision ? (
                    <StatusPill tone={h.decision === "holiday" ? "info" : "neutral"}>
                      {h.decision === "holiday" ? t("dawam.holidayDecided", "Holiday") : t("dawam.normalDay", "Normal day")}
                    </StatusPill>
                  ) : !canDecideHoliday ? (
                    <StatusPill tone="warning">{t("dawam.holidayUndecided", "Not decided yet")}</StatusPill>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Button size="sm" variant="outline" disabled={busy === `h|${h.on_date}`} onClick={() => void run(`h|${h.on_date}`, () => decideHoliday(h.on_date, { decision: "holiday" }), t("dawam.holidaySet", "Set as a holiday"))}>{t("dawam.makeHoliday", "Make it a holiday")}</Button>
                      <Button size="sm" variant="ghost" disabled={busy === `h|${h.on_date}`} onClick={() => void run(`h|${h.on_date}`, () => decideHoliday(h.on_date, { decision: "dismissed" }), t("dawam.holidayDismissed", "Kept as a normal day"))}>{t("dawam.normalDay", "Normal day")}</Button>
                    </span>
                  )
                }
              />
            ))}
          </ListCard>
        </section>
      ) : null}
      {canSettings ? <FairnessCard month={`${week.slice(0, 8)}01`} /> : null}

      {dayOpen && view ? (
        <DayEditor
          open
          onOpenChange={(o) => { if (!o) setDayOpen(null); }}
          person={dayOpen.person}
          date={dayOpen.date}
          shifts={cell.get(`${dayOpen.person.employee_id}|${dayOpen.date}`) ?? []}
          templates={templates}
          staff={view.staff}
          ownSet={dateSets.has(`${dayOpen.person.employee_id}|${dayOpen.date}`)}
          branchId={branchId}
        />
      ) : null}
      {prefsOf ? (
        <PreferencesDialog
          open
          person={prefsOf}
          canEdit={canStaffEdit}
          onOpenChange={(o) => { if (!o) setPrefsOf(null); }}
        />
      ) : null}
    </Page>
  );
}

const WARN_FALLBACK: Record<string, string> = {
  day_hours: "Hours a day", week_hours: "Hours a week", presence: "Presence a day",
  rest: "Rest between shifts", weekly_rest: "Weekly day off", overtime_day: "Overtime a day",
};

/** One labour-limit warning as a chip: which limit, and by how much (RU-13). */
function WarningChip({ w }: { w: LabourWarning }) {
  const { t } = useTranslation();
  const label = t(`dawam.warn_${w.kind}`, WARN_FALLBACK[w.kind] ?? w.kind);
  const detail = `${fmtHours(w.minutes)} / ${fmtHours(w.limit_minutes)}`;
  return (
    <span title={`${label}: ${detail}`} className="inline-flex items-center gap-0.5 rounded-full bg-warning/14 px-1.5 text-[10px] font-medium text-warning">
      <TriangleAlert className="size-3" />{label}
    </span>
  );
}

function DayCell({
  name, date, shifts, warnings, dayOff, editable, onOpen,
}: {
  name: string;
  /** A day off set by a date change (not a rest day in the pattern). */
  dayOff: boolean;
  date: string;
  shifts: RosterShift[];
  warnings: LabourWarning[];
  editable: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const body = (
    <div className="flex min-h-9 flex-col items-center justify-center gap-0.5">
      {shifts.length === 0 ? (
        dayOff ? (
          <span className="text-xs font-medium">{t("dawam.dayOffSet", "Day off")}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("dawam.off", "Off")}</span>
        )
      ) : (
        shifts.map((s) => (
          <span key={s.work_shift_id} className="flex flex-col items-center leading-tight">
            <span className={s.on_leave ? "text-xs text-muted-foreground line-through" : "text-xs font-medium"}>
              {s.shift_name}
              {s.changed ? <span title={t("dawam.changedAfterPublish", "Changed after publishing")}> •</span> : null}
            </span>
            <span className="flex items-center gap-1">
              <ShiftTimes s={s} />
              {s.times_edited ? <span className="text-[10px] font-medium text-primary">{t("dawam.edited", "Edited")}</span> : null}
            </span>
          </span>
        ))
      )}
      {warnings.map((w) => <WarningChip key={w.kind} w={w} />)}
    </div>
  );
  if (!editable) return <td className="border-t px-1 py-1 text-center">{body}</td>;
  return (
    <td className="border-t px-1 py-1 text-center">
      <button
        type="button"
        className="w-full rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("dawam.editDay", { name, date: fmtDate(date), defaultValue: `${name}, ${fmtDate(date)}` })}
        onClick={onOpen}
      >
        {body}
      </button>
    </td>
  );
}
