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
import { dawamQuery, failedEmpty } from "@/features/dawam/live";
import { DawamRefreshButton } from "@/features/dawam/refresh-button";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { invalidateStaff } from "./util";
import { ScheduleGrid } from "./schedule-grid";
import { WorkShiftDialog } from "./work-shift-dialog";
import { endsNextDay, formatSpan, spanMinutes, summarizeDays } from "@/components/inputs";
import { useLang } from "@/components/inputs/use-lang";
import { fmtWireTime } from "@/lib/format";

export function WorkShiftsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const authz = useAuthz();
  // Offer only what the server allows (AT-11): a branch manager edits their
  // branch's blocks but can't add or remove blocks, and a business-wide block
  // needs the roster right at every branch.
  const canCreate = authz.can(Cap.hrScheduleCreate);
  const canDelete = authz.can(Cap.hrScheduleDelete);
  const canEdit = authz.can(Cap.hrScheduleEdit);
  // A business-wide block needs the right at every branch (/authz/me `everywhere`, B-SETUP-3).
  const canEditShift = (s: WorkShift) =>
    canEdit && (!!s.branch_id || (authz.canEverywhere(Cap.hrScheduleEdit) && (authz.owner || canCreate)));
  const canDeleteShift = (s: WorkShift) => canDelete && (!!s.branch_id || authz.canEverywhere(Cap.hrScheduleDelete));
  const shiftsQ = useListWorkShifts({ query: dawamQuery() });
  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branches = useMemo(() => branchesQ.data ?? [], [branchesQ.data]);
  const branchName = (id: string | null | undefined) =>
    id ? (branches.find((b) => b.id === id)?.name ?? "") : t("staff.wholeBusiness", "Every branch");
  const { lang } = useLang();
  // "Sat – Wed", "Thu, Fri", "Every day": a run of days reads as a range.
  const dayList = (days: number[]) =>
    summarizeDays(days, lang, t("staff.everyDay", "Every day"), t("inputs.noDays", "No days"));
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
      // The Dawam roster lists the blocks too (H2-D13).
      void invalidateStaff();
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
            {canCreate ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                {t("staff.newShift", "New shift")}
              </Button>
            ) : null}
          </>
        }
      />

      <section className="space-y-3">
        <SectionHeader title={t("staff.shiftsSection", "Shifts")} count={shiftsQ.isLoading || failedEmpty(shiftsQ) ? undefined : shifts.length} />
      {shiftsQ.isLoading ? (
        <ListCard>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5">
              <Skeleton className="size-9 rounded-[10px]" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/4" /><Skeleton className="h-3 w-1/3" /></div>
            </div>
          ))}
        </ListCard>
      ) : failedEmpty(shiftsQ) ? (
        <ErrorState
          title={t("staff.shiftsLoadError", "Couldn't load work shifts")}
          onRetry={() => void shiftsQ.refetch()}
          retrying={shiftsQ.isFetching}
        />
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t("staff.noShifts", "No work shifts yet")}
          description={
            canCreate
              ? t("staff.noShiftsHintV2", "A shift is a block of time people are rostered on, like Morning 8 AM–4 PM or a night that ends after midnight. Start from a common one, then roster people onto it.")
              : t("staff.noShiftsNoAccess", "Nobody has made a shift yet. Making shifts needs the right to create schedules: ask the owner.")
          }
          action={canCreate ? <Button onClick={() => setCreating(true)}><Plus className="size-4" />{t("staff.newShift", "New shift")}</Button> : undefined}
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
                  <bdi className="tabular-nums">{fmtWireTime(s.start_time)} – {fmtWireTime(s.end_time)}</bdi>
                  {(() => { const n = spanMinutes(s.start_time, s.end_time); return n ? ` (${formatSpan(n, lang)})` : ""; })()}
                  {s.crosses_midnight || endsNextDay(s.start_time, s.end_time) ? ` · ${t("inputs.endsNextDay", "Ends the next day")}` : ""}
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
                  {canEditShift(s) ? (
                    <RowAction label={t("common.edit", "Edit")} onClick={() => setEditing(s)}>
                      <Pencil className="size-4" />
                    </RowAction>
                  ) : null}
                  {canDeleteShift(s) ? (
                    <RowAction destructive label={t("staff.deleteShift", "Delete work shift")} onClick={() => void removeShift(s)}>
                      <Trash2 className="size-4" />
                    </RowAction>
                  ) : null}
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
        wholeBusiness={authz.canEverywhere(editing ? Cap.hrScheduleEdit : Cap.hrScheduleCreate)}
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
