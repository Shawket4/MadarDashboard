import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Moon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  createWorkShift, deleteWorkShift, updateWorkShift, useListWorkShifts,
} from "@/data/api/generated/api";
import type { WorkShift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateWorkShifts } from "./util";
import { ScheduleGrid } from "./schedule-grid";

export function WorkShiftsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const shiftsQ = useListWorkShifts();
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
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("staff.newShift", "New shift")}
          </Button>
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
                </>
              }
              trailing={
                <>
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

      <ShiftDialog
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

function ShiftDialog({
  shift,
  open,
  onOpenChange,
}: {
  shift: WorkShift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  // Uncontrolled inputs keyed by shift id: the dialog is short-lived and a
  // controlled mirror of eleven fields buys nothing here.
  const key = shift?.id ?? "new";
  const [isActive, setIsActive] = useState(shift?.is_active ?? true);
  const [paidBreak, setPaidBreak] = useState(shift?.paid_break ?? true);

  const save = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const num = (name: string) => {
      const raw = data.get(name);
      return raw === null || raw === "" ? null : Number(raw);
    };
    const body = {
      name: String(data.get("name") ?? "").trim(),
      start_time: `${String(data.get("start_time"))}:00`,
      end_time: `${String(data.get("end_time"))}:00`,
      grace_minutes: num("grace_minutes"),
      break_minutes: num("break_minutes"),
      paid_break: paidBreak,
      half_day_threshold_minutes: num("half_day_threshold_minutes"),
      overtime_threshold_minutes: num("overtime_threshold_minutes"),
      overtime_multiplier: num("overtime_multiplier"),
      checkin_window_minutes: num("checkin_window_minutes"),
      is_active: isActive,
    };
    setBusy(true);
    try {
      if (shift) await updateWorkShift(shift.id, body);
      else await createWorkShift(body);
      toast.success(t("staff.shiftSaved", "Work shift saved"));
      void invalidateWorkShifts();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setIsActive(shift?.is_active ?? true);
          setPaidBreak(shift?.paid_break ?? true);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent key={key} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {shift ? t("staff.editShift", "Edit work shift") : t("staff.newShift", "New shift")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "staff.shiftDialogHint",
              "An end time at or before the start marks the shift as running past midnight; checkout then lands on the next day.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          id="shift-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save(e.currentTarget);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="sf-name">{t("staff.shiftName", "Name")}</Label>
            <Input id="sf-name" name="name" defaultValue={shift?.name ?? ""} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-start">{t("staff.startTime", "Start")}</Label>
            <Input
              id="sf-start"
              name="start_time"
              type="time"
              defaultValue={shift?.start_time.slice(0, 5) ?? "09:00"}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-end">{t("staff.endTime", "End")}</Label>
            <Input
              id="sf-end"
              name="end_time"
              type="time"
              defaultValue={shift?.end_time.slice(0, 5) ?? "17:00"}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-grace">{t("staff.graceMinutes", "Grace (minutes)")}</Label>
            <Input id="sf-grace" name="grace_minutes" type="number" min="0" defaultValue={shift?.grace_minutes ?? 15} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-break">{t("staff.breakMinutes", "Break (minutes)")}</Label>
            <Input id="sf-break" name="break_minutes" type="number" min="0" defaultValue={shift?.break_minutes ?? 0} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-ot">{t("staff.otThreshold", "Overtime after (minutes)")}</Label>
            <Input
              id="sf-ot"
              name="overtime_threshold_minutes"
              type="number"
              min="0"
              defaultValue={shift?.overtime_threshold_minutes ?? 15}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-mult">{t("staff.otMultiplier", "Overtime multiplier")}</Label>
            <Input
              id="sf-mult"
              name="overtime_multiplier"
              type="number"
              step="0.05"
              min="0.05"
              defaultValue={shift?.overtime_multiplier ?? 1.5}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-half">{t("staff.halfDayThreshold", "Half day below (minutes)")}</Label>
            <Input
              id="sf-half"
              name="half_day_threshold_minutes"
              type="number"
              min="1"
              defaultValue={shift?.half_day_threshold_minutes ?? ""}
              placeholder={t("staff.halfDayDefault", "Half the shift")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-window">{t("staff.checkinWindow", "Check-in opens (minutes early)")}</Label>
            <Input
              id="sf-window"
              name="checkin_window_minutes"
              type="number"
              min="1"
              defaultValue={shift?.checkin_window_minutes ?? 120}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="sf-paid-break">{t("staff.paidBreak", "Paid break")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("staff.paidBreakHint", "When off, the break is subtracted from hours worked.")}
              </p>
            </div>
            <Switch id="sf-paid-break" checked={paidBreak} onCheckedChange={setPaidBreak} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
            <Label htmlFor="sf-active">{t("staff.active", "Active")}</Label>
            <Switch id="sf-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="submit" form="shift-form" disabled={busy}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
