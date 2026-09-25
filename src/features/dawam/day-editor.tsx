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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, Clock, Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moveShift, putDay, putTimes, resetDay } from "@/data/api/generated/api";
import type { DayBlock, LabourWarning, RosterPerson, RosterShift, WorkShiftBrief } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate } from "@/lib/format";
import { fmtHours, invalidateStaff } from "@/features/staff/util";
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

export function ShiftTimes({ s }: { s: Pick<RosterShift, "start_time" | "end_time" | "crosses_midnight"> }) {
  const { t } = useTranslation();
  return (
    <bdi className="font-mono text-[11px] tabular-nums text-muted-foreground">
      {hhmm(s.start_time)}–{hhmm(s.end_time)}
      {s.crosses_midnight ? <span title={t("staff.endsNextDay", "Ends the next day")}> +1</span> : null}
    </bdi>
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
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [adding, setAdding] = useState("");
  const weekday = weekdayOf(date);
  const offered = blocksOn(templates, weekday).filter((w) => !shifts.some((s) => s.work_shift_id === w.id));

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
          </DialogDescription>
        </DialogHeader>

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
                  <div className="space-y-1">
                    <Label htmlFor={`from-${s.work_shift_id}`}>{t("dawam.from", "From")}</Label>
                    <Input id={`from-${s.work_shift_id}`} type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`to-${s.work_shift_id}`}>{t("dawam.to", "To")}</Label>
                    <Input id={`to-${s.work_shift_id}`} type="time" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                  {from && to && to <= from ? (
                    <p className="col-span-2 text-xs text-muted-foreground">{t("staff.endsNextDay", "Ends the next day")}</p>
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
                      disabled={busy || !from || !to}
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
                  <Button
                    size="sm"
                    disabled={busy || !moveTo}
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
                  return (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} · <bdi className="font-mono tabular-nums">{at.start}–{at.end}</bdi>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !adding}
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
          <Button variant="outline" disabled={busy} onClick={() => void setShifts([], t("dawam.dayChanged", "Day changed"))}>
            {t("dawam.dayOff", "Day off")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
