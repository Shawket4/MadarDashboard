/**
 * The guest's manage link (from the WhatsApp confirmation): see the booking,
 * move it to another open slot, or cancel — while the branch's lead time
 * still allows; after that it says to call.
 */
import { useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { CalendarClock, CalendarX2, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGetPublicBookingQueryKey, useBookingSlots, useCancelPublicBooking, useGetPublicBooking, useUpdatePublicBooking,
} from "@/data/api/generated/api";
import { queryClient } from "@/data/api/query";
import { getErrorMessage } from "@/data/api/errors";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { cn } from "@/lib/utils";

import { fmtDay, fmtSlot, fmtWhen, pickableDates } from "./util";

const STATUS_KEY: Record<string, string> = {
  confirmed: "reservations.statusConfirmed",
  seated: "reservations.statusSeated",
  completed: "reservations.statusCompleted",
  no_show: "reservations.statusNoShow",
  cancelled: "reservations.statusCancelled",
};

export function ManagePage({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
  }, []);

  // A manage link is keyed by its own token and `PublicBookingView` carries no
  // org id, so the shop can only be found by the host it is being served from —
  // which brands a shop's own domain and leaves our generic origin as Madar's.
  const brand = usePublicBrand();

  const q = useGetPublicBooking(token, { query: { retry: false } });
  const b = q.data;
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdatePublicBooking();
  const cancel = useCancelPublicBooking();

  const today = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("en-CA", { timeZone: b?.timezone ?? "Africa/Cairo" }).format(d);
  }, [b?.timezone]);
  const dates = useMemo(() => pickableDates(today, 30), [today]);
  const slotsQ = useBookingSlots(b?.branch_id ?? "", { date: date ?? "", party_size: b?.party_size ?? 1 }, { query: { enabled: moving && !!b && !!date, retry: false } });

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetPublicBookingQueryKey(token) });

  const doMove = async () => {
    if (!slot) return;
    setError(null);
    try {
      await update.mutateAsync({ token, data: { starts_at: slot } });
      setMoving(false);
      setSlot(null);
      await refresh();
    } catch (e) {
      setError(e instanceof AxiosError && e.response?.status === 409 ? t("reservations.slotTaken", "That time just filled up — please pick another.") : getErrorMessage(e));
    }
  };
  const doCancel = async () => {
    if (!window.confirm(t("reservations.cancelConfirm", "Cancel this booking?"))) return;
    setError(null);
    try {
      await cancel.mutateAsync({ token });
      await refresh();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <StorefrontShell brand={brand}>
      <div className="mx-auto w-full max-w-[480px] px-4 pb-10">
        {q.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32 rounded-2xl" /></div>
        ) : !b ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <CalendarX2 className="size-8 text-muted-foreground" />
            <h1 className="font-serif text-xl font-semibold">{t("reservations.notFound", "We couldn’t find that booking")}</h1>
            <p className="text-sm text-muted-foreground">{t("reservations.notFoundHint", "The link may be old. Please call the venue.")}</p>
          </div>
        ) : (
          <section className="space-y-5">
            <header>
              <p className="text-xs font-medium uppercase tracking-wide text-brand">{b.branch_name}</p>
              <h1 className="font-serif text-2xl font-semibold text-balance">{t("reservations.yourBooking", "Your booking")}</h1>
            </header>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarClock className="size-5 text-brand" />
                <div>
                  <p className="font-medium">{fmtWhen(b.starts_at, b.timezone, lang)}</p>
                  <p className="text-xs text-muted-foreground">{t("reservations.until", "until {{time}}", { time: fmtSlot(b.ends_at, b.timezone, lang) })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="size-5 text-brand" />
                <p>{t("reservations.partyOf", "Party of {{count}}", { count: b.party_size })} · {b.guest_name}</p>
              </div>
              <p className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", b.status === "confirmed" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                {t(STATUS_KEY[b.status] ?? "reservations.statusConfirmed", b.status)}
              </p>
              {b.notes ? <p className="text-sm text-muted-foreground">{b.notes}</p> : null}
            </div>

            {b.can_modify ? (
              moving ? (
                <div className="space-y-3">
                  <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
                    {dates.map((d) => (
                      <button key={d} type="button" onClick={() => { setDate(d); setSlot(null); }} className={cn("shrink-0 rounded-xl border px-3 py-2 text-sm", d === date ? "border-brand bg-brand text-brand-foreground" : "border-border/70 bg-card")}>
                        <span className="block text-[11px] opacity-80">{fmtDay(d, lang, { weekday: "short" })}</span>
                        <span className="block font-semibold">{fmtDay(d, lang, { day: "numeric", month: "short" })}</span>
                      </button>
                    ))}
                  </div>
                  {date ? (
                    slotsQ.isLoading ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : (
                      <div className="grid grid-cols-4 gap-2">
                        {(slotsQ.data?.slots ?? []).map((s) => (
                          <button key={s.starts_at} type="button" disabled={!s.available} onClick={() => setSlot(s.starts_at)} className={cn("rounded-xl border px-2 py-2.5 text-sm tabular-nums", slot === s.starts_at ? "border-brand bg-brand text-brand-foreground" : s.available ? "border-border/70 bg-card" : "border-dashed text-muted-foreground/40 line-through")}>
                            {fmtSlot(s.starts_at, b.timezone, lang)}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("reservations.pickDay", "Pick a day.")}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setMoving(false); setSlot(null); }}>{t("common.cancel", "Cancel")}</Button>
                    <Button className="flex-1" disabled={!slot} loading={update.isPending} onClick={() => void doMove()}>{t("reservations.moveConfirm", "Move booking")}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setMoving(true)}>{t("reservations.move", "Change time")}</Button>
                  <Button variant="destructive" className="flex-1" loading={cancel.isPending} onClick={() => void doCancel()}>{t("reservations.cancel", "Cancel booking")}</Button>
                </div>
              )
            ) : b.status === "confirmed" ? (
              <p className="text-center text-sm text-muted-foreground">{t("reservations.tooLate", "It’s too close to your time to change online — please call the venue.")}</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </section>
        )}
      </div>
    </StorefrontShell>
  );
}
