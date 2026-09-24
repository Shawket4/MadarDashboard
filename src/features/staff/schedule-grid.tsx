import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Sun } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/app/empty-state";
import { SectionHeader } from "@/components/app/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createAssignment, deleteAssignment, useListAssignments, useListEmployees,
} from "@/data/api/generated/api";
import type { ScheduleAssignment, WorkShift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateSchedules, WEEKDAYS } from "./util";

/** Saturday first, as every other week view in Dawam reads (Egypt). */
const WEEK_COLUMNS = [6, 0, 1, 2, 3, 4, 5].map((v) => WEEKDAYS.find((d) => d.value === v)!);

/**
 * The roster as a grid: everyone down the side, the week across the top.
 *
 * A roster is read far more often than it is edited — "who is on tomorrow?" is
 * the question this answers, and a one-employee-at-a-time form could never
 * answer it. Each cell is the shift that will actually be scheduled that day,
 * which is the weekday-specific row if there is one and the every-day row
 * otherwise; the difference is shown rather than flattened, because clearing a
 * cell that is only inheriting does nothing and the UI has to say so.
 */
export function ScheduleGrid({ shifts }: { shifts: WorkShift[] }) {
  const { t } = useTranslation();
  const employeesQ = useListEmployees({ employment_status: "active" });
  // No employee_id = the whole org's roster in one request.
  const assignmentsQ = useListAssignments({});
  const [busyCell, setBusyCell] = useState<string | null>(null);

  const activeShifts = useMemo(() => shifts.filter((s) => s.is_active), [shifts]);
  const employees = employeesQ.data ?? [];

  /** `employee_id` → { everyDay, byWeekday[0..6] }, newest effective_from winning.
   *  The list arrives ordered `effective_from DESC`, so the FIRST row seen for a
   *  slot is the one in force — later ones are superseded history. */
  const roster = useMemo(() => {
    type Row = {
      everyDay?: ScheduleAssignment;
      byWeekday: (ScheduleAssignment | undefined)[];
    };
    const map = new Map<string, Row>();
    for (const a of assignmentsQ.data ?? []) {
      const entry: Row = map.get(a.employee_id) ?? {
        byWeekday: new Array<ScheduleAssignment | undefined>(7).fill(undefined),
      };
      if (a.day_of_week === null || a.day_of_week === undefined) {
        entry.everyDay ??= a;
      } else if (a.day_of_week >= 0 && a.day_of_week <= 6) {
        entry.byWeekday[a.day_of_week] ??= a;
      }
      map.set(a.employee_id, entry);
    }
    return map;
  }, [assignmentsQ.data]);

  /** Assign or clear one slot. A slot holds at most one shift, so replacing
   *  means dropping the existing row first — otherwise the two would both
   *  resolve and the employee would be scheduled twice on the same day. */
  const setCell = async (
    userId: string,
    dayOfWeek: number | null,
    existing: ScheduleAssignment | undefined,
    shiftId: string | null,
  ) => {
    const key = `${userId}:${dayOfWeek ?? "all"}`;
    setBusyCell(key);
    try {
      if (existing) await deleteAssignment(existing.id);
      if (shiftId) {
        await createAssignment({
          employee_id: userId,
          work_shift_id: shiftId,
          day_of_week: dayOfWeek,
        });
      }
      await invalidateSchedules();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusyCell(null);
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t("staff.roster", "Roster")}
        description={t(
          "staff.gridHint",
          "Click a cell to set that day's shift. A weekday cell beats the every-day column; an empty cell is a rest day.",
        )}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        {employeesQ.isLoading || assignmentsQ.isLoading ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : employeesQ.error || assignmentsQ.error ? (
          <ErrorState
            title={t("staff.rosterLoadError", "Couldn't load the roster")}
            onRetry={() => { void employeesQ.refetch(); void assignmentsQ.refetch(); }}
          />
        ) : employees.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {t("staff.noEmployeesYet", "No active employees to roster.")}
          </p>
        ) : activeShifts.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {t("staff.noShiftsToRoster", "Create a work shift first — there is nothing to assign yet.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky start-0 z-10 border-b bg-card px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground">
                    {t("staff.employee", "Employee")}
                  </th>
                  <th className="border-b px-1 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Sun className="size-3.5" />
                      {t("staff.everyDay", "Every day")}
                    </span>
                  </th>
                  {WEEK_COLUMNS.map((d) => (
                    <th key={d.value} className="border-b px-1 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                      {t(d.labelKey, d.fallback)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const entry = roster.get(e.id);
                  // A block belongs to its branch (SC-1): offer this person
                  // only their own branches' blocks and business-wide ones.
                  const theirs = activeShifts.filter(
                    (s) => !s.branch_id || (e.branch_ids ?? []).includes(s.branch_id),
                  );
                  return (
                    <tr key={e.id} className="[&:first-child>td]:border-t-0">
                      <td className="sticky start-0 z-10 max-w-[12rem] truncate border-t bg-card px-4 py-1.5 font-medium">
                        {e.name}
                      </td>
                      <Cell
                        busy={busyCell === `${e.id}:all`}
                        assignment={entry?.everyDay}
                        shifts={theirs}
                        onPick={(shiftId) =>
                          void setCell(e.id, null, entry?.everyDay, shiftId)
                        }
                      />
                      {WEEK_COLUMNS.map((d) => (
                        <Cell
                          key={d.value}
                          weekday={d.value}
                          busy={busyCell === `${e.id}:${d.value}`}
                          assignment={entry?.byWeekday[d.value]}
                          inherited={entry?.everyDay}
                          shifts={theirs}
                          onPick={(shiftId) =>
                            void setCell(e.id, d.value, entry?.byWeekday[d.value], shiftId)
                          }
                        />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Cell({
  assignment,
  inherited,
  shifts,
  weekday,
  busy,
  onPick,
}: {
  /** A weekday cell offers only the blocks that run that day, at that day's
   *  times; the every-day cell offers them all (the server rosters a block
   *  only on its own days). */
  weekday?: number;
  assignment: ScheduleAssignment | undefined;
  /** The every-day row this cell falls back to when it has none of its own. */
  inherited?: ScheduleAssignment;
  shifts: WorkShift[];
  busy: boolean;
  onPick: (shiftId: string | null) => void;
}) {
  const { t } = useTranslation();
  const effective = assignment ?? inherited;
  const offered = weekday === undefined ? shifts : shifts.filter((s) => (s.valid_days ?? []).includes(weekday));
  const timesOf = (s: WorkShift) => {
    const own = weekday === undefined ? undefined : (s.day_times ?? []).find((d) => d.day_of_week === weekday);
    return `${(own?.start_time ?? s.start_time).slice(0, 5)}–${(own?.end_time ?? s.end_time).slice(0, 5)}`;
  };

  return (
    <td className="border-t px-1 py-1.5 text-center last:pe-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className={[
              "h-8 w-full truncate rounded-md border px-2 text-xs transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "hover:bg-accent hover:text-accent-foreground",
              assignment
                ? "border-transparent bg-secondary font-medium text-foreground"
                : effective
                  ? "border-dashed text-muted-foreground"
                  : "border-dashed text-muted-foreground/60",
            ].join(" ")}
          >
            {busy ? (
              <Loader2 className="mx-auto size-3.5 animate-spin" />
            ) : (
              effective?.work_shift_name ?? t("staff.restDay", "Rest")
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>{t("staff.assignShift", "Assign shift")}</DropdownMenuLabel>
          {offered.map((s) => (
            <DropdownMenuItem key={s.id} onSelect={() => onPick(s.id)}>
              <span className="flex-1">{s.name}</span>
              <span dir="ltr" className="font-mono text-xs text-muted-foreground tabular-nums">
                {timesOf(s)}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            // Only meaningful when this cell owns a row: clearing an inherited
            // cell would silently do nothing, so it stays disabled instead.
            disabled={!assignment}
            onSelect={() => onPick(null)}
          >
            {t("staff.clearCell", "Rest day")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}
