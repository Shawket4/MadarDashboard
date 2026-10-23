/**
 * Joining the rewards programme, from the QR on a counter.
 *
 * THE CARD IS THE PAGE. What the customer is getting is the shop's own card —
 * its logo, its colours, its photograph, the stamps — so that card leads the
 * page from the first frame, exactly as it will look, and fills in as they go:
 * their name appears on it as they type it, the code's place is kept for it,
 * and when they join the code lands there and the card is theirs. Everything
 * else happens in the space under it, one step at a time:
 *
 *   details ──▶ (code, when the shop asks for one) ──▶ done
 *      └──▶ known: this number already has a card ──▶ code ──▶ done
 *
 * Filled in standing at a till, one-handed, with a queue behind: three fields
 * at most (a name, a birthday where the shop runs birthdays, a WhatsApp
 * number), one button, and the small print said plainly before it is pressed.
 *
 * Every flag on `JoinInfo` drives something visible here:
 *   `enabled`          off → a notice in the shop's chrome, no form
 *   `require_otp`      whether a WhatsApp code is asked for before the card
 *   `mode`, `next_reward_cost`, `earn_piastres_per_point`   the card and the
 *                      sentence under the heading
 *   `stamp_unit`       what a stamp counts (order, item, stamp), in every line
 *                      that prints a figure
 *   `rewards[]`        what the stamps buy, under the form
 *   `birthday_enabled` / `birthday_reward_amount`   the birthday field, and its WHY
 *   `terms` / `terms_ar`   the programme's small print, in the reader's language
 *   `branch_name`      where they are joining, over the heading
 *   `member_count`     "1,200+ people already have this card", only past 100
 *   `brand`            the card, the controls' colour, the names, the links
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, MapPin, PenLine, Users, WifiOff } from "lucide-react";

import { BirthdayField } from "@/components/inputs/birthday-field";
import { EMPTY_BIRTHDAY, type Birthday } from "@/components/inputs/birthday";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { LEGAL_URLS } from "@/config/legal";
import { getErrorMessage } from "@/data/api/errors";
import { useLoyaltyJoin, useLoyaltyJoinInfo } from "@/data/api/generated/api";
import type { JoinResult } from "@/data/api/generated/models";
import { clearDeviceToken } from "@/features/public-shell/guest";
import { stepSwap, useStepDirection } from "@/features/public-shell/motion";
import { MadarFooter } from "@/features/public-shell/storefront-shell";
import { useErrorToast } from "@/features/public-shell/public-toaster";
import { useOtpTransport, usePhoneOtp, type PhoneOtpTransport } from "@/features/public-shell/use-phone-otp";
import { clock, useCountdown } from "@/components/inputs/countdown";
import { DEFAULT_REGION, phoneFromNational } from "@/components/inputs/national-phone";
import { OtpInput } from "@/components/inputs/otp-input";
import { PhoneInput } from "@/components/inputs/phone-input";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { SwapPresence, prefersReducedMotion, usePop, useShake } from "@/lib/motion";
import { formatPhoneDisplay } from "@/lib/phone";
import { resolveBrand, type ResolvedBrand } from "@/components/loyalty-card/card-brand";
import { LoyaltyCard } from "@/components/loyalty-card/loyalty-card";
import { stampUnit, type StampUnit } from "@/components/loyalty-card/wording";

import { stampUnitOf, type JoinInfoNext as JoinInfo } from "./api-next";
import { PressedCard, PressRest, PressStage } from "./card-press";
import { NAME_MAX, detailsReady, joinPayload, ruleKind } from "./join-form";
import { LoyaltyPage, PageNotice, PageSkeleton, Section, usePageAccent } from "./page-shell";
import { RewardsList } from "./rewards-list";
import { SocialLinks } from "./social-links";
import { usePassDownload } from "./use-pass-download";
import { WalletButtons } from "./wallet-buttons";

/** The WhatsApp code's length (`delivery::public::generate_otp_code`). */
const CODE_LENGTH = 4;
/** One live code per phone per minute (`otp_request`); the resend waits that long. */
const RESEND_AFTER_MS = 60_000;

const LINK =
  "rounded font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** The browser's own word on whether there is a network; re-read when it changes. */
const subscribeOnline = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine !== false, () => true);

export function JoinPage({
  branchId,
  orgId,
}: {
  /** One branch's counter code. */
  branchId?: string;
  /** The shop's own code — no branch, and none needed. */
  orgId?: string;
}) {
  const { t, i18n } = useTranslation();
  const info = useLoyaltyJoinInfo(branchId ? { branch_id: branchId } : { org_id: orgId });
  const online = useOnline();

  if (info.isLoading) return <PageSkeleton />;

  const data = info.data as JoinInfo | undefined;
  if (!data) {
    // A code that leads nowhere — a branch since closed, a link mistyped —
    // is not a network fault, and "try again" would be a lie. It gets the
    // same honest notice as a programme that is switched off.
    const status = info.error instanceof AxiosError ? info.error.response?.status : undefined;
    if (status === 404) {
      return (
        <PageNotice
          title={t("loyalty.offTitle", "No rewards program here")}
          body={t("loyalty.offBody", "This branch isn't running a rewards program at the moment.")}
        />
      );
    }
    // Offline is its own sentence: nothing is wrong with the page, and it
    // loads by itself when the network is back (React Query refetches then).
    return online ? (
      <PageNotice
        title={t("loyalty.couldntLoad", "We couldn't load this page")}
        body={t("loyalty.couldntLoadBody", "Check your connection and try again.")}
        onRetry={() => void info.refetch()}
      />
    ) : (
      <PageNotice
        icon={WifiOff}
        title={t("loyalty.offlineTitle", "You're offline")}
        body={t("loyalty.offlineBody", "Connect to the internet and this page will load by itself.")}
        onRetry={() => void info.refetch()}
      />
    );
  }

  const brand = resolveBrand(data.brand, i18n.resolvedLanguage ?? "en");
  if (!data.enabled) {
    // In the shop's own chrome: it is still their page, there is simply
    // nothing to join here today.
    return (
      <PageNotice
        brand={brand}
        title={t("loyalty.offTitle", "No rewards program here")}
        body={t("loyalty.offBody", "This branch isn't running a rewards program at the moment.")}
      />
    );
  }

  return <JoinFlow data={data} brand={brand} branchId={branchId} orgId={orgId} online={online} />;
}

type Phase = "details" | "known" | "code" | "done";
const PHASES: readonly Phase[] = ["details", "known", "code", "done"];

function JoinFlow({
  data,
  brand,
  branchId,
  orgId,
  online,
}: {
  data: JoinInfo;
  brand: ResolvedBrand;
  branchId?: string;
  orgId?: string;
  online: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en").startsWith("ar") ? "ar" : "en";
  const accent = usePageAccent(brand);
  const join = useLoyaltyJoin();

  // The details, kept as typed: going back to change the number keeps the rest.
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState<Birthday>(EMPTY_BIRTHDAY);
  const [national, setNational] = useState("");
  const [region, setRegion] = useState(DEFAULT_REGION);
  const phone = phoneFromNational(national, region);
  const details = { name, phone, birthday };

  const [joined, setJoined] = useState<JoinResult | null>(null);
  // The server's "this number already has a card, and this device has not
  // proved it owns the number": no card yet, an invitation to prove it.
  const [known, setKnown] = useState<JoinResult | null>(null);
  // The shop asks for a code and the proof this device held ran out: ask anew.
  const [mustProve, setMustProve] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Also as a toast: the inline copy sits where the customer may have scrolled from.
  useErrorToast(error);

  // The shared WhatsApp-code machine, through a transport that notes when a
  // code went out (the resend waits the server's minute) and takes "a code was
  // just sent" (409) as sent: that code is live for five minutes and still works.
  const shared = useOtpTransport();
  const [sentAt, setSentAt] = useState<number | null>(null);
  const transport = useMemo<PhoneOtpTransport>(
    () => ({
      ...shared,
      requestCode: async (to: string) => {
        try {
          await shared.requestCode(to);
        } catch (e) {
          if (!(e instanceof AxiosError && e.response?.status === 409)) throw e;
        }
        setSentAt(Date.now());
      },
    }),
    [shared],
  );

  const submit = async (canonical: string, deviceToken: string | null) => {
    setError(null);
    try {
      const result = await join.mutateAsync({
        data: joinPayload({ info: data, branchId, orgId, details, phone: canonical, deviceToken, locale: lang }),
      });
      if (result.verify_required) {
        // Any token we held for the phone is stale: forget it, or the code
        // step would be skipped again and the page would loop.
        clearDeviceToken(canonical);
        setKnown(result);
        return;
      }
      // Whatever went wrong on the way here is over.
      toast.dismiss();
      setJoined(result);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 401) {
        clearDeviceToken(canonical);
        setMustProve(true);
        setError(t("loyalty.proveFirst", "This shop confirms numbers with a WhatsApp code. Tap “Get my card” again and we'll send you one."));
        return;
      }
      setError(getErrorMessage(e));
    }
  };

  const otp = usePhoneOtp({
    otpRequired: data.require_otp || known !== null || mustProve,
    onVerified: (p, token) => void submit(p, token),
    transport,
  });
  // The machine holds the phone it proves; the field holds digits and a country.
  const { setPhone } = otp;
  useEffect(() => setPhone(phone ? `+${phone}` : ""), [phone, setPhone]);

  const phase: Phase = joined ? "done" : otp.stage === "otp" ? "code" : known ? "known" : "details";
  const stepDir = useStepDirection(phase, PHASES);

  // The card, as it is now: the preview at zero until there is a member.
  const mode = joined?.mode ?? data.mode;
  const unit = stampUnit(mode, stampUnitOf(data));
  const target = joined?.next_reward_cost ?? data.next_reward_cost;
  const balance = joined?.balance ?? 0;
  const memberToken = joined?.member_token ?? "";
  // The Apple pass is made on demand; the page owns that wait (`card-press.tsx`).
  const pass = usePassDownload(joined?.passes?.apple_url);
  // While the membership itself is being made, the card shows it being pressed.
  const pressPhase = join.isPending ? "making" : pass.phase;

  // Joined: the card answers with a pop, and the page goes back to it.
  const cardRef = useRef<HTMLDivElement>(null);
  usePop(cardRef, joined ? 1 : 0);
  useEffect(() => {
    if (joined && window.scrollY > 0) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [joined]);

  const shopTerms = (lang === "ar" && data.terms_ar) || data.terms || "";
  const announce =
    phase === "code"
      ? t("loyalty.codeSentAnnounce", { phone: formatPhoneDisplay(phone), defaultValue: "We sent a code to {{phone}} on WhatsApp." })
      : phase === "known"
        ? t("loyalty.knownTitle", "This number already has a card")
        : phase === "done"
          ? joined?.already_member
            ? t("loyalty.welcomeBack", "Welcome back")
            : t("loyalty.youreIn", "You're in")
          : "";

  return (
    <LoyaltyPage brand={brand} headerMark={false} footer={false}>
      <PressStage phase={pressPhase}>
        <div ref={cardRef}>
          <PressedCard brand={brand}>
            <LoyaltyCard
              brand={brand}
              mode={mode}
              unit={unit}
              balance={balance}
              target={target}
              member={{
                name: joined ? joined.name : name.trim() || null,
                placeholder: t("loyalty.namePreview", "Your name"),
                codePending: true,
                qrUrl: joined ? `/api/public/loyalty/card/${encodeURIComponent(memberToken)}/qr.png` : null,
              }}
            />
          </PressedCard>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {/* Each step brings what follows it, Madar's footer included, so a
            swap only ever removes and adds: nothing below the card is left
            behind to jump when the network answers. */}
        <SwapPresence
          swapKey={phase}
          initial={false}
          recipe={stepSwap(stepDir, i18n.dir() === "rtl")}
          className="flex flex-col gap-8"
        >
          {phase === "details" ? (
            <Details
              data={data}
              brand={brand}
              unit={unit}
              accent={accent}
              name={name}
              setName={setName}
              birthday={birthday}
              setBirthday={setBirthday}
              national={national}
              setNational={setNational}
              region={region}
              setRegion={setRegion}
              ready={detailsReady(details)}
              online={online}
              busy={otp.sending || join.isPending}
              joining={join.isPending}
              problem={otp.error ?? error}
              hasTerms={!!shopTerms}
              onSubmit={() => void otp.start()}
            />
          ) : phase === "known" && known ? (
            <Known
              known={known}
              brand={brand}
              sending={otp.sending}
              problem={otp.error}
              onSendCode={() => void otp.start()}
              onChangeNumber={() => setKnown(null)}
            />
          ) : phase === "code" ? (
            <Code
              phone={phone}
              online={online}
              verifying={otp.verifying}
              joining={join.isPending}
              sending={otp.sending}
              codeError={otp.error}
              joinError={error}
              resetSignal={otp.resetSignal}
              sentAt={sentAt}
              onComplete={(c) => void otp.verify(c)}
              onResend={() => void otp.resend()}
              onRetryJoin={() => void otp.start()}
              onChangeNumber={() => {
                setKnown(null);
                otp.changeNumber();
              }}
            />
          ) : joined ? (
            <Done joined={joined} data={data} unit={unit} accent={accent} pass={pass} memberToken={memberToken} />
          ) : null}
          {phase === "details" ? (
            <>
              <RewardsList rewards={data.rewards} accent={accent} unit={unit} />
              {shopTerms ? (
                // The consent line's "programme terms" lands here.
                <div id="loyalty-terms" className="scroll-mt-24">
                  <Section title={t("loyalty.termsHeading", "Terms")}>
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">{shopTerms}</p>
                  </Section>
                </div>
              ) : null}
              <SocialLinks links={data.brand.social_links} accent={accent} />
            </>
          ) : null}
          <MadarFooter product="loyalty" />
        </SwapPresence>
      </PressStage>
    </LoyaltyPage>
  );
}

/** A label, a line on what it is for, and the control: the one shape every field here takes. */
function Field({
  label,
  labelId,
  htmlFor,
  optional,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  label: string;
  labelId?: string;
  htmlFor?: string;
  optional?: boolean;
  hint?: ReactNode;
  hintId?: string;
  /** What is missing, once the button has been pressed without it. */
  error?: string | null;
  errorId?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label id={labelId} htmlFor={htmlFor} className="text-[15px] font-semibold leading-tight">
          {label}
          {optional ? <span className="ms-1.5 font-normal text-muted-foreground">{t("loyalty.optional", "(optional)")}</span> : null}
        </label>
        {hint ? (
          <p id={hintId} className="text-[13px] leading-snug text-muted-foreground text-pretty">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={errorId} className="text-sm text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * How many people already hold the card, when it is worth saying: the server
 * sends a figure only past 100 members, rounded DOWN, and this checks again,
 * so a small shop shows nothing and no figure is ever made up here. Part of
 * the page's first render (it arrives with the programme), so it moves nothing.
 */
function MemberCount({ count }: { count: number | null | undefined }) {
  const { t } = useTranslation();
  if (count == null || !(count > 100)) return null;
  return (
    <p className="flex items-center gap-2 text-[13px] leading-snug text-muted-foreground">
      <Users aria-hidden className="size-4 shrink-0" />
      {t("loyalty.memberCount", {
        count,
        n: fmtNumber(count),
        defaultValue_one: "{{n}}+ person already has this card",
        defaultValue_other: "{{n}}+ people already have this card",
      })}
    </p>
  );
}

/**
 * The sentence under the heading: the programme in one line, from what the shop
 * configured, and what earns a stamp here (an order, an item, or the counter's
 * say-so). The target is a bare count: the first sentence has said what it counts.
 */
function ruleSentence(data: JoinInfo, unit: StampUnit, t: ReturnType<typeof useTranslation>["t"]): string {
  const count = data.next_reward_cost;
  switch (ruleKind(data)) {
    case "stampsWithTarget":
      return unit === "item"
        ? t("loyalty.ruleItems", { count, defaultValue: "A stamp for every item you buy. Collect {{count}} for a reward." })
        : unit === "stamp"
          ? t("loyalty.ruleCounter", { count, defaultValue: "Your card is stamped at the counter. Collect {{count}} for a reward." })
          : t("loyalty.ruleStamps", { count, defaultValue: "A stamp for every order. Collect {{count}} for a reward." });
    case "stamps":
      return unit === "item"
        ? t("loyalty.introItems", "A stamp for every item you buy, and a reward when the card is full.")
        : unit === "stamp"
          ? t("loyalty.introCounter", "Your card is stamped at the counter, and a reward comes when it's full.")
          : t("loyalty.introVisits", "A stamp for every order, and a reward when the card is full.");
    case "pointsWithTarget":
      return t("loyalty.rulePoints", {
        count,
        amount: fmtMoney(data.earn_piastres_per_point),
        defaultValue: "A point for every {{amount}} you spend. Collect {{count}} for a reward.",
      });
    case "pointsRate":
      return t("loyalty.rulePointsRate", {
        amount: fmtMoney(data.earn_piastres_per_point),
        defaultValue: "A point for every {{amount}} you spend, and a reward when they add up.",
      });
    default:
      return t("loyalty.introPoints", "Points on everything you buy here, and a reward when they add up.");
  }
}

function Details({
  data, brand, unit, accent, name, setName, birthday, setBirthday, national, setNational, region, setRegion,
  ready, online, busy, joining, problem, hasTerms, onSubmit,
}: {
  data: JoinInfo;
  brand: ResolvedBrand;
  unit: StampUnit;
  accent: string;
  name: string;
  setName: (v: string) => void;
  birthday: Birthday;
  setBirthday: (v: Birthday) => void;
  national: string;
  setNational: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  ready: boolean;
  online: boolean;
  busy: boolean;
  joining: boolean;
  problem: string | null;
  hasTerms: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const gift = data.birthday_reward_amount ?? 0;
  // The button is never a grey mystery: pressed too early, it says what is
  // missing under that field, shakes its head, and puts the cursor there.
  const [attempted, setAttempted] = useState(false);
  const [refused, setRefused] = useState(0);
  const cta = useRef<HTMLDivElement>(null);
  useShake(cta, refused);
  const nameMissing = attempted && !name.trim();

  return (
    <PressRest>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!online || busy) return;
          if (!ready) {
            setAttempted(true);
            setRefused((n) => n + 1);
            document.getElementById(name.trim() ? "loyalty-phone" : "loyalty-name")?.focus();
            return;
          }
          onSubmit();
        }}
        // A field the button sends the cursor to clears the sticky header.
        className="flex flex-col gap-7 [&_button]:scroll-mt-24 [&_input]:scroll-mt-24"
      >
        <header className="flex flex-col gap-2">
          {data.branch_name ? (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: accent }}>
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              {data.branch_name}
            </p>
          ) : null}
          {/* Whose card, by name: the shop first, its programme on the card. */}
          <h1 className="font-serif text-[28px] leading-[1.1] text-balance">
            {t("loyalty.getYourCard", { shop: brand.orgName, defaultValue: "Get your {{shop}} card" })}
          </h1>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
            {ruleSentence(data, unit, t)}
          </p>
          <MemberCount count={data.member_count} />
        </header>

        <div className="flex flex-col gap-6">
          <Field
            label={t("loyalty.yourName", "Your name")}
            htmlFor="loyalty-name"
            errorId="loyalty-name-error"
            error={nameMissing ? t("loyalty.nameMissing", "Add your name — it goes on your card.") : null}
          >
            <Input
              id="loyalty-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              maxLength={NAME_MAX}
              enterKeyHint="next"
              aria-invalid={nameMissing || undefined}
              aria-describedby={nameMissing ? "loyalty-name-error" : undefined}
              placeholder={t("loyalty.namePlaceholder", "So we know who to thank")}
              className="h-12 rounded-xl bg-card px-4 text-base md:text-base dark:bg-card"
            />
          </Field>

          {/* Only where the shop turned birthdays on. A birthday is the most
              sensitive thing this form collects, and a shop not running
              birthday rewards is never given one to hold. Month and day only:
              the programme never stores a year. */}
          {data.birthday_enabled ? (
            <Field
              label={t("loyalty.yourBirthday", "Your birthday")}
              labelId="loyalty-birthday-label"
              optional
              hintId="loyalty-birthday-hint"
              hint={
                // Say what it is FOR, and what is not being asked.
                gift <= 0
                  ? t("loyalty.birthdayNoGift", "So we can wish you a happy birthday. We don't ask for the year.")
                  : unit !== "points"
                    ? t("loyalty.birthdayGiftStamps", {
                        count: gift,
                        defaultValue_one: "We'll wish you a happy birthday and add {{count}} stamp to your card. We don't ask for the year.",
                        defaultValue_other: "We'll wish you a happy birthday and add {{count}} stamps to your card. We don't ask for the year.",
                      })
                    : t("loyalty.birthdayGiftPoints", {
                        count: gift,
                        defaultValue_one: "We'll wish you a happy birthday and add {{count}} point to your card. We don't ask for the year.",
                        defaultValue_other: "We'll wish you a happy birthday and add {{count}} points to your card. We don't ask for the year.",
                      })
              }
            >
              <BirthdayField
                id="loyalty-birthday"
                value={birthday}
                onChange={setBirthday}
                title={t("loyalty.yourBirthday", "Your birthday")}
                aria-labelledby="loyalty-birthday-label"
                aria-describedby="loyalty-birthday-hint"
                className="h-12 rounded-xl bg-card text-base dark:bg-card"
              />
            </Field>
          ) : null}

          <Field
            label={t("reservations.phoneTitle", "Your WhatsApp number")}
            htmlFor="loyalty-phone"
            hintId="loyalty-phone-hint"
            hint={
              data.require_otp
                ? t("loyalty.phoneHintCode", "We'll send a 4-digit code there to confirm it's yours.")
                : t("loyalty.phoneHint", "Your card is tied to this number — it's how the counter finds you.")
            }
          >
            <PhoneInput
              id="loyalty-phone"
              value={national}
              onChange={setNational}
              region={region}
              onRegionChange={setRegion}
              showIssues={attempted}
              aria-describedby="loyalty-phone-hint"
            />
          </Field>
        </div>

        {/* Pulled up by the phone field's message row, which it keeps even when
            empty so a message never pushes the button down. */}
        <div ref={cta} className="-mt-4 flex flex-col gap-3">
          {!online ? (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm leading-snug">
              <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("loyalty.offlineForm", "You're offline. Connect to the internet to get your card — what you've typed stays here.")}
            </p>
          ) : null}
          {problem ? (
            <p role="alert" className="flex items-start gap-2 text-sm leading-snug text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {problem}
            </p>
          ) : null}
          <Button type="submit" size="lg" loading={busy} disabled={!online} className="h-12 w-full rounded-xl text-base">
            {t("loyalty.getMyCard", "Get my card")}
          </Button>
          {joining ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner />
              {t("loyalty.creating", "Making your card…")}
            </p>
          ) : null}
          <Consent shop={brand.orgName} hasTerms={hasTerms} />
        </div>
      </form>
    </PressRest>
  );
}

/**
 * The small print, before the button is pressed and in plain words: what
 * joining agrees to, and the one thing the shop may do with the number. No box
 * to tick: the API records no consent, and a box that saves nothing would only
 * look like a choice. The way out it names is real (the card page's switch).
 */
function Consent({ shop, hasTerms }: { shop: string; hasTerms: boolean }) {
  const privacy = <a href={LEGAL_URLS.privacy} target="_blank" rel="noopener noreferrer" className={LINK} />;
  return (
    <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
      {hasTerms ? (
        <Trans
          i18nKey="loyalty.consentTerms"
          values={{ shop }}
          defaults="By joining you agree to the <terms>programme terms</terms> and Madar's <privacy>Privacy Policy</privacy>. {{shop}} may send you WhatsApp messages about your card and rewards; you can turn them off from your card at any time."
          components={{ terms: <a href="#loyalty-terms" className={LINK} />, privacy }}
        />
      ) : (
        <Trans
          i18nKey="loyalty.consent"
          values={{ shop }}
          defaults="By joining you agree to Madar's <privacy>Privacy Policy</privacy>. {{shop}} may send you WhatsApp messages about your card and rewards; you can turn them off from your card at any time."
          components={{ privacy }}
        />
      )}
    </p>
  );
}

/** This number already has a card: say so, and offer the two ways back to it. */
function Known({
  known, brand, sending, problem, onSendCode, onChangeNumber,
}: {
  known: JoinResult;
  brand: ResolvedBrand;
  sending: boolean;
  problem: string | null;
  onSendCode: () => void;
  onChangeNumber: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-[1.1] text-balance">{t("loyalty.knownTitle", "This number already has a card")}</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
          {known.card_link_sent
            ? t("loyalty.knownLinkSent", {
                shop: brand.orgName,
                defaultValue: "We've sent your {{shop}} card's link to this number on WhatsApp — open it there. Or confirm it's yours with a code, and we'll bring the card back here.",
              })
            : t("loyalty.knownCode", {
                shop: brand.orgName,
                defaultValue: "Confirm it's yours with a WhatsApp code, and we'll bring your {{shop}} card back here.",
              })}
        </p>
      </header>
      {problem ? (
        <p role="alert" className="flex items-start gap-2 text-sm leading-snug text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {problem}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Button size="lg" loading={sending} onClick={onSendCode} className="h-12 w-full rounded-xl text-base">
          {t("loyalty.sendMeACode", "Send me a code")}
        </Button>
        <button type="button" onClick={onChangeNumber} className={`${LINK} mx-auto min-h-11 px-2 text-sm`}>
          {t("loyalty.useAnotherNumber", "Use a different number")}
        </button>
      </div>
    </div>
  );
}

/** The WhatsApp code: where it went, the four boxes, a resend that waits the server's minute. */
function Code({
  phone, online, verifying, joining, sending, codeError, joinError, resetSignal, sentAt,
  onComplete, onResend, onRetryJoin, onChangeNumber,
}: {
  phone: string | null;
  online: boolean;
  verifying: boolean;
  joining: boolean;
  sending: boolean;
  codeError: string | null;
  joinError: string | null;
  resetSignal: number;
  sentAt: number | null;
  onComplete: (code: string) => void;
  onResend: () => void;
  onRetryJoin: () => void;
  onChangeNumber: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  // A wrong code or a fresh one empties the boxes (the machine bumps the signal).
  const [seen, setSeen] = useState(resetSignal);
  if (seen !== resetSignal) {
    setSeen(resetSignal);
    setCode("");
  }
  const resendIn = useCountdown(sentAt === null ? null : sentAt + RESEND_AFTER_MS);

  return (
    <PressRest>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-[28px] leading-[1.1] text-balance">{t("loyalty.checkWhatsApp", "Check your WhatsApp")}</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <Trans
              i18nKey="loyalty.codeSentTo"
              values={{ phone: formatPhoneDisplay(phone) }}
              defaults="We sent a 4-digit code to <ph>{{phone}}</ph>."
              components={{ ph: <bdi dir="ltr" className="font-medium tabular-nums text-foreground" /> }}
            />{" "}
            <button type="button" onClick={onChangeNumber} className={`${LINK} inline-flex items-center gap-1 align-baseline`}>
              <PenLine aria-hidden className="size-3.5" />
              {t("loyalty.changeNumber", "Change")}
            </button>
          </p>
        </header>

        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            // A new attempt: the last one's toast is history.
            if (v) toast.dismiss();
          }}
          onComplete={onComplete}
          length={CODE_LENGTH}
          invalid={!!codeError && code === ""}
          busy={verifying}
          disabled={!online || joining}
          refocus={resetSignal}
          autoFocus
        />

        {!online ? (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm leading-snug">
            <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("loyalty.offlineCode", "You're offline. Your code will still work when you're back.")}
          </p>
        ) : null}
        {codeError ? (
          <p role="alert" className="text-center text-sm text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">
            {codeError}
          </p>
        ) : null}
        {joinError ? (
          <div role="alert" className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">{joinError}</p>
            <Button variant="outline" onClick={onRetryJoin} className="rounded-full">
              {t("loyalty.passRetry", "Try again")}
            </Button>
          </div>
        ) : null}
        {joining ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Spinner />
            {t("loyalty.creating", "Making your card…")}
          </p>
        ) : null}

        <div className="flex flex-col items-center gap-1 text-sm">
          <button
            type="button"
            disabled={resendIn > 0 || sending || !online}
            onClick={onResend}
            className={`${LINK} inline-flex min-h-11 items-center gap-2 px-2 disabled:cursor-not-allowed disabled:font-normal disabled:text-muted-foreground disabled:no-underline`}
          >
            {sending ? <Spinner /> : null}
            {resendIn > 0
              ? t("signup.resendIn", { time: clock(resendIn), defaultValue: "Resend the code in {{time}}" })
              : t("signup.resend", "Send the code again")}
          </button>
          <p className="text-center text-[13px] text-muted-foreground text-pretty">
            {t("loyalty.codeNote", "It can take a moment to arrive, and it works for five minutes.")}
          </p>
        </div>
      </div>
    </PressRest>
  );
}

/** What happens next, for someone who has just joined: how this card fills. */
function joinedLine(unit: StampUnit, t: ReturnType<typeof useTranslation>["t"]): string {
  switch (unit) {
    case "points":
      return t("loyalty.joinedPoints", "Show it when you pay, and every purchase earns points.");
    case "item":
      return t("loyalty.joinedItem", "Show it when you pay, and every item you buy adds a stamp.");
    case "stamp":
      return t("loyalty.joinedCounter", "Show it at the counter to collect your stamps.");
    default:
      return t("loyalty.joinedOrder", "Show it when you pay, and every order adds a stamp.");
  }
}

/** Signing up ends by showing the thing they just got — already up there — and how to keep it. */
function Done({
  joined, data, unit, accent, pass, memberToken,
}: {
  joined: JoinResult;
  data: JoinInfo;
  unit: StampUnit;
  accent: string;
  pass: ReturnType<typeof usePassDownload>;
  memberToken: string;
}) {
  const { t } = useTranslation();
  const passes = joined.passes ?? null;
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-[1.1] text-balance">
          {joined.already_member ? t("loyalty.welcomeBack", "Welcome back") : t("loyalty.youreIn", "You're in")}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
          {joined.already_member
            ? t("loyalty.alreadyMember", "You're already a member — here's your card again.")
            : joinedLine(unit, t)}
        </p>
      </header>

      {passes?.any ? (
        <div className="flex flex-col items-center gap-3">
          <WalletButtons passes={passes} pass={pass} />
          <p className="max-w-[34ch] text-center text-[13px] leading-snug text-muted-foreground">
            {t("loyalty.walletHint", "It updates itself every time you earn, and it's there when you're back.")}
          </p>
        </div>
      ) : null}

      <PressRest>
        <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-xl text-base">
          <a href={`/card/${encodeURIComponent(memberToken)}`}>
            {t("loyalty.viewCard", "View my card")}
            <ArrowRight className="rtl:rotate-180" aria-hidden />
          </a>
        </Button>
        <SocialLinks links={joined.brand.social_links ?? data.brand.social_links} accent={accent} />
      </PressRest>
    </div>
  );
}
