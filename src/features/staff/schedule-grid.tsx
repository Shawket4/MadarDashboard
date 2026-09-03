import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange, Loader2, Sun } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  // No user_id = the whole org's roster in one request.
  const assignmentsQ = useListAssignments({});
  const [busyCell, setBusyCell] = useState<string | null>(null);

  const activeShifts = useMemo(() => shifts.filter((s) => s.is_active), [shifts]);
  const employees = employeesQ.data ?? [];

  /** `user_id` → { everyDay, byWeekday[0..6] }, newest effective_from winning.
   *  The list arrives ordered `effective_from DESC`, so the FIRST row seen for a
   *  slot is the one in force — later ones are superseded history. */
  const roster = useMemo(() => {
    type Row = {
      everyDay?: ScheduleAssignment;
      byWeekday: (ScheduleAssignment | undefined)[];
    };
    const map = new Map<string, Row>();
    for (const a of assignmentsQ.data ?? []) {
      const entry: Row = map.get(a.user_id) ?? {
        byWeekday: new Array<ScheduleAssignment | undefined>(7).fill(undefined),
      };
      if (a.day_of_week === null || a.day_of_week === undefined) {
        entry.everyDay ??= a;
      } else if (a.day_of_week >= 0 && a.day_of_week <= 6) {
        entry.byWeekday[a.day_of_week] ??= a;
      }
      map.set(a.user_id, entry);
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
          user_id: userId,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4" />
          {t("staff.roster", "Roster")}
        </CardTitle>
        <CardDescription>
          {t(
            "staff.gridHint",
            "Click a cell to set that day's shift. A weekday cell beats the every-day column; an empty cell is a rest day.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employeesQ.isLoading || assignmentsQ.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("staff.noEmployeesYet", "No active employees to roster.")}
          </p>
        ) : activeShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("staff.noShiftsToRoster", "Create a work shift first — there is nothing to assign yet.")}
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card px-2 py-2 text-start font-medium">
                    {t("staff.employee", "Employee")}
                  </th>
                  <th className="px-1 py-2 text-center font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Sun className="size-3.5" />
                      {t("staff.everyDay", "Every day")}
                    </span>
                  </th>
                  {WEEKDAYS.map((d) => (
                    <th key={d.value} className="px-1 py-2 text-center font-medium">
                      {t(d.labelKey, d.fallback)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const entry = roster.get(e.user_id);
                  return (
                    <tr key={e.user_id} className="border-t">
                      <td className="sticky left-0 z-10 max-w-[12rem] truncate border-t bg-card px-2 py-1.5 font-medium">
                        {e.name}
                      </td>
                      <Cell
                        busy={busyCell === `${e.user_id}:all`}
                        assignment={entry?.everyDay}
                        shifts={activeShifts}
                        onPick={(shiftId) =>
                          void setCell(e.user_id, null, entry?.everyDay, shiftId)
                        }
                      />
                      {WEEKDAYS.map((d) => (
                        <Cell
                          key={d.value}
                          busy={busyCell === `${e.user_id}:${d.value}`}
                          assignment={entry?.byWeekday[d.value]}
                          inherited={entry?.everyDay}
                          shifts={activeShifts}
                          onPick={(shiftId) =>
                            void setCell(e.user_id, d.value, entry?.byWeekday[d.value], shiftId)
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
      </CardContent>
    </Card>
  );
}

function Cell({
  assignment,
  inherited,
  shifts,
  busy,
  onPick,
}: {
  assignment: ScheduleAssignment | undefined;
  /** The every-day row this cell falls back to when it has none of its own. */
  inherited?: ScheduleAssignment;
  shifts: WorkShift[];
  busy: boolean;
  onPick: (shiftId: string | null) => void;
}) {
  const { t } = useTranslation();
  const effective = assignment ?? inherited;

  return (
    <td className="border-t px-1 py-1.5 text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className={[
              "w-full truncate rounded-md border px-2 py-1.5 text-xs transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              assignment
                ? "border-primary/30 bg-primary/10 font-medium"
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
          {shifts.map((s) => (
            <DropdownMenuItem key={s.id} onSelect={() => onPick(s.id)}>
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-muted-foreground">
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
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
