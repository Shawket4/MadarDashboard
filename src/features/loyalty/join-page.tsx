/**
 * Joining the rewards program, from the QR on a counter:
 *   your name → your number (with a code when the branch asks) → your card.
 *
 * Deliberately short. This is filled in standing at a till with a queue behind
 * you, so it asks for two things and nothing else. Honest, too: a branch with
 * the program switched off says so instead of showing a dead form.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { AlertCircle, Gift, Loader2, PartyPopper } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltyJoinInfo, useLoyaltyJoin } from "@/data/api/generated/api";
import type { JoinResult } from "@/data/api/generated/models/joinResult";
import { getErrorMessage } from "@/data/api/errors";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { PhoneVerify } from "@/features/reservations/phone-verify";
import { fmtMoney } from "@/lib/format";

import { resolveBrand } from "./brand";
import { CardFace } from "./card-face";
import { WalletButtons } from "./wallet-buttons";

export function JoinPage({ branchId }: { branchId: string }) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? "en").startsWith("ar");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<JoinResult | null>(null);

  const info = useLoyaltyJoinInfo({ branch_id: branchId });
  const join = useLoyaltyJoin();

  if (info.isLoading) {
    return (
      <StorefrontShell>
        <div className="flex flex-col gap-4 pt-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
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
            {t("loyalty.offTitle", "No rewards program here")}
          </h1>
          <p className="max-w-[300px] text-sm text-muted-foreground">
            {t("loyalty.offBody", "This branch isn't running a rewards program at the moment.")}
          </p>
        </div>
      </StorefrontShell>
    );
  }

  // Same resolution as the card, so the signup screen and the card a customer
  // ends up with are unmistakably the same shop.
  const brand = resolveBrand(data.brand, i18n.resolvedLanguage ?? "en");

  // Already done — show the card and the wallet buttons, nothing else.
  if (joined) {
    return (
      <StorefrontShell>
        <div className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <PartyPopper className="size-7 text-muted-foreground" />
            <h1 className="font-serif text-2xl">
              {joined.already_member
                ? t("loyalty.welcomeBack", "Welcome back")
                : t("loyalty.youreIn", "You're in")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {joined.already_member
                ? t("loyalty.alreadyMember", "You're already a member — here's your card again.")
                : t("loyalty.joinedBody", "Add your card to your phone and show it when you pay.")}
            </p>
          </div>
          {/* The same card they will see from now on, so signing up ends by
              showing them the thing they just got rather than describing it. */}
          <CardFace
            brand={brand}
            mode={data.mode}
            balance={joined.balance}
            target={joined.next_reward_cost}
            toGo={Math.max(joined.next_reward_cost - joined.balance, 0)}
            canRedeem={joined.balance >= joined.next_reward_cost}
            memberName={joined.name}
          />
          <WalletButtons passes={joined.passes} token={joined.member_token} />
          <a
            href={`/card/${encodeURIComponent(joined.member_token)}`}
            className="text-center text-sm text-muted-foreground underline underline-offset-4"
          >
            {t("loyalty.viewCard", "View my card")}
          </a>
        </div>
      </StorefrontShell>
    );
  }

  const submit = async (phone: string, deviceToken: string | null) => {
    setError(null);
    try {
      const res = await join.mutateAsync({
        data: {
          branch_id: branchId,
          name: name.trim(),
          phone,
          device_token: deviceToken ?? undefined,
          locale: isAr ? "ar" : "en",
        },
      });
      setJoined(res);
    } catch (e) {
      setError(getErrorMessage(e as AxiosError));
    }
  };

  return (
    <StorefrontShell>
      <div className="flex flex-col gap-6 pt-4">
        <header className="flex flex-col gap-2">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.orgName}
              className="mb-1 max-h-10 w-auto max-w-[160px] object-contain"
            />
          ) : null}
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {brand.orgName} · {data.branch_name}
          </p>
          <h1 className="font-serif text-2xl">{brand.programName}</h1>
          <p className="text-sm text-muted-foreground">
            {/* The two programs are explained in their own terms. A stamp card
                that talked about EGP per point would be a card nobody could
                follow at the counter. Piastres on the wire, EGP on the page. */}
            {data.mode === "visits"
              ? t("loyalty.stampLine", {
                  defaultValue:
                    "Every order earns a stamp, and {{n}} of them gets you a reward.",
                  n: data.next_reward_cost,
                })
              : `${t("loyalty.earnLine", {
                  defaultValue: "Earn a point for every {{amount}} you spend.",
                  amount: fmtMoney(data.earn_piastres_per_point),
                })} ${t("loyalty.rewardLine", {
                  defaultValue: "{{points}} points gets you a reward.",
                  points: data.next_reward_cost,
                })}`}
          </p>
        </header>

        {data.rewards.length > 0 ? (
          <ul className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4">
            {data.rewards.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <Gift className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.cost_amount} {r.cost_currency === "visits" ? "orders" : "points"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

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

        {/* The very same component (and the very same OTP endpoints and device
            token) the ordering and booking flows use. */}
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

        {data.terms ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {(isAr && data.terms_ar) || data.terms}
          </p>
        ) : null}
      </div>
    </StorefrontShell>
  );
}
