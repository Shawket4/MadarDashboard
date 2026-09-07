/**
 * The guest's booking flow on reservations.madar-pos.cloud:
 *   branch (when the link has none) → when (date · party · slot) → you
 *   (name · WhatsApp number, with a code when the branch asks) → confirmed.
 *
 * Brand register (hospitable, editorial), bilingual, RTL-correct, and honest:
 * a branch with online booking off says so instead of showing a dead form.
 */
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { ArrowLeft, CalendarCheck, ChevronRight, Loader2, Minus, Plus, Store, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBookingBranches, useBookingInfo, useBookingSlots, useCreatePublicBooking,
} from "@/data/api/generated/api";
import type { PublicBookingInfo } from "@/data/api/generated/models/publicBookingInfo";
import type { PublicBookingView } from "@/data/api/generated/models/publicBookingView";
import { getErrorMessage } from "@/data/api/errors";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { getGuestPhone, setGuestPhone } from "@/features/public-shell/guest";
import { cn } from "@/lib/utils";

import { PhoneVerify } from "./phone-verify";
import { fmtDay, fmtSlot, fmtWhen, pickableDates } from "./util";

type Step = "branch" | "when" | "you" | "done";

interface Props {
  orgId: string;
  branchId?: string;
}

export function ReservePage({ orgId, branchId: initialBranch }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.resolvedLanguage ?? "en";

  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
  }, []);

  const [branchId, setBranchId] = useState<string | null>(initialBranch ?? null);
  const [step, setStep] = useState<Step>(initialBranch ? "when" : "branch");
  const [date, setDate] = useState<string | null>(null);
  const [party, setParty] = useState(2);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<PublicBookingView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const branchesQ = useBookingBranches({ org_id: orgId }, { query: { enabled: step === "branch" } });
  const infoQ = useBookingInfo(branchId ?? "", { query: { enabled: !!branchId, retry: false } });
  const info = infoQ.data;

  useEffect(() => {
    if (info && !date) {
      setDate(info.today);
      setParty((p) => Math.min(Math.max(p, info.min_party), info.max_party));
    }
  }, [info, date]);

  const slotsQ = useBookingSlots(
    branchId ?? "",
    { date: date ?? "", party_size: party },
    { query: { enabled: !!branchId && !!date && !!info?.enabled, retry: false } },
  );
  const create = useCreatePublicBooking();

  const dates = useMemo(() => (info ? pickableDates(info.today, Math.min(info.horizon_days, 60)) : []), [info]);
  const blackouts = useMemo(() => new Set(info?.blackout_dates ?? []), [info]);

  const submit = async (phone: string, deviceToken: string | null) => {
    if (!branchId || !slot) return;
    setError(null);
    try {
      const res = await create.mutateAsync({
        data: {
          branch_id: branchId,
          starts_at: slot,
          party_size: party,
          guest_name: name.trim(),
          phone,
          device_token: deviceToken,
          notes: notes.trim() || null,
          locale: lang.startsWith("ar") ? "ar" : "en",
        },
      });
      setGuestPhone(orgId, phone);
      setDone(res);
      setStep("done");
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 409) {
        setError(t("reservations.slotTaken", "That time just filled up — please pick another."));
        setStep("when");
        setSlot(null);
        void slotsQ.refetch();
      } else {
        setError(getErrorMessage(e));
      }
    }
  };

  const back = () => {
    if (step === "you") setStep("when");
    else if (step === "when" && !initialBranch) { setStep("branch"); setBranchId(null); setDate(null); setSlot(null); }
  };

  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-[480px] px-4 pb-10">
        {step !== "done" && (step === "you" || (step === "when" && !initialBranch)) ? (
          <button type="button" onClick={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("common.back", "Back")}
          </button>
        ) : null}

        {step === "branch" ? (
          <section className="space-y-4">
            <header>
              <h1 className="font-serif text-2xl font-semibold text-balance">{t("reservations.pickBranch", "Where would you like to sit?")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("reservations.pickBranchHint", "Choose a branch to book a table.")}</p>
            </header>
            {branchesQ.isLoading ? (
              <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : (branchesQ.data ?? []).length === 0 ? (
              <NotOpen />
            ) : (
              <ul className="space-y-3">
                {(branchesQ.data ?? []).map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => { setBranchId(b.id); setStep("when"); void navigate({ to: "/$orgId/$branchId", params: { orgId, branchId: b.id }, replace: true }); }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-start shadow-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand"><Store className="size-5" /></span>
                      <span className="min-w-0 flex-1 font-medium">{b.name}</span>
                      <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {step === "when" ? (
          infoQ.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
          ) : !info || infoQ.isError ? (
            <NotOpen />
          ) : !info.enabled ? (
            <NotOpen name={info.branch_name} />
          ) : (
            <section className="space-y-5">
              <header>
                <p className="text-xs font-medium uppercase tracking-wide text-brand">{info.org_name}</p>
                <h1 className="font-serif text-2xl font-semibold text-balance">{t("reservations.bookAt", "Book a table at {{name}}", { name: info.branch_name })}</h1>
              </header>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("reservations.day", "Day")}</p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
                  {dates.map((d) => {
                    const off = blackouts.has(d);
                    const active = d === date;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={off}
                        onClick={() => { setDate(d); setSlot(null); }}
                        className={cn(
                          "shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors",
                          active ? "border-brand bg-brand text-brand-foreground" : off ? "border-dashed text-muted-foreground/50" : "border-border/70 bg-card hover:bg-muted/40",
                        )}
                      >
                        <span className="block text-[11px] opacity-80">{fmtDay(d, lang, { weekday: "short" })}</span>
                        <span className="block font-semibold">{fmtDay(d, lang, { day: "numeric", month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("reservations.party", "Guests")}</p>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
                  <Users className="size-5 text-brand" />
                  <span className="flex-1 text-sm">{t("reservations.partyOf", "Party of {{count}}", { count: party })}</span>
                  <Button type="button" size="icon" variant="outline" aria-label={t("common.remove", "Remove")} disabled={party <= info.min_party} onClick={() => { setParty(party - 1); setSlot(null); }}><Minus className="size-4" /></Button>
                  <span className="w-6 text-center text-lg font-semibold tabular-nums">{party}</span>
                  <Button type="button" size="icon" variant="outline" aria-label={t("common.add", "Add")} disabled={party >= info.max_party} onClick={() => { setParty(party + 1); setSlot(null); }}><Plus className="size-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("reservations.largeParty", "More than {{max}}? Please call the venue.", { max: info.max_party })}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("reservations.time", "Time")}</p>
                {slotsQ.isLoading ? (
                  <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
                ) : slotsQ.isError ? (
                  <p className="text-sm text-destructive">{getErrorMessage(slotsQ.error)}</p>
                ) : (slotsQ.data?.slots ?? []).length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">{t("reservations.closedDay", "No bookings on this day.")}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {(slotsQ.data?.slots ?? []).map((s) => (
                      <button
                        key={s.starts_at}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSlot(s.starts_at)}
                        aria-pressed={slot === s.starts_at}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-sm tabular-nums transition-colors",
                          slot === s.starts_at ? "border-brand bg-brand text-brand-foreground" : s.available ? "border-border/70 bg-card hover:bg-muted/40" : "border-dashed text-muted-foreground/40 line-through",
                        )}
                      >
                        {fmtSlot(s.starts_at, info.timezone, lang)}
                      </button>
                    ))}
                  </div>
                )}
                {(slotsQ.data?.slots ?? []).length > 0 && !(slotsQ.data?.slots ?? []).some((s) => s.available) ? (
                  <p className="text-xs text-muted-foreground">{t("reservations.fullDay", "Fully booked for this party size — try another day or a smaller party.")}</p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" size="lg" disabled={!slot} onClick={() => setStep("you")}>
                {t("common.next", "Next")}
              </Button>
            </section>
          )
        ) : null}

        {step === "you" && info && slot && date ? (
          <section className="space-y-5">
            <header>
              <h1 className="font-serif text-2xl font-semibold text-balance">{t("reservations.almost", "Almost there")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("reservations.summary", "{{name}} · {{when}} · party of {{count}}", { name: info.branch_name, when: fmtWhen(slot, info.timezone, lang), count: party })}
              </p>
            </header>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("reservations.name", "Your name")}</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t("reservations.namePlaceholder", "Who is the table for?")} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("reservations.notes", "Anything we should know?")} <span className="text-muted-foreground">({t("common.optional", "Optional")})</span></span>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("reservations.notesPlaceholder", "Birthday, high chair, window…")} />
              </label>
            </div>
            {name.trim() ? (
              <PhoneVerify
                otpRequired={info.require_otp}
                initialPhone={getGuestPhone(orgId) ?? ""}
                onVerified={(phone, token) => void submit(phone, token)}
                busy={create.isPending}
                submitLabel={t("reservations.confirm", "Confirm booking")}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">{t("reservations.nameFirst", "Add your name to continue.")}</p>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {create.isPending ? <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{t("reservations.booking", "Holding your table…")}</p> : null}
          </section>
        ) : null}

        {step === "done" && done ? (
          <section className="space-y-5 pt-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success"><CalendarCheck className="size-8" /></span>
            <h1 className="font-serif text-2xl font-semibold text-balance">{t("reservations.doneTitle", "You’re booked, {{name}}!", { name: done.guest_name })}</h1>
            <p className="text-sm text-muted-foreground">
              {t("reservations.doneBody", "{{name}} · {{when}} · party of {{count}}. We’ve sent the details to your WhatsApp.", { name: done.branch_name, when: fmtWhen(done.starts_at, done.timezone, lang), count: done.party_size })}
            </p>
            <Button className="w-full" size="lg" variant="outline" onClick={() => void navigate({ to: "/manage/$token", params: { token: done.manage_token } })}>
              {t("reservations.manage", "View or change my booking")}
            </Button>
          </section>
        ) : null}
      </div>
    </StorefrontShell>
  );
}

/** The honest state: no form that goes nowhere. */
export function NotOpen({ name }: { name?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-serif text-xl font-semibold text-balance">
        {name ? t("reservations.notOpenAt", "{{name}} isn’t taking online bookings yet", { name }) : t("reservations.notOpenTitle", "Online booking isn’t available yet")}
      </h1>
      <p className="text-sm text-muted-foreground text-pretty">{t("reservations.notOpenBody", "Please call the venue to reserve a table.")}</p>
    </div>
  );
}

export type { PublicBookingInfo };
