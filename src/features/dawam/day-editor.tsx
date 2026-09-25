/**
 * One person's date on the schedule (SC-5, SC-11): the shifts they work that
 * day — several on a split day, or a day off — each with its own from/to if
 * the manager set one (the block itself unchanged), given to someone else,
 * or the whole date put back on the standing pattern.
 *
 * Only blocks valid on that weekday are offered, at that day's times; the
 * server decides everything else (whether a time runs into the next day,
 * overlaps, labour warnings) and refuses what can't be rostered.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, Clock, Moon, Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeRangeField } from "@/components/inputs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moveShift, putDay, putTimes, resetDay } from "@/data/api/generated/api";
import type { DayBlock, LabourWarning, RosterPerson, RosterShift, WorkShiftBrief } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate } from "@/lib/format";
import { fmtHours, invalidateStaff } from "@/features/staff/util";
import { useConfirm } from "@/components/app/confirm-dialog";
import { clashesWith, type TimedBlock } from "./schedule-checks";
import { weekdayOf } from "./week";

const hhmm = (v: string | null | undefined) => (v ?? "").slice(0, 5);

/** A block's times on a weekday: that day's own, else its default. Display only. */
export function blockTimesOn(w: WorkShiftBrief, weekday: number): { start: string; end: string } {
  const own = (w.day_times ?? []).find((d) => d.day_of_week === weekday);
  return { start: hhmm(own?.start_time ?? w.start_time), end: hhmm(own?.end_time ?? w.end_time) };
}

/** The blocks the server rosters on that weekday. */
export const blocksOn = (templates: WorkShiftBrief[], weekday: number) =>
  templates.filter((w) => (w.valid_days ?? [0, 1, 2, 3, 4, 5, 6]).includes(weekday));

/** The day as it stands, sent back unchanged: a shift keeps its own times
 *  only when it has them. */
const blockOf = (s: RosterShift): DayBlock => ({
  work_shift_id: s.work_shift_id,
  start_time: s.times_edited ? s.start_time : null,
  end_time: s.times_edited ? s.end_time : null,
});

/** "+1 day": the shift ends the next day. Visible, and read out, never a bare "+1". */
export function NextDayMark() {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-secondary px-1 font-sans text-[10px] font-semibold text-foreground"
      title={t("staff.endsNextDay", "Ends the next day")}
    >
      <Moon className="size-2.5" aria-hidden />
      <span aria-hidden>{t("dawamOps.plusOneDay", "+1 day")}</span>
      <span className="sr-only">{t("staff.endsNextDay", "Ends the next day")}</span>
    </span>
  );
}

export function ShiftTimes({ s }: { s: Pick<RosterShift, "start_time" | "end_time" | "crosses_midnight"> }) {
  return (
    <span className="inline-flex items-center gap-1">
      <bdi className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {hhmm(s.start_time)}–{hhmm(s.end_time)}
      </bdi>
      {s.crosses_midnight ? <NextDayMark /> : null}
    </span>
  );
}

export function DayEditor({
  open,
  onOpenChange,
  person,
  date,
  shifts,
  templates,
  staff,
  ownSet,
  branchId,
  shiftsOf,
  published = false,
  branchNames,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  person: { employee_id: string; name: string };
  date: string;
  shifts: RosterShift[];
  templates: WorkShiftBrief[];
  staff: RosterPerson[];
  /** The date holds its own set (GET /staff/roster date_sets): only then can
   *  it go back to the pattern. */
  ownSet: boolean;
  /** The board's branch: a business-wide block set here is worked here (H2-B8). */
  branchId: string;
  /** A colleague's shifts that date: a move onto a clash is said before it is sent. */
  shiftsOf?: (employeeId: string) => RosterShift[];
  /** The week is published: the person is told about a change. */
  published?: boolean;
  branchNames?: Map<string, string>;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [adding, setAdding] = useState("");
  const weekday = weekdayOf(date);
  const offered = blocksOn(templates, weekday).filter((w) => !shifts.some((s) => s.work_shift_id === w.id));
  const timed = (s: RosterShift): TimedBlock => ({ name: s.shift_name, start: hhmm(s.start_time), end: hhmm(s.end_time), branchId: s.branch_id });
  /** What a block would clash with on this date, before anything is sent. */
  const clashOfBlock = (w: WorkShiftBrief) => {
    const at = blockTimesOn(w, weekday);
    return clashesWith(shifts.map(timed), { name: w.name, start: at.start, end: at.end });
  };
  const addClash = adding ? clashOfBlock(offered.find((w) => w.id === adding) ?? ({} as WorkShiftBrief)) : [];
  const editClash = editing && from && to
    ? clashesWith(shifts.filter((x) => x.work_shift_id !== editing).map(timed), { name: "", start: from, end: to })
    : [];
  const moving_ = shifts.find((x) => x.work_shift_id === moving);
  const moveClash = moving_ && moveTo && shiftsOf ? clashesWith(shiftsOf(moveTo).map(timed), timed(moving_)) : [];
  const moveToName = staff.find((p) => p.employee_id === moveTo)?.name ?? "";
  const elsewhere = shifts.filter((x) => x.branch_id && branchId && x.branch_id !== branchId);
  const clashText = (list: TimedBlock[]) =>
    list.map((b) => `${b.name} ${b.start}–${b.end}`).join(t("common.listSeparator", ", "));

  const dayOff = async () => {
    if (shifts.length > 0) {
      const ok = await confirm({
        title: t("dawamOps.dayOffTitle", { name: person.name, date: fmtDate(date), defaultValue: "Give {{name}} the day off on {{date}}?" }),
        description: `${t("dawamOps.dayOffHint", { shifts: shifts.map((x) => x.shift_name).join(t("common.listSeparator", ", ")), defaultValue: "{{shifts}} come off this date only; the pattern stays as it is." })}${published ? ` ${t("dawamOps.toldPublished", "The week is published, so they are told.")}` : ""}`,
        confirmLabel: t("dawam.dayOff", "Day off"),
      });
      if (!ok) return;
    }
    await setShifts([], t("dawam.dayChanged", "Day changed"));
  };

  const warn = (warnings: LabourWarning[] | undefined) => {
    for (const w of warnings ?? []) {
      toast.warning(
        t("dawam.limitWarning", {
          limit: t(`dawam.warn_${w.kind}`, w.kind),
          minutes: fmtHours(w.minutes),
          cap: fmtHours(w.limit_minutes),
          defaultValue: "{{limit}}: {{minutes}} of {{cap}}. Only a warning.",
        }),
      );
    }
  };

  const run = async (fn: () => Promise<{ warnings?: LabourWarning[] } | unknown>, ok: string, close = true) => {
    setBusy(true);
    try {
      const out = (await fn()) as { warnings?: LabourWarning[]; to?: { warnings?: LabourWarning[] } } | undefined;
      toast.success(ok);
      warn(out?.warnings ?? out?.to?.warnings);
      void invalidateStaff();
      setEditing(null);
      setMoving(null);
      if (close) onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const setShifts = (blocks: DayBlock[], ok: string) =>
    run(() => putDay({ employee_id: person.employee_id, on_date: date, shifts: blocks, branch_id: branchId }), ok);

  const title = t("dawam.dayEditorTitle", {
    name: person.name,
    date: fmtDate(date),
    defaultValue: `${person.name}, ${fmtDate(date)}`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("dawam.dayEditorHint", "Changes this date only. Several shifts make a split day; an end at or before the start runs into the next day.")}
            {published ? ` ${t("dawamOps.toldPublished", "The week is published, so they are told.")}` : ""}
          </DialogDescription>
        </DialogHeader>
        {elsewhere.length > 0 ? (
          <p role="note" className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            {t("dawamOps.alsoElsewhere", {
              shifts: elsewhere.map((x) => `${x.shift_name} (${branchNames?.get(x.branch_id) ?? t("dawamOps.otherBranch", "another branch")})`).join(t("common.listSeparator", ", ")),
              defaultValue: "Also works at another branch that day: {{shifts}}.",
            })}
          </p>
        ) : null}

        <ul className="space-y-2" aria-label={t("dawam.shiftsThatDay", "Shifts that day")}>
          {shifts.length === 0 ? (
            <li className="text-sm text-muted-foreground">{t("dawam.off", "Off")}</li>
          ) : null}
          {shifts.map((s) => (
            <li key={s.work_shift_id} className="space-y-2 rounded-lg border p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.shift_name}</span>
                <ShiftTimes s={s} />
                {s.times_edited ? <Badge variant="secondary">{t("dawam.edited", "Edited")}</Badge> : null}
                {s.changed ? <Badge variant="outline">{t("dawam.changedAfterPublish", "Changed after publishing")}</Badge> : null}
                <span className="ms-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t("dawam.editTimesOf", { shift: s.shift_name, defaultValue: `Times of ${s.shift_name}` })}
                    onClick={() => {
                      setEditing(s.work_shift_id);
                      setFrom(hhmm(s.start_time));
                      setTo(hhmm(s.end_time));
                    }}
                  >
                    <Clock className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t("dawam.moveShiftOf", { shift: s.shift_name, defaultValue: `Give ${s.shift_name} to someone else` })}
                    onClick={() => { setMoving(s.work_shift_id); setMoveTo(""); }}
                  >
                    <ArrowRightLeft className="size-4 rtl:rotate-180" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    aria-label={t("dawam.removeShiftOf", { shift: s.shift_name, defaultValue: `Take ${s.shift_name} off this day` })}
                    onClick={() =>
                      void setShifts(
                        shifts.filter((x) => x.work_shift_id !== s.work_shift_id).map(blockOf),
                        t("dawam.dayChanged", "Day changed"),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              </div>

              {editing === s.work_shift_id ? (
                <div className="grid grid-cols-2 gap-2">
                  <TimeRangeField
                    id={`times-${s.work_shift_id}`}
                    className="col-span-2"
                    startLabel={t("dawam.from", "From")}
                    endLabel={t("dawam.to", "To")}
                    value={{ start: from, end: to }}
                    onChange={(r) => { setFrom(r.start); setTo(r.end); }}
                  />
                  {editClash.length > 0 ? (
                    <ClashNote className="col-span-2">
                      {t("dawamOps.clashTimes", { with: clashText(editClash), defaultValue: "These times overlap {{with}}. Overlapping shifts are refused: change the times first." })}
                    </ClashNote>
                  ) : null}
                  <div className="col-span-2 flex flex-wrap justify-end gap-2">
                    {s.times_edited ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => putTimes({ employee_id: person.employee_id, on_date: date, work_shift_id: s.work_shift_id, start_time: null, end_time: null }),
                            t("dawam.timesReset", "Back to the shift's own times"),
                            false,
                          )
                        }
                      >
                        {t("dawam.blockTimes", "Use the shift's times")}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={busy || !from || !to || from === to || editClash.length > 0}
                      onClick={() =>
                        void run(
                          () => putTimes({ employee_id: person.employee_id, on_date: date, work_shift_id: s.work_shift_id, start_time: `${from}:00`, end_time: `${to}:00` }),
                          t("dawam.timesSaved", "Times saved for this day"),
                          false,
                        )
                      }
                    >
                      {t("dawam.saveTimes", "Save times")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {moving === s.work_shift_id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1 space-y-1">
                    <Label>{t("dawam.giveTo", "Give it to")}</Label>
                    <Select value={moveTo} onValueChange={setMoveTo}>
                      <SelectTrigger aria-label={t("dawam.giveTo", "Give it to")}>
                        <SelectValue placeholder={t("staff.pickEmployee", "Pick an employee")} />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.filter((p) => p.employee_id !== person.employee_id).map((p) => (
                          <SelectItem key={p.employee_id} value={p.employee_id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {moveClash.length > 0 ? (
                    <ClashNote className="basis-full">
                      {t("dawamOps.clashMove", { name: moveToName, with: clashText(moveClash), defaultValue: "{{name}} already works {{with}} that day, which overlaps. Pick someone else." })}
                    </ClashNote>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={busy || !moveTo || moveClash.length > 0}
                    onClick={() =>
                      void run(
                        () => moveShift({ employee_id: person.employee_id, to_employee_id: moveTo, on_date: date, work_shift_id: s.work_shift_id }),
                        t("dawam.shiftMoved", "Shift moved"),
                      )
                    }
                  >
                    {t("dawam.move", "Move")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-1">
            <Label>{t("dawam.addShift", "Add a shift")}</Label>
            <Select value={adding} onValueChange={setAdding}>
              <SelectTrigger aria-label={t("dawam.addShift", "Add a shift")}>
                <SelectValue placeholder={offered.length ? t("dawam.pickShift", "Pick a shift") : t("dawam.noShiftThatDay", "No other shift runs that day")} />
              </SelectTrigger>
              <SelectContent>
                {offered.map((w) => {
                  const at = blockTimesOn(w, weekday);
                  const clash = clashOfBlock(w);
                  return (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} · <bdi className="font-mono tabular-nums">{at.start}–{at.end}</bdi>
                      {clash.length ? <span className="text-xs text-muted-foreground"> · {t("dawamOps.overlaps", { with: clash.map((b) => b.name).join(", "), defaultValue: "overlaps {{with}}" })}</span> : null}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {addClash.length > 0 ? (
            <ClashNote className="basis-full">
              {t("dawamOps.clashAdd", { with: clashText(addClash), defaultValue: "It overlaps {{with}} on this day. Overlapping shifts are refused: change that shift's times or pick another." })}
            </ClashNote>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !adding || addClash.length > 0}
            onClick={() =>
              void setShifts(
                [...shifts.map(blockOf), { work_shift_id: adding, start_time: null, end_time: null }],
                t("dawam.dayChanged", "Day changed"),
              )
            }
          >
            <Plus className="size-4" />{t("dawam.add", "Add")}
          </Button>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {t("dawam.dayEditorWarn", "Labour limits only warn; overlapping shifts are refused.")}
        </p>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {ownSet ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(
                () => resetDay({ employee_id: person.employee_id, on_date: date }),
                t("dawam.backToPatternDone", "Back on the standing pattern"),
              )
            }
          >
            <RotateCcw className="size-4" />{t("dawam.backToPattern", "Back to pattern")}
          </Button>
          ) : (
            <span className="text-xs text-muted-foreground">{t("dawam.followsPattern", "Follows the standing pattern")}</span>
          )}
          <Button variant="outline" disabled={busy} onClick={() => void dayOff()}>
            {t("dawam.dayOff", "Day off")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A clash said before saving: the server would refuse it anyway, so the button waits. */
function ClashNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={`flex items-start gap-1.5 text-xs font-medium text-[color-mix(in_oklab,var(--color-destructive)_55%,var(--color-foreground))] ${className ?? ""}`}>
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
