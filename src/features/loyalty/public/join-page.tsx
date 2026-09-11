/**
 * Joining the rewards program, from the QR on a counter:
 *   what you get → your details → your card.
 *
 * Deliberately short. This is filled in standing at a till with a queue behind
 * you, so it asks for as little as the shop has configured and nothing more,
 * and the form comes BEFORE the reward list: the pitch is two figures and one
 * sentence, and the detail is there for the moment after. Honest, too: a
 * branch with the program switched off says so instead of showing a dead form.
 *
 * Every flag on `JoinInfo` drives something visible here:
 *   `enabled`          off → a notice in the shop's chrome, no form
 *   `require_otp`      whether `PhoneVerify` collects a code first
 *   `mode`             the intro sentence, the tiles, and a stamp preview
 *   `next_reward_cost` / `earn_piastres_per_point`  the tiles' figures
 *   `rewards[]`        the list, absent when empty
 *   `birthday_enabled` / `birthday_reward_amount`   the picker, and its WHY
 *   `terms` / `terms_ar`   the small print, in the reader's language
 *   `branch_name`      the eyebrow, or the shop's name for an org-wide code
 *   `brand`            the palette, the names, the logo, the links
 *
 * Built on the same shell as the member's card (`page-shell`), because to the
 * customer they are one thing — you scan a code, you sign up, you get a card.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { AlertCircle, ArrowRight, Loader2, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoyaltyJoinInfo, useLoyaltyJoin } from "@/data/api/generated/api";
import { clearDeviceToken } from "@/features/public-shell/guest";
import type { JoinInfo, JoinResult } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { PhoneVerify } from "@/features/reservations/phone-verify";
import { DURATION, easeOutExpo } from "@/lib/motion";

import { resolveBrand, type ResolvedBrand } from "../shared/brand";
import { BirthdayPicker, isComplete, type Birthday } from "./birthday-picker";
import { CardFace } from "./card-face";
import { HowItWorks } from "./how-it-works";
import { LoyaltyPage, PageNotice, PageSkeleton, Panel, Section, usePageAccent } from "./page-shell";
import { RewardsList } from "./rewards-list";
import { SocialLinks } from "./social-links";
import { WalletButtons } from "./wallet-buttons";

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
  const info = useLoyaltyJoinInfo(
    branchId ? { branch_id: branchId } : { org_id: orgId },
  );
  const [joined, setJoined] = useState<JoinResult | null>(null);

  if (info.isLoading) return <PageSkeleton />;

  const data = info.data;
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
    return (
      <PageNotice
        title={t("loyalty.couldntLoad", "We couldn't load this page")}
        body={t("loyalty.couldntLoadBody", "Check your connection and try again.")}
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

  return joined ? (
    <Joined data={data} joined={joined} brand={brand} />
  ) : (
    <Form
      data={data}
      brand={brand}
      branchId={branchId}
      orgId={orgId}
      onJoined={setJoined}
    />
  );
}

function Form({
  data,
  brand,
  branchId,
  orgId,
  onJoined,
}: {
  data: JoinInfo;
  brand: ResolvedBrand;
  branchId?: string;
  orgId?: string;
  onJoined: (r: JoinResult) => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? "en").startsWith("ar");
  const accent = usePageAccent(brand);
  const join = useLoyaltyJoin();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState<Birthday>({ month: null, day: null });
  const [error, setError] = useState<string | null>(null);
  // The server answered "this number already has a card, and this device has
  // not proved it owns the number". The card is not shown; the ordinary OTP
  // step runs instead, and the same POST with the device token it hands back
  // returns the card. Any token we held for the phone is stale — forget it,
  // or `PhoneVerify` would skip the code again and the page would loop.
  const [mustVerify, setMustVerify] = useState<JoinResult | null>(null);

  const submit = async (phone: string, deviceToken: string | null) => {
    setError(null);
    try {
      const result = await join.mutateAsync({
          data: {
            branch_id: branchId,
            org_id: branchId ? undefined : orgId,
            name: name.trim(),
            phone,
            device_token: deviceToken ?? undefined,
            locale: isAr ? "ar" : "en",
            // Only sent where the shop asked for it, and only as a complete
            // pair. The server drops anything else, so this is tidiness rather
            // than the guard.
            birth_month:
              data.birthday_enabled && isComplete(birthday) ? birthday.month : undefined,
            birth_day:
              data.birthday_enabled && isComplete(birthday) ? birthday.day : undefined,
          },
        });
      if (result.verify_required) {
        clearDeviceToken(phone);
        setMustVerify(result);
        return;
      }
      onJoined(result);
    } catch (e) {
      setError(getErrorMessage(e as AxiosError));
    }
  };

  const terms = (isAr && data.terms_ar) || data.terms;

  return (
    <LoyaltyPage
      brand={brand}
      // The branch, when the code was a branch's; the shop, when it was the
      // shop's. Never blank: the eyebrow is what makes the headline read as a
      // programme's name rather than a page title.
      eyebrow={data.branch_name ?? brand.orgName}
      title={brand.programName}
      intro={
        data.mode === "visits"
          ? t("loyalty.introVisits", "A stamp for every order, and a reward when the card is full.")
          : t("loyalty.introPoints", "Points on everything you buy here, and a reward when they add up.")
      }
    >
      <HowItWorks info={data} accent={accent} />

      <Section title={t("loyalty.yourDetails", "Your details")}>
        <Panel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="loyalty-name" className="flex items-center gap-2 text-sm font-medium">
              <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                <UserRound className="size-4" aria-hidden />
              </span>
              {t("loyalty.yourName", "Your name")}
            </label>
            <Input
              id="loyalty-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              enterKeyHint="next"
              placeholder={t("loyalty.namePlaceholder", "So we know who to thank")}
              className="h-12 rounded-xl px-4 text-base"
            />
          </div>

          {/* Only where the shop turned birthdays on. A birthday is the most
              sensitive thing this form collects, and a shop not running
              birthday rewards is never given one to hold. */}
          {data.birthday_enabled ? (
            <div className="border-t border-border/70 pt-5">
              <BirthdayPicker
                value={birthday}
                onChange={setBirthday}
                label={t("loyalty.yourBirthday", "Your birthday")}
                hint={
                  // Say what it is FOR, and what is not being asked. Requesting
                  // a date of birth and explaining nothing is how a form loses
                  // people.
                  data.birthday_reward_amount
                    ? t("loyalty.birthdayWithGift", {
                        defaultValue:
                          "We'll wish you a happy birthday and put {{n}} on your card. We don't ask for the year.",
                        n: data.birthday_reward_amount,
                      })
                    : t(
                        "loyalty.birthdayNoGift",
                        "So we can wish you a happy birthday. We don't ask for the year.",
                      )
                }
              />
            </div>
          ) : null}
        </Panel>

        {/* The very same component (and the very same OTP endpoints and
            device token) the ordering and booking flows use. It draws its
            own panel and the submit button; `busy` is the join in flight,
            `disabled` is a form not yet ready — two different things, and
            the button must never spin for the second. */}
        <PhoneVerify
          otpRequired={data.require_otp || mustVerify !== null}
          onVerified={submit}
          busy={join.isPending}
          disabled={!name.trim()}
          submitLabel={t("loyalty.join", "Join")}
          hint={
            mustVerify
              ? mustVerify.card_link_sent
                ? t(
                    "loyalty.phoneHintVerifySent",
                    "This number already has a card. We've sent its link to you on WhatsApp — or tap Join again and we'll send a code to confirm it's yours.",
                  )
                : t(
                    "loyalty.phoneHintVerify",
                    "This number already has a card. Tap Join again and we'll send a code to confirm it's yours.",
                  )
              : data.require_otp
                ? t("loyalty.phoneHintOtp", "We'll send a code to confirm it, then make your card.")
                : t("loyalty.phoneHint", "Your card is tied to this number — it's how the counter finds you.")
          }
        />

        {error ? (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        {join.isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("loyalty.creating", "Making your card…")}
          </p>
        ) : null}
      </Section>

      <RewardsList rewards={data.rewards} accent={accent} />

      {terms ? (
        <Section title={t("loyalty.termsHeading", "Terms")}>
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">{terms}</p>
        </Section>
      ) : null}

      <SocialLinks links={data.brand.social_links} accent={accent} />
    </LoyaltyPage>
  );
}

/** Signing up ends by showing the thing they just got, not describing it. */
function Joined({
  data,
  joined,
  brand,
}: {
  data: JoinInfo;
  joined: JoinResult;
  brand: ResolvedBrand;
}) {
  const { t } = useTranslation();
  const accent = usePageAccent(brand);
  const reduced = useReducedMotion();
  const target = joined.next_reward_cost;
  // `Form` only hands over a result that is not `verify_required`, and that is
  // the one case the token and the passes are absent; the fallbacks are for
  // the type, not for a path the page takes.
  const memberToken = joined.member_token ?? "";
  const passes = joined.passes ?? null;
  const cardHref = `/card/${encodeURIComponent(memberToken)}`;

  return (
    <LoyaltyPage
      brand={brand}
      eyebrow={data.branch_name ?? brand.orgName}
      title={
        joined.already_member
          ? t("loyalty.welcomeBack", "Welcome back")
          : t("loyalty.youreIn", "You're in")
      }
      intro={
        joined.already_member
          ? t("loyalty.alreadyMember", "You're already a member — here's your card again.")
          : t("loyalty.joinedBody", "Show this when you pay, and it starts counting.")
      }
    >
      {/* The card arrives, rather than appears: the one moment on this page
          that earns a little motion, and none for a reader who asked for
          none. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: DURATION.brand, ease: easeOutExpo }}
      >
        <CardFace
          brand={brand}
          mode={joined.mode}
          balance={joined.balance}
          target={target}
          toGo={Math.max(target - joined.balance, 0)}
          canRedeem={target > 0 && joined.balance >= target}
          rewardsReady={target > 0 ? Math.floor(joined.balance / target) : 0}
          progress={target > 0 ? joined.balance % target : joined.balance}
          memberName={joined.name}
          qrUrl={`/api/public/loyalty/card/${encodeURIComponent(memberToken)}/qr.png`}
        />
      </motion.div>

      {passes?.any ? (
        <Section
          title={t("loyalty.keepItHandy", "Keep it handy")}
          hint={t("loyalty.walletHint", "It updates itself every time you earn, and it's there when you're back.")}
        >
          <Panel>
            <WalletButtons passes={passes} />
          </Panel>
        </Section>
      ) : null}

      <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-xl text-base">
        <a href={cardHref}>
          {t("loyalty.viewCard", "View my card")}
          <ArrowRight className="rtl:rotate-180" aria-hidden />
        </a>
      </Button>

      <SocialLinks links={joined.brand.social_links ?? data.brand.social_links} accent={accent} />
    </LoyaltyPage>
  );
}
