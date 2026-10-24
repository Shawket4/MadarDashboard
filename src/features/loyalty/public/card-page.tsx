/**
 * The member's own card — where their Wallet pass links back to, and where a
 * customer with no wallet app lives instead.
 *
 * Read-only by design. Points move at the till, never here: there is nothing on
 * this page a customer could press to change their balance, which is what makes
 * it safe to reach with nothing but the token in the URL.
 *
 * It wears the shop's colours where the shop is on the branding tier, and
 * Madar's otherwise — decided server-side, so this page never asks which. The
 * shop's NAME is always on it either way.
 *
 * The order of the page is the order of need at a counter: the card (code and
 * balance) first, with the wallet right under it, then "Order now" where the
 * shop takes online orders, what the balance buys, the one thing a member can
 * change, the receipts (the least urgent block and the longest) and where else
 * to find the shop. The card heads the page itself: it already says whose it
 * is, so a headline over it would only say it again.
 */
import { Trans, useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { ArrowRight, CreditCard, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";

import { resolveBrand, type ResolvedBrand } from "@/components/loyalty-card/card-brand";
import { LazyDesignedCard, useDesignedCard } from "@/components/loyalty-card/lazy-designed-card";
import { LoyaltyCard, type LoyaltyCardMember } from "@/components/loyalty-card/loyalty-card";
import { stampUnit } from "@/components/loyalty-card/wording";
import { useLoyaltyCard } from "@/data/api/generated/api";
import type { BirthdayGiftView, CardView } from "@/data/api/generated/models";
import { fmtDate } from "@/lib/format";

import { PressedCard, PressRest, PressStage } from "./card-press";
import { CardOrders } from "./card-orders";
import { CardPreferences } from "./card-preferences";
import { LoyaltyPage, PageNotice, PageSkeleton, usePageAccent } from "./page-shell";
import { RewardsList } from "./rewards-list";
import { safeHttpUrl } from "./safe-url";
import { SocialLinks } from "./social-links";
import { usePassDownload } from "./use-pass-download";
import { WalletButtons } from "./wallet-buttons";

export function CardPage({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const card = useLoyaltyCard(token);
  // A published design: its card's code loads with the page (see the join page).
  const designed = useDesignedCard(!!card.data?.card);

  if (card.isLoading || designed.pending) return <PageSkeleton />;

  const data = card.data;
  if (!data) {
    // A link that matches no card is a fact about the link; a request that
    // failed is a fact about the connection. Only the second is worth
    // offering to retry.
    const status = card.error instanceof AxiosError ? card.error.response?.status : undefined;
    if (status === 404) {
      return (
        <PageNotice
          icon={CreditCard}
          title={t("loyalty.noCard", "Card not found")}
          body={t("loyalty.noCardBody", "This link doesn't match a card. Scan the code on the counter to join.")}
        />
      );
    }
    return (
      <PageNotice
        title={t("loyalty.couldntLoad", "We couldn't load this page")}
        body={t("loyalty.couldntLoadBody", "Check your connection and try again.")}
        onRetry={() => void card.refetch()}
      />
    );
  }

  const brand = resolveBrand(data.brand, i18n.resolvedLanguage ?? "en");
  return <Card data={data} brand={brand} token={token} />;
}

/** Split out so the accent hook runs after the loading and error branches. */
function Card({
  data,
  brand,
  token,
}: {
  data: CardView;
  brand: ResolvedBrand;
  token: string;
}) {
  const { t } = useTranslation();
  const accent = usePageAccent(brand);
  // The Apple pass is made on demand and is not instant. The page owns that
  // wait, because it is the CARD that is being made — see `card-press.tsx`.
  const pass = usePassDownload(data.passes.apple_url);
  const orderNowHref = safeHttpUrl(data.order_now_url);
  const unit = stampUnit(data.mode, data.stamp_unit ?? data.card?.stamp_unit);
  const member: LoyaltyCardMember = { name: data.name, qrUrl: `/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png` };
  // Every track's balance for the designed card; one track is the balance.
  const balances = data.tracks?.map((tr) => ({ position: tr.position, balance: tr.balance })) ?? [{ position: 1, balance: data.balance }];
  const firstName = data.name?.trim().split(/\s+/)[0];

  return (
    <LoyaltyPage brand={brand}>
      {/* A small hello over the card, by first name; without one, the page is
          still named for a screen reader. */}
      {firstName ? (
        // Half the page's rhythm away from the card it greets you over.
        <h1 className="-mb-4 text-[17px] font-semibold leading-tight">
          <Trans i18nKey="loyalty.hi" values={{ name: firstName }} defaults="Hi <bdi>{{name}}</bdi>" components={{ bdi: <bdi /> }} />
        </h1>
      ) : (
        <h1 className="sr-only">{t("loyalty.cardTitle", { shop: brand.orgName, defaultValue: "Your {{shop}} card" })}</h1>
      )}
      <PressStage phase={pass.phase}>
        <PressedCard brand={brand}>
          <LazyDesignedCard
            card={data.card}
            name={brand.orgName}
            logoUrl={brand.logoUrl}
            photoUrl={brand.cardImageUrl}
            balances={balances}
            member={member}
            classic={
              <LoyaltyCard
                brand={brand}
                mode={data.mode}
                unit={unit}
                balance={data.balance}
                target={data.card_size ?? data.next_reward_cost}
                member={member}
              />
            }
          />
        </PressedCard>

        <BirthdayGift gift={data.birthday_gift} accent={accent} />

        {/* Right under the card it saves, as on the sign-up's last step. */}
        {data.passes.any ? (
          <div className="flex flex-col items-center gap-3">
            <WalletButtons passes={data.passes} pass={pass} />
            <p className="max-w-[34ch] text-center text-[13px] leading-snug text-muted-foreground">
              {t("loyalty.walletHint", "It updates itself every time you earn, and it's there when you're back.")}
            </p>
          </div>
        ) : null}

        <PressRest>
          {/* Present only when the shop takes online orders. The ordering page opens
              knowing who this is — and proves it on that device before showing anything. */}
          {orderNowHref ? (
            <Button asChild size="lg" className="h-12 w-full rounded-xl text-base">
              <a href={orderNowHref}>
                {t("loyalty.orderNow", "Order now")}
                <ArrowRight className="rtl:rotate-180" aria-hidden />
              </a>
            </Button>
          ) : null}

          <RewardsList rewards={data.rewards} accent={accent} unit={unit} />

          <CardPreferences token={token} optedOut={data.marketing_opt_out} />

          <CardOrders token={token} />

          <SocialLinks links={data.brand.social_links} accent={accent} />
        </PressRest>
      </PressStage>
    </LoyaltyPage>
  );
}

/**
 * The birthday gift, under the card: one free item waiting until a date, said
 * calmly in the page's own surface with the shop's colour on the gift only; once
 * claimed, a quiet line. It arrives with the card, so it moves nothing.
 */
function BirthdayGift({ gift, accent }: { gift: BirthdayGiftView | null | undefined; accent: string }) {
  const { t } = useTranslation();
  if (gift?.status === "claimed") {
    return (
      <p className="-mt-4 flex items-center gap-2 text-[13px] leading-snug text-muted-foreground">
        <Gift aria-hidden className="size-4 shrink-0" />
        {t("loyalty.birthdayGiftClaimed", "You've used your birthday gift.")}
      </p>
    );
  }
  if (gift?.status !== "open") return null;
  // `valid_until` is the end of the gift's last day in shop time: a moment
  // before it is that day, whichever way the server writes the boundary.
  const until = fmtDate(new Date(Date.parse(gift.valid_until) - 1));
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)` }}>
        <Gift aria-hidden className="size-5" style={{ color: accent }} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[15px] font-semibold leading-tight">{t("loyalty.birthdayGift", "Birthday gift")}</p>
        <p className="text-[13px] leading-snug text-muted-foreground">
          {t("loyalty.birthdayGiftOpen", { date: until, defaultValue: "A free item is waiting for you until {{date}}." })}
        </p>
      </div>
    </div>
  );
}
