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
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, Grid3x3, Loader2, PartyPopper, Scale, Send, Sparkles, TriangleAlert } from "lucide-react";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  decideHoliday, decideSuggestion, postOpenShift, publish, putOverride, useFairness, useListBranches, useRoster, useSuggestions,
} from "@/data/api/generated/api";
import type { LabourWarning, RosterShift, Suggestion, WorkShiftBrief } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { RulesFirstBanner } from "./rules-banner";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { Cap } from "@/generated/capabilities";
import { fmtDate } from "@/lib/format";
import { fmtMinutes, invalidateStaff, todayIso, WEEKDAYS } from "@/features/staff/util";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverageEditor } from "./coverage-editor";
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
  const [showCoverage, setShowCoverage] = useState(false);
  const [week, setWeek] = useState(() => weekStartOf(todayIso()));
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: canRead && !!orgId } });
  const branchId = scope.branchId ?? picked ?? branchesQ.data?.[0]?.id ?? "";
  const days = weekDays(week);
  const rosterQ = useRoster({ branch_id: branchId, from: week, to: days[6] }, { query: { enabled: canRead && !!branchId } });
  const suggestionsQ = useSuggestions({ branch_id: branchId, week_start: week }, { query: { enabled: canEdit && !!branchId } });
  const upcoming = useRoster(
    { branch_id: branchId, from: todayIso(), to: addDays(todayIso(), 45) },
    { query: { enabled: canEdit && !!branchId } },
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
      const k = `${s.user_id}|${s.date}`;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [view]);
  const warningsAt = useMemo(() => {
    const m = new Map<string, LabourWarning[]>();
    for (const w of view?.warnings ?? []) {
      const k = `${w.user_id}|${w.date}`;
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

  const setDay = (userId: string, date: string, workShiftId: string | null) =>
    run(`${userId}|${date}`, () => putOverride({ user_id: userId, on_date: date, work_shift_id: workShiftId }), t("dawam.dayChanged", "Day changed"));

  const doPublish = async () => {
    const ok = await confirm({
      title: t("dawam.publishTitle", { from: fmtDate(week), defaultValue: `Publish the week of ${fmtDate(week)}?` }),
      description: t("dawam.publishHint", "Everyone on it sees their shifts and gets a notification. Later changes tell the people they affect."),
      confirmLabel: t("dawam.publish", "Publish"),
    });
    if (ok) await run("publish", () => publish({ branch_id: branchId, week_start: week }), t("dawam.published", "Week published"));
  };

  const holidays = (upcoming.data?.holidays ?? []).filter((h) => !h.decision);

  // A pattern suggestion changes the person's standing week, not one day: say so first.
  const decide = async (g: Suggestion, accept: boolean) => {
    if (accept && g.id.startsWith("pattern|")) {
      const ok = await confirm({
        title: t("dawam.patternTitle", { name: g.user_name, defaultValue: `Change ${g.user_name}'s standing pattern?` }),
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
            <Button variant="outline" size="icon" aria-label={t("dawam.prevWeek", "Previous week")} onClick={() => setWeek(addDays(week, -7))}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
            <span className="text-sm font-medium tabular-nums">{fmtDate(week)} – {fmtDate(days[6])}</span>
            <Button variant="outline" size="icon" aria-label={t("dawam.nextWeek", "Next week")} onClick={() => setWeek(addDays(week, 7))}><ChevronRight className="size-4 rtl:rotate-180" /></Button>
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

      {rosterQ.error ? (
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
                <tr key={p.user_id}>
                  <td className="sticky start-0 z-10 max-w-[12rem] border-t bg-card px-4 py-1.5">
                    <div className="truncate font-medium">{p.name}</div>
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
                        ].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  {days.map((d) => (
                    <DayCell
                      key={d}
                      name={p.name}
                      date={d}
                      shifts={cell.get(`${p.user_id}|${d}`) ?? []}
                      warnings={warningsAt.get(`${p.user_id}|${d}`) ?? []}
                      templates={templates}
                      editable={canEdit}
                      busy={busy === `${p.user_id}|${d}`}
                      onSet={(w) => void setDay(p.user_id, d, w)}
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
                          <Badge key={o.id} variant={o.status === "claimed" ? "secondary" : "outline"}>
                            {o.shift_name}{o.claimed_by_name ? ` · ${o.claimed_by_name}` : ""}
                          </Badge>
                        ))}
                        {canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-7" aria-label={t("dawam.postOpenOn", { date: fmtDate(d), defaultValue: `Post an open shift on ${fmtDate(d)}` })}>
                                <CalendarPlus className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>{t("dawam.postOpen", "Post an open shift")}</DropdownMenuLabel>
                              {templates.map((w) => (
                                <DropdownMenuItem key={w.id} onSelect={() => void run(`open|${d}`, () => postOpenShift({ branch_id: branchId, on_date: d, work_shift_id: w.id }), t("dawam.openPosted", "Open shift posted"))}>
                                  {w.name}
                                </DropdownMenuItem>
                              ))}
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
          {suggestionsQ.isLoading ? <Skeleton className="h-20 w-full rounded-2xl" /> : (suggestionsQ.data ?? []).length === 0 ? (
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
                    title={g.from_user_name ? `${g.user_name} ↔ ${g.from_user_name}` : `${g.user_name} → ${g.shift_name}`}
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

      {canEdit && holidays.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><PartyPopper className="size-4" />{t("dawam.holidays", "Public holidays")}</h2>
          <ListCard>
            {holidays.map((h) => (
              <ListRow
                key={h.on_date}
                icon={PartyPopper}
                title={i18n.language.startsWith("ar") ? h.name_ar : h.name_en}
                meta={t("dawam.holidayHint", { date: fmtDate(h.on_date), defaultValue: `${fmtDate(h.on_date)} · as a holiday nobody is marked absent, and working it pays extra` })}
                trailing={
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => void run(`h|${h.on_date}`, () => decideHoliday(h.on_date, { decision: "holiday" }), t("dawam.holidaySet", "Set as a holiday"))}>{t("dawam.makeHoliday", "Make it a holiday")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => void run(`h|${h.on_date}`, () => decideHoliday(h.on_date, { decision: "dismissed" }), t("dawam.holidayDismissed", "Kept as a normal day"))}>{t("dawam.normalDay", "Normal day")}</Button>
                  </span>
                }
              />
            ))}
          </ListCard>
        </section>
      ) : null}
      {canSettings ? <FairnessCard month={`${week.slice(0, 8)}01`} /> : null}
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
  const detail = `${fmtMinutes(w.minutes)} / ${fmtMinutes(w.limit_minutes)}`;
  return (
    <span title={`${label}: ${detail}`} className="inline-flex items-center gap-0.5 rounded-full bg-warning/14 px-1.5 text-[10px] font-medium text-warning">
      <TriangleAlert className="size-3" />{label}
    </span>
  );
}

/** Owner only: nights by gender against who said they want them, and whether suggestions still learn (SC-12). */
function FairnessCard({ month }: { month: string }) {
  const { t } = useTranslation();
  const q = useFairness({ month });
  const v = q.data;
  const gender = (g: string | null | undefined) =>
    g === "m" ? t("dawam.gender_m", "Male") : g === "f" ? t("dawam.gender_f", "Female") : t("dawam.notSet", "Not set");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="size-4" />{t("dawam.fairnessTitle", "Night shifts, fairly")}</CardTitle>
        <CardDescription>{t("dawam.fairnessHint", "This month's nights by gender, against who said they prefer evenings. Only you see this.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!v ? <Skeleton className="h-24 w-full" /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="py-1 text-start font-semibold">{t("dawam.gender", "Gender")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.people", "People")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.willing", "Prefer evenings")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.shifts", "Shifts")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.nightShifts", "Night shifts")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {v.rows.map((r) => (
                  <tr key={r.gender ?? "none"} className="border-t">
                    <td className="py-1.5">{gender(r.gender)}</td>
                    <td className="py-1.5 text-end">{r.people}</td>
                    <td className="py-1.5 text-end">{r.willing}</td>
                    <td className="py-1.5 text-end">{r.shifts}</td>
                    <td className="py-1.5 text-end">{r.night_shifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground">
              {t("dawam.fairnessDecided", { accepted: v.accepted_4w, decided: v.decided_4w, defaultValue: `Managers accepted ${v.accepted_4w} of ${v.decided_4w} suggestions in the last 4 weeks.` })}
              {v.learning_frozen ? ` ${t("dawam.learningFrozen", "Under 40% accepted, so suggestions stopped learning from decisions until that changes.")}` : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DayCell({
  name, date, shifts, warnings, templates, editable, busy, onSet,
}: {
  name: string;
  date: string;
  shifts: RosterShift[];
  warnings: LabourWarning[];
  templates: WorkShiftBrief[];
  editable: boolean;
  busy: boolean;
  onSet: (workShiftId: string | null) => void;
}) {
  const { t } = useTranslation();
  const body = (
    <div className="flex min-h-9 flex-col items-center justify-center gap-0.5">
      {busy ? <Loader2 className="size-4 animate-spin" /> : shifts.length === 0 ? (
        <span className="text-xs text-muted-foreground">{t("dawam.off", "Off")}</span>
      ) : (
        shifts.map((s) => (
          <span key={s.work_shift_id} className={s.on_leave ? "text-xs text-muted-foreground line-through" : "text-xs font-medium"}>
            {s.shift_name}{s.changed ? " •" : ""}
          </span>
        ))
      )}
      {warnings.map((w) => <WarningChip key={w.kind} w={w} />)}
    </div>
  );
  if (!editable) return <td className="border-t px-1 py-1 text-center">{body}</td>;
  return (
    <td className="border-t px-1 py-1 text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="w-full rounded-md hover:bg-accent" aria-label={t("dawam.editDay", { name, date: fmtDate(date), defaultValue: `${name}, ${fmtDate(date)}` })}>
            {body}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t("dawam.thisDayOnly", "This day only")}</DropdownMenuLabel>
          {templates.map((w) => (
            <DropdownMenuItem key={w.id} onSelect={() => onSet(w.id)}>{w.name}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onSet(null)}>{t("dawam.dayOff", "Day off")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}
