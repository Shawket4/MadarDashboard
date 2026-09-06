/**
 * Per-branch booking settings: the online switch, the weekly window, slot and
 * duration, party limits, lead/horizon, the hold and no-show grace, reminders,
 * the OTP switch, an optional covers cap, and blackout dates.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/app/date-picker";
import { SegmentedControl } from "@/components/app/segmented-control";
import { putBookingSettings, useGetBookingSettings } from "@/data/api/generated/api";
import type { BookingSettings } from "@/data/api/generated/models/bookingSettings";
import type { HoursEntry } from "@/data/api/generated/models/hoursEntry";
import { getErrorMessage } from "@/data/api/errors";

import { invalidateBookings } from "./util";

interface Props {
  branchId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const DOWS = [0, 1, 2, 3, 4, 5, 6] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted p-3">
      <div>
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function BookingSettingsDialog({ branchId, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const q = useGetBookingSettings({ branch_id: branchId }, { query: { enabled: open } });
  const [s, setS] = useState<BookingSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [blackout, setBlackout] = useState("");

  useEffect(() => {
    if (open && q.data) setS(structuredClone(q.data));
  }, [open, q.data]);

  const dayName = (dow: number) =>
    new Intl.DateTimeFormat(i18n.language.startsWith("ar") ? "ar-EG" : "en-GB", { weekday: "long", timeZone: "UTC" })
      .format(new Date(Date.UTC(2024, 0, 7 + dow)));

  const hoursFor = (dow: number): HoursEntry | undefined => s?.hours.find((h) => h.dow === dow);
  const setHours = (dow: number, entry: HoursEntry | null) => {
    if (!s) return;
    const rest = s.hours.filter((h) => h.dow !== dow);
    setS({ ...s, hours: entry ? [...rest, entry].sort((a, b) => a.dow - b.dow) : rest });
  };

  const num = (v: string): number => (v === "" ? 0 : Number(v));
  const optNum = (v: string): number | null => (v === "" ? null : Number(v));

  const save = async () => {
    if (!s) return;
    setBusy(true);
    try {
      await putBookingSettings(s);
      toast.success(t("common.savedChanges", "Changes saved"));
      await invalidateBookings();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("bookings.settingsTitle", "Booking settings")}</DialogTitle>
          <DialogDescription>{t("bookings.settingsHint", "How this branch takes bookings. Host bookings work regardless of the online switch.")}</DialogDescription>
        </DialogHeader>

        {!s ? (
          <p className="text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
        ) : (
          <div className="space-y-5">
            <Toggle
              label={t("bookings.enabled", "Accept online bookings")}
              hint={t("bookings.enabledHint", "Guests can book from the reservations site. Off = the site says booking isn't open.")}
              checked={s.enabled}
              onChange={(v) => setS({ ...s, enabled: v })}
            />
            <Toggle
              label={t("bookings.requireOtp", "Verify phone by WhatsApp code")}
              hint={t("bookings.requireOtpHint", "Online guests confirm their number before a table is held for them.")}
              checked={s.require_otp}
              onChange={(v) => setS({ ...s, require_otp: v })}
            />

            <div className="space-y-2">
              <Label>{t("bookings.hours", "Booking hours")}</Label>
              <div className="rounded-lg border divide-y">
                {DOWS.map((dow) => {
                  const h = hoursFor(dow);
                  return (
                    <div key={dow} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox checked={!!h} onCheckedChange={(c) => setHours(dow, c ? { dow, open: "12:00", close: "23:00" } : null)} aria-label={dayName(dow)} />
                      <span className="w-24 text-sm">{dayName(dow)}</span>
                      {h ? (
                        <div className="flex items-center gap-2" dir="ltr">
                          <Input value={h.open} onChange={(e) => setHours(dow, { ...h, open: e.target.value })} className="w-20 font-mono" placeholder="12:00" />
                          <span className="text-muted-foreground">–</span>
                          <Input value={h.close} onChange={(e) => setHours(dow, { ...h, close: e.target.value })} className="w-20 font-mono" placeholder="23:00" />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t("bookings.closed", "Closed")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t("bookings.hoursHint", "24-hour times. A close before the open time means after midnight.")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("bookings.slot", "Slot length")}>
                <SegmentedControl
                  value={String(s.slot_minutes)}
                  onChange={(v) => setS({ ...s, slot_minutes: Number(v) })}
                  options={[{ value: "15", label: "15" }, { value: "30", label: "30" }, { value: "60", label: "60" }]}
                />
              </Field>
              <Field label={t("bookings.defaultDuration", "Default duration (min)")}>
                <Input type="number" min={15} max={600} step={15} value={s.default_duration_minutes} onChange={(e) => setS({ ...s, default_duration_minutes: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.minParty", "Smallest party online")}>
                <Input type="number" min={1} value={s.min_party} onChange={(e) => setS({ ...s, min_party: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.maxParty", "Largest party online")} hint={t("bookings.maxPartyHint", "Bigger groups are asked to call.")}>
                <Input type="number" min={1} value={s.max_party} onChange={(e) => setS({ ...s, max_party: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.leadTime", "Lead time (min)")} hint={t("bookings.leadTimeHint", "Earliest an online booking may start from now.")}>
                <Input type="number" min={0} value={s.lead_time_minutes} onChange={(e) => setS({ ...s, lead_time_minutes: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.horizon", "Book up to (days ahead)")}>
                <Input type="number" min={1} max={365} value={s.horizon_days} onChange={(e) => setS({ ...s, horizon_days: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.hold", "Hold table from (min before)")} hint={t("bookings.holdHint", "The floor and the POS show the table as reserved from then.")}>
                <Input type="number" min={0} max={180} value={s.hold_minutes} onChange={(e) => setS({ ...s, hold_minutes: num(e.target.value) })} />
              </Field>
              <Field label={t("bookings.autoNoShow", "Auto no-show after (min)")} hint={t("bookings.autoNoShowHint", "Blank = only when the booking window ends.")}>
                <Input type="number" min={5} max={240} value={s.auto_no_show_minutes ?? ""} onChange={(e) => setS({ ...s, auto_no_show_minutes: optNum(e.target.value) })} />
              </Field>
              <Field label={t("bookings.reminder", "WhatsApp reminder (min before)")} hint={t("bookings.reminderHint", "Blank = no reminder.")}>
                <Input type="number" min={15} max={2880} value={s.reminder_lead_minutes ?? ""} onChange={(e) => setS({ ...s, reminder_lead_minutes: optNum(e.target.value) })} />
              </Field>
              <Field label={t("bookings.coversCap", "Max guests starting per slot")} hint={t("bookings.coversCapHint", "Blank = only the tables limit it.")}>
                <Input type="number" min={1} value={s.max_covers_per_slot ?? ""} onChange={(e) => setS({ ...s, max_covers_per_slot: optNum(e.target.value) })} />
              </Field>
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.blackouts", "Blackout dates")}</Label>
              <div className="flex flex-wrap items-center gap-2">
                {s.blackout_dates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                    {d}
                    <button type="button" aria-label={t("common.remove", "Remove")} onClick={() => setS({ ...s, blackout_dates: s.blackout_dates.filter((x) => x !== d) })}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <DatePicker value={blackout} onChange={setBlackout} dateOnly disablePast placeholder={t("bookings.addBlackout", "Add a date")} />
                <Button type="button" size="sm" variant="outline" disabled={!blackout || s.blackout_dates.includes(blackout)} onClick={() => { setS({ ...s, blackout_dates: [...s.blackout_dates, blackout].sort() }); setBlackout(""); }}>
                  {t("common.add", "Add")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("bookings.blackoutsHint", "No online slots on these days. Hosts can still book by hand.")}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button type="button" onClick={() => void save()} loading={busy} disabled={!s}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
