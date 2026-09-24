import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Moon, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteWorkShift, useListBranches, useListWorkShifts } from "@/data/api/generated/api";
import type { WorkShift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { dawamQuery } from "@/features/dawam/live";
import { DawamRefreshButton } from "@/features/dawam/refresh-button";
import { invalidateWorkShifts, WEEKDAYS } from "./util";
import { ScheduleGrid } from "./schedule-grid";
import { WEEK_ORDER, WorkShiftDialog } from "./work-shift-dialog";

export function WorkShiftsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const shiftsQ = useListWorkShifts({ query: dawamQuery() });
  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branches = useMemo(() => branchesQ.data ?? [], [branchesQ.data]);
  const branchName = (id: string | null | undefined) =>
    id ? (branches.find((b) => b.id === id)?.name ?? "") : t("staff.wholeBusiness", "Every branch");
  const dayList = (days: number[]) =>
    days.length === 7
      ? t("staff.everyDay", "Every day")
      : WEEK_ORDER.filter((d) => days.includes(d))
          .map((d) => { const w = WEEKDAYS.find((x) => x.value === d)!; return t(w.labelKey, w.fallback); })
          .join(" ");
  const [editing, setEditing] = useState<WorkShift | null>(null);
  const [creating, setCreating] = useState(false);

  const shifts = useMemo(() => shiftsQ.data ?? [], [shiftsQ.data]);

  const removeShift = async (shift: WorkShift) => {
    const ok = await confirm({
      title: t("staff.deleteShiftTitle", { name: shift.name, defaultValue: `Delete the ${shift.name} shift?` }),
      description: t(
        "staff.deleteShiftHint",
        "Attendance already recorded against this shift is kept. If anyone is still rostered on it, deactivate it instead.",
      ),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteWorkShift(shift.id);
      toast.success(t("staff.shiftDeleted", "Work shift deleted"));
      void invalidateWorkShifts();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("staff.workShifts", "Work shifts")}
        description={t(
          "staff.workShiftsSubtitle",
          "Working hours and the roster that assigns them. These are HR schedules — separate from cash-drawer shifts.",
        )}
        actions={
          <>
            <DawamRefreshButton />
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              {t("staff.newShift", "New shift")}
            </Button>
          </>
        }
      />

      <section className="space-y-3">
        <SectionHeader title={t("staff.shiftsSection", "Shifts")} count={shiftsQ.isLoading || shiftsQ.error ? undefined : shifts.length} />
      {shiftsQ.isLoading ? (
        <ListCard>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5">
              <Skeleton className="size-9 rounded-[10px]" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/4" /><Skeleton className="h-3 w-1/3" /></div>
            </div>
          ))}
        </ListCard>
      ) : shiftsQ.error ? (
        <ErrorState
          title={t("staff.shiftsLoadError", "Couldn't load work shifts")}
          onRetry={() => void shiftsQ.refetch()}
          retrying={shiftsQ.isFetching}
        />
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t("staff.noShifts", "No work shifts yet")}
          description={t(
            "staff.noShiftsHint",
            "Create a shift with its start and end time, then roster people onto it.",
          )}
          action={<Button onClick={() => setCreating(true)}>{t("staff.newShift", "New shift")}</Button>}
        />
      ) : (
        <ListCard>
          {shifts.map((s) => (
            <ListRow
              key={s.id}
              icon={s.crosses_midnight ? Moon : Clock}
              className={s.is_active ? undefined : "text-muted-foreground"}
              title={s.name}
              meta={
                <>
                  <bdi className="font-mono tabular-nums">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</bdi>
                  {s.crosses_midnight ? ` · ${t("staff.crossesMidnight", "Runs past midnight")}` : ""}
                  {" · "}
                  {t("staff.graceBadge", "{{n}} min grace", { n: s.grace_minutes })}
                  {" · "}
                  {t("staff.otBadge", "OT ×{{n}}", { n: s.overtime_multiplier })}
                  {" · "}
                  {branchName(s.branch_id)}
                  {" · "}
                  {dayList(s.valid_days ?? [])}
                  {(s.day_times ?? []).length
                    ? ` · ${t("staff.ownTimesOn", { n: (s.day_times ?? []).length, defaultValue: "own times on {{n}} days" })}`
                    : ""}
                </>
              }
              trailing={
                <>
                  {s.over_presence_cap ? (
                    <StatusPill tone="warning" icon={TriangleAlert}>{t("staff.overCapShort", "Over the presence limit")}</StatusPill>
                  ) : null}
                  {!s.is_active ? <StatusPill tone="neutral">{t("staff.inactive", "Inactive")}</StatusPill> : null}
                  <RowAction label={t("common.edit", "Edit")} onClick={() => setEditing(s)}>
                    <Pencil className="size-4" />
                  </RowAction>
                  <RowAction destructive label={t("staff.deleteShift", "Delete work shift")} onClick={() => void removeShift(s)}>
                    <Trash2 className="size-4" />
                  </RowAction>
                </>
              }
            />
          ))}
        </ListCard>
      )}
      </section>

      <ScheduleGrid shifts={shifts} />

      <WorkShiftDialog
        branches={branches}
        shift={editing}
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />
    </Page>
  );
}
