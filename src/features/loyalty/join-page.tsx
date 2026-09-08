/**
 * Joining the rewards program, from the QR on a counter:
 *   what you get → your details → your card.
 *
 * Deliberately short. This is filled in standing at a till with a queue behind
 * you, so it asks for as little as the shop has configured and nothing more.
 * Honest, too: a branch with the program switched off says so instead of
 * showing a dead form.
 *
 * Built on the same shell as the member's card (`page-shell`), because to the
 * customer they are one thing — you scan a code, you sign up, you get a card —
 * and they used to agree on almost nothing.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { AlertCircle, Gift, Loader2, PartyPopper } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltyJoinInfo, useLoyaltyJoin } from "@/data/api/generated/api";
import type { JoinInfo, JoinResult } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { PhoneVerify } from "@/features/reservations/phone-verify";
import { fmtMoney } from "@/lib/format";

import { resolveBrand } from "./brand";
import { CardFace } from "./card-face";
import { LoyaltyPage, Panel, Section, usePageAccent } from "./page-shell";
import { WalletButtons } from "./wallet-buttons";
import { costLabel } from "./util";

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

  if (info.isLoading) {
    return (
      <StorefrontShell>
        <div className="flex flex-col gap-4 pt-8">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </StorefrontShell>
    );
  }

  const data = info.data;
  if (!data || !data.enabled) {
    return (
      <StorefrontShell>
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <AlertCircle className="size-7 text-muted-foreground" />
          <h1 className="font-serif text-2xl">
            {t("loyalty.noProgram", "No rewards here yet")}
          </h1>
          <p className="max-w-[300px] text-sm text-muted-foreground">
            {t(
              "loyalty.noProgramBody",
              "This branch isn't running a rewards program at the moment.",
            )}
          </p>
        </div>
      </StorefrontShell>
    );
  }

  const brand = resolveBrand(data.brand, i18n.resolvedLanguage ?? "en");
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

/** How the programme works, in its own terms. */
function howItWorks(data: JoinInfo, t: ReturnType<typeof useTranslation>["t"]) {
  // A stamp card that talked about EGP per point would be a card nobody could
  // follow at the counter. Piastres on the wire, EGP on the page.
  return data.mode === "visits"
    ? t("loyalty.stampLine", {
        defaultValue: "Every order earns a stamp, and {{n}} of them gets you a reward.",
        n: data.next_reward_cost,
      })
    : `${t("loyalty.earnLine", {
        defaultValue: "Earn a point for every {{amount}} you spend.",
        amount: fmtMoney(data.earn_piastres_per_point),
      })} ${t("loyalty.rewardLine", {
        defaultValue: "{{points}} points gets you a reward.",
        points: data.next_reward_cost,
      })}`;
}

function Form({
  data,
  brand,
  branchId,
  orgId,
  onJoined,
}: {
  data: JoinInfo;
  brand: ReturnType<typeof resolveBrand>;
  branchId?: string;
  orgId?: string;
  onJoined: (r: JoinResult) => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? "en").startsWith("ar");
  const accent = usePageAccent(brand);
  const join = useLoyaltyJoin();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (phone: string, deviceToken: string | null) => {
    setError(null);
    try {
      onJoined(
        await join.mutateAsync({
          data: {
            branch_id: branchId,
            org_id: branchId ? undefined : orgId,
            name: name.trim(),
            phone,
            device_token: deviceToken ?? undefined,
            locale: isAr ? "ar" : "en",
            // Only sent where the shop asked for it. The server drops it
            // otherwise, so this is tidiness rather than the guard.
            birthday: data.birthday_enabled && birthday ? birthday : undefined,
          },
        }),
      );
    } catch (e) {
      setError(getErrorMessage(e as AxiosError));
    }
  };

  return (
    <LoyaltyPage
      brand={brand}
      eyebrow={data.branch_name ?? undefined}
      title={brand.programName}
      intro={howItWorks(data, t)}
    >
      {data.rewards.length > 0 ? (
        <Section title={t("loyalty.whatYouCanClaim", "What you can claim")} accent={accent}>
          <Panel className="p-0">
            <ul className="divide-y divide-border/70">
              {data.rewards.map((r) => (
                <li key={r.name} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Gift className="size-4 shrink-0" style={{ color: accent }} />
                  <span className="min-w-0 flex-1">{r.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {costLabel(r.cost_amount, r.cost_currency)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </Section>
      ) : null}

      <Section title={t("loyalty.yourDetails", "Your details")} accent={accent}>
        <Panel className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="loyalty-name" className="text-sm font-medium">
              {t("loyalty.yourName", "Your name")}
            </label>
            <Input
              id="loyalty-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              placeholder={t("loyalty.namePlaceholder", "So we know who to thank")}
            />
          </div>

          {/* Only where the shop turned birthdays on. A date of birth is the
              most sensitive thing this form collects, and a shop not running
              birthday rewards is never given one to hold. */}
          {data.birthday_enabled ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="loyalty-birthday" className="text-sm font-medium">
                {t("loyalty.yourBirthday", "Your birthday")}
                <span className="ms-1 font-normal text-muted-foreground">
                  {t("loyalty.optional", "(optional)")}
                </span>
              </label>
              <Input
                id="loyalty-birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                // Nobody's birthday is tomorrow, and one typed that way would
                // silently never fire.
                max={new Date().toISOString().slice(0, 10)}
                autoComplete="bday"
              />
              <p className="text-xs text-muted-foreground">
                {/* Say what it is FOR. Asking for a date of birth and
                    explaining nothing is how a form loses people. */}
                {data.birthday_reward_amount
                  ? t("loyalty.birthdayWithGift", {
                      defaultValue:
                        "We'll wish you a happy birthday and put {{n}} on your card.",
                      n: data.birthday_reward_amount,
                    })
                  : t(
                      "loyalty.birthdayNoGift",
                      "So we can wish you a happy birthday. Nothing else.",
                    )}
              </p>
            </div>
          ) : null}

          {/* The very same component (and the very same OTP endpoints and
              device token) the ordering and booking flows use. */}
          <PhoneVerify
            otpRequired={data.require_otp}
            onVerified={submit}
            busy={join.isPending || !name.trim()}
            submitLabel={t("loyalty.join", "Join")}
          />

          {error ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          ) : null}
          {join.isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("loyalty.creating", "Making your card…")}
            </p>
          ) : null}
        </Panel>
      </Section>

      {data.terms ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {(isAr && data.terms_ar) || data.terms}
        </p>
      ) : null}
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
  brand: ReturnType<typeof resolveBrand>;
}) {
  const { t } = useTranslation();
  const accent = usePageAccent(brand);
  const target = joined.next_reward_cost;

  return (
    <LoyaltyPage
      brand={brand}
      eyebrow={data.branch_name ?? undefined}
      title={
        joined.already_member
          ? t("loyalty.welcomeBack", "Welcome back")
          : t("loyalty.youreIn", "You're in")
      }
      intro={
        <span className="flex items-center gap-2">
          <PartyPopper className="size-4 shrink-0" style={{ color: accent }} />
          {joined.already_member
            ? t("loyalty.alreadyMember", "You're already a member — here's your card again.")
            : t("loyalty.joinedBody", "Show this when you pay, and it starts counting.")}
        </span>
      }
    >
      <CardFace
        brand={brand}
        mode={joined.mode}
        balance={joined.balance}
        target={target}
        toGo={Math.max(target - joined.balance, 0)}
        canRedeem={joined.balance >= target}
        rewardsReady={target > 0 ? Math.floor(joined.balance / target) : 0}
        progress={target > 0 ? joined.balance % target : joined.balance}
        memberName={joined.name}
        qrUrl={`/api/public/loyalty/card/${encodeURIComponent(joined.member_token)}/qr.png`}
      />

      {joined.passes.any ? (
        <Section title={t("loyalty.keepItHandy", "Keep it handy")} accent={accent}>
          <WalletButtons passes={joined.passes} />
        </Section>
      ) : null}

      <a
        href={`/card/${encodeURIComponent(joined.member_token)}`}
        className="text-center text-sm underline underline-offset-4"
        style={{ color: accent }}
      >
        {t("loyalty.viewCard", "View my card")}
      </a>
    </LoyaltyPage>
  );
}
