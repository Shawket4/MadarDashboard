import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, Plus, Users, Phone, Armchair, BellRing, MoreVertical, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useListBookings, useListFloorTables, assignTables, notifyBooking, updateBooking,
} from "@/data/api/generated/api";
import type { BookingView, FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { BookingDialog } from "./booking-dialog";
import { invalidateBookings, invalidateFloor } from "./util";

const STATUS_CLASS: Record<string, string> = {
  requested: "bg-muted text-muted-foreground",
  confirmed: "bg-info/15 text-info",
  notified: "bg-warning/15 text-warning",
  arrived: "bg-warning/15 text-warning",
  seated: "bg-success/15 text-success",
  completed: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
};

const TRANSITIONS: { status: string; labelKey: string; fallback: string }[] = [
  { status: "confirmed", labelKey: "reservations.markConfirmed", fallback: "Confirm" },
  { status: "arrived", labelKey: "reservations.markArrived", fallback: "Mark arrived" },
  { status: "completed", labelKey: "reservations.markCompleted", fallback: "Complete" },
  { status: "no_show", labelKey: "reservations.markNoShow", fallback: "No-show" },
  { status: "cancelled", labelKey: "reservations.markCancelled", fallback: "Cancel" },
];

export function HostBoard({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const bookingsQ = useListBookings({ branch_id: branchId }, { query: { enabled: !!branchId } });
  const bookings = useMemo(() => bookingsQ.data ?? [], [bookingsQ.data]);

  const [addOpen, setAddOpen] = useState(false);
  const [seating, setSeating] = useState<BookingView | null>(null);

  const reservations = bookings.filter((b) => b.reserved_for);
  const waitlist = bookings.filter((b) => !b.reserved_for);

  const setStatus = async (b: BookingView, status: string) => {
    try {
      await updateBooking(b.id, { status });
      toast.success(t("reservations.bookingUpdated", "Booking updated"));
      void invalidateBookings();
      void invalidateFloor();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const notify = async (b: BookingView) => {
    try {
      await notifyBooking(b.id);
      toast.success(t("reservations.nudgeSent", "Nudge sent"));
      void invalidateBookings();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const Row = (b: BookingView) => (
    <Card key={b.id} className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{b.customer_name}</span>
          <Badge variant="outline" className={`border-transparent ${STATUS_CLASS[b.status] ?? ""}`}>
            {t(`reservations.status_${b.status}`, b.status)}
          </Badge>
          {b.table_ids.length > 0 ? (
            <Badge variant="outline" className="gap-1"><Armchair className="size-3" />{b.table_ids.length}</Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="size-3" />{b.party_size}</span>
          <span className="flex items-center gap-1"><Phone className="size-3" />{b.customer_phone}</span>
          {b.reserved_for ? (
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3" />
              {new Date(b.reserved_for).toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => setSeating(b)}>
          <Armchair className="size-4" /> {t("reservations.seat", "Seat")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void notify(b)} aria-label={t("reservations.notify", "Notify")}>
          <BellRing className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label={t("common.more", "More")}><MoreVertical className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {TRANSITIONS.map((tr) => (
              <DropdownMenuItem key={tr.status} onClick={() => void setStatus(b, tr.status)}>
                {t(tr.labelKey, tr.fallback)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );

  if (bookingsQ.isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> {t("reservations.newBooking", "New booking")}</Button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t("reservations.noBookings", "No active bookings")}
          description={t("reservations.noBookingsHint", "Reservations and waitlist parties appear here.")}
          action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> {t("reservations.newBooking", "New booking")}</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("reservations.reservations", "Reservations")} ({reservations.length})</h3>
            {reservations.length ? reservations.map(Row) : <p className="text-sm text-muted-foreground">{t("reservations.none", "None")}</p>}
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("reservations.waitlist", "Waitlist")} ({waitlist.length})</h3>
            {waitlist.length ? waitlist.map(Row) : <p className="text-sm text-muted-foreground">{t("reservations.none", "None")}</p>}
          </section>
        </div>
      )}

      <BookingDialog branchId={branchId} open={addOpen} onOpenChange={setAddOpen} />
      <SeatDialog
        branchId={branchId}
        booking={seating}
        onClose={() => setSeating(null)}
      />
    </div>
  );
}

/** Pick one or more tables to seat a party (multiple ⇒ merged tables). */
function SeatDialog({ branchId, booking, onClose }: { branchId: string; booking: BookingView | null; onClose: () => void }) {
  const { t } = useTranslation();
  const tablesQ = useListFloorTables({ branch_id: branchId }, { query: { enabled: !!booking } });
  const tables = useMemo(() => tablesQ.data ?? [], [tablesQ.data]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirm = async () => {
    if (!booking || picked.length === 0) return;
    setBusy(true);
    try {
      await assignTables(booking.id, { table_ids: picked });
      toast.success(t("reservations.seated", "Party seated"));
      void invalidateBookings();
      void invalidateFloor();
      setPicked([]);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const tableBtn = (tb: FloorTable) => {
    const on = picked.includes(tb.id);
    return (
      <button
        key={tb.id}
        type="button"
        onClick={() => toggle(tb.id)}
        className={`rounded-lg border p-2 text-start text-sm transition ${on ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
      >
        <div className="font-semibold">{tb.label}</div>
        <div className="text-xs text-muted-foreground">{tb.seats} {t("reservations.seatsShort", "seats")} · {t(`reservations.status_${tb.status}`, tb.status)}</div>
      </button>
    );
  };

  return (
    <Dialog open={!!booking} onOpenChange={(o) => { if (!o) { setPicked([]); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("reservations.seatParty", "Seat {{name}}", { name: booking?.customer_name ?? "" })}
          </DialogTitle>
        </DialogHeader>
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {tables.length ? tables.map(tableBtn) : (
            <p className="col-span-full text-sm text-muted-foreground">{t("reservations.noTablesToSeat", "No tables — add some in the Floor tab.")}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setPicked([]); onClose(); }}>{t("common.cancel", "Cancel")}</Button>
          <Button disabled={busy || picked.length === 0} onClick={() => void confirm()}>
            {busy ? t("common.saving", "Saving…") : t("reservations.confirmSeat", "Seat ({{n}})", { n: picked.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
