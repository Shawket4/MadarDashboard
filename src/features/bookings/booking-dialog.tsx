/**
 * Create or edit a booking. The host picks a date, party and a time from the
 * day's availability (the server's best-fit pick is shown per slot); tables are
 * auto-assigned unless the host chooses them. A booking that fits nowhere can
 * still be forced in — it then shows as "needs a table" until reassigned.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/app/date-picker";
import { Combobox } from "@/components/app/combobox";
import {
  createBooking, updateBooking, useBookingAvailability, useListSections,
} from "@/data/api/generated/api";
import type { BookingSettings } from "@/data/api/generated/models/bookingSettings";
import type { BookingView } from "@/data/api/generated/models/bookingView";
import type { FloorTable } from "@/data/api/generated/models/floorTable";
import { getErrorMessage } from "@/data/api/errors";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { invalidateBookings, localHHMM, localInstant, serviceToday } from "./util";

interface Props {
  branchId: string;
  /** The page's date — seeds a new booking. */
  date: string;
  booking: BookingView | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: BookingSettings | undefined;
  tables: FloorTable[];
}

const PHONE_RE = /^\+?\d[\d\s-]{7,}$/;

export function BookingDialog({ branchId, date, booking, open, onOpenChange, settings, tables }: Props) {
  const { t } = useTranslation();
  const editing = !!booking;

  const [day, setDay] = useState(date);
  const [party, setParty] = useState(2);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [manualTables, setManualTables] = useState(false);
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [force, setForce] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    if (booking) {
      setDay(serviceToday(new Date(booking.starts_at)));
      setParty(booking.party_size);
      setStartsAt(booking.starts_at);
      setCustomTime(localHHMM(booking.starts_at));
      setDuration(Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000));
      setName(booking.guest_name);
      setPhone(booking.guest_phone);
      setNotes(booking.notes ?? "");
      setSectionId(booking.section_id ?? null);
      setManualTables(booking.needs_table || booking.table_ids.length > 0);
      setTableIds(booking.table_ids);
      setForce(true);
    } else {
      setDay(date);
      setParty(2);
      setStartsAt(null);
      setCustomTime("");
      setDuration("");
      setName("");
      setPhone("");
      setNotes("");
      setSectionId(null);
      setManualTables(false);
      setTableIds([]);
      setForce(false);
      setSendConfirmation(true);
    }
  }, [open, booking, date]);

  const sectionsQ = useListSections({ branch_id: branchId }, { query: { enabled: open } });
  const availQ = useBookingAvailability(
    { branch_id: branchId, date: day, party_size: Math.max(1, party || 1), section_id: sectionId ?? undefined, exclude_booking_id: booking?.id ?? undefined },
    { query: { enabled: open && !!day && (party || 0) > 0 } },
  );
  const slots = useMemo(() => availQ.data?.slots ?? [], [availQ.data]);
  const selectedSlot = useMemo(() => slots.find((s) => s.starts_at === startsAt) ?? null, [slots, startsAt]);
  const offGrid = !!startsAt && !selectedSlot;

  const seatsChosen = useMemo(
    () => tables.filter((x) => tableIds.includes(x.id)).reduce((n, x) => n + x.seats, 0),
    [tables, tableIds],
  );

  const useCustomTime = () => {
    if (!/^\d{1,2}:\d{2}$/.test(customTime)) {
      setError(t("bookings.errTime", "Enter a time as HH:MM"));
      return;
    }
    setError(null);
    setStartsAt(localInstant(day, customTime));
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError(t("bookings.errName", "Guest name is required"));
    if (!PHONE_RE.test(phone.trim())) return setError(t("bookings.errPhone", "Enter a valid phone number"));
    if (!startsAt) return setError(t("bookings.errSlot", "Pick a time"));
    if (!(party > 0)) return setError(t("bookings.errParty", "Party size must be at least 1"));
    setBusy(true);
    try {
      const table_ids = manualTables ? tableIds : null;
      if (booking) {
        await updateBooking(booking.id, {
          party_size: party,
          starts_at: startsAt,
          duration_minutes: duration === "" ? null : duration,
          guest_name: name.trim(),
          guest_phone: phone.trim(),
          notes,
          section_id: sectionId,
          table_ids,
          force,
        });
        toast.success(t("bookings.updated", "Booking updated"));
      } else {
        await createBooking({
          branch_id: branchId,
          party_size: party,
          starts_at: startsAt,
          duration_minutes: duration === "" ? null : duration,
          guest_name: name.trim(),
          guest_phone: phone.trim(),
          notes: notes || null,
          section_id: sectionId,
          table_ids,
          force,
          send_confirmation: sendConfirmation,
        });
        toast.success(t("bookings.created", "Booking confirmed"));
      }
      await invalidateBookings();
      onOpenChange(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? t("bookings.editTitle", "Edit booking") : t("bookings.newTitle", "New booking")}</DialogTitle>
          <DialogDescription>
            {editing
              ? t("bookings.editHint", "Moving the time or party re-checks the tables; the guest gets a WhatsApp update.")
              : t("bookings.newHint", "Pick a time the room can take; a table is assigned automatically.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="space-y-1.5">
            <Label>{t("bookings.date", "Date")}</Label>
            <DatePicker value={day} onChange={(v) => { setDay(v); setStartsAt(null); }} dateOnly disablePast={!editing} triggerClassName="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-party">{t("bookings.party", "Party")}</Label>
            <Input id="bk-party" type="number" min={1} max={99} inputMode="numeric" value={party} onChange={(e) => setParty(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{t("bookings.time", "Time")}</Label>
            {availQ.isFetching ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
          </div>
          {slots.length === 0 && !availQ.isLoading ? (
            <p className="text-xs text-muted-foreground">{t("bookings.noSlots", "No booking hours on this day — set a custom time below to force one.")}</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {slots.map((s) => {
                const active = s.starts_at === startsAt;
                return (
                  <button
                    key={s.starts_at}
                    type="button"
                    onClick={() => setStartsAt(s.starts_at)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-sm tabular transition-colors",
                      active ? "border-primary bg-primary text-primary-foreground" : s.available ? "hover:bg-muted" : "border-dashed text-muted-foreground/60",
                    )}
                    title={s.available ? undefined : t("bookings.slotFull", "Full for this party")}
                  >
                    {fmtTime(s.starts_at)}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Input value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="19:30" className="w-28 font-mono" dir="ltr" inputMode="numeric" aria-label={t("bookings.customTime", "Custom time")} />
            <Button type="button" variant="outline" size="sm" onClick={useCustomTime}>{t("bookings.useTime", "Use this time")}</Button>
            {startsAt ? (
              <span className="text-xs text-muted-foreground">
                {t("bookings.chosen", "Chosen: {{time}}", { time: fmtTime(startsAt) })}
                {offGrid ? ` · ${t("bookings.offGrid", "outside the booking slots")}` : ""}
              </span>
            ) : null}
          </div>
          {selectedSlot && !selectedSlot.available && !manualTables ? (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5" />
              {t("bookings.slotFullHint", "No table fits this party then. Choose tables yourself, or force the booking and assign later.")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bk-name">{t("bookings.guestName", "Guest name")}</Label>
            <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-phone">{t("bookings.phone", "Phone")}</Label>
            <Input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="01x xxxx xxxx" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("bookings.section", "Preferred section")}</Label>
            <Combobox
              options={[{ value: "", label: t("bookings.anySection", "Anywhere") }, ...(sectionsQ.data ?? []).map((s) => ({ value: s.id, label: s.name }))]}
              value={sectionId ?? ""}
              onChange={(v) => setSectionId(v || null)}
              placeholder={t("bookings.anySection", "Anywhere")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-duration">{t("bookings.duration", "Duration (min)")}</Label>
            <Input id="bk-duration" type="number" min={15} max={600} step={15} inputMode="numeric" value={duration} placeholder={String(settings?.default_duration_minutes ?? 90)} onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bk-notes">{t("bookings.notes", "Notes")}</Label>
          <Textarea id="bk-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("bookings.notesPlaceholder", "Birthday, high chair, window seat…")} />
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("bookings.chooseTables", "Choose tables myself")}</Label>
              <p className="text-xs text-muted-foreground">
                {manualTables
                  ? t("bookings.chooseTablesOn", "Selected: {{seats}} seats for a party of {{party}}", { seats: seatsChosen, party })
                  : selectedSlot?.available
                    ? t("bookings.autoPick", "Auto: {{tables}}", { tables: selectedSlot.table_ids.map((id) => tables.find((x) => x.id === id)?.label ?? "?").join(" + ") })
                    : t("bookings.autoHint", "The smallest table that seats the party is picked; two tables in one section when needed.")}
              </p>
            </div>
            <Switch checked={manualTables} onCheckedChange={setManualTables} />
          </div>
          {manualTables ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {tables.map((x) => {
                const on = tableIds.includes(x.id);
                return (
                  <label key={x.id} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm", on && "border-primary bg-primary/5")}>
                    <Checkbox checked={on} onCheckedChange={(c) => setTableIds(c ? [...tableIds, x.id] : tableIds.filter((id) => id !== x.id))} />
                    <span className="truncate">{x.label}</span>
                    <span className="ms-auto text-xs text-muted-foreground">{x.seats}</span>
                  </label>
                );
              })}
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("bookings.force", "Book even if no table fits")}</Label>
              <p className="text-xs text-muted-foreground">{t("bookings.forceHint", "It shows under “needs a table” until you assign one.")}</p>
            </div>
            <Switch checked={force} onCheckedChange={setForce} />
          </div>
          {!editing ? (
            <div className="flex items-center justify-between">
              <Label>{t("bookings.sendConfirmation", "Send WhatsApp confirmation")}</Label>
              <Switch checked={sendConfirmation} onCheckedChange={setSendConfirmation} />
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="button" onClick={() => void submit()} loading={busy}>
            {editing ? t("common.save", "Save") : t("bookings.confirmBooking", "Confirm booking")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
