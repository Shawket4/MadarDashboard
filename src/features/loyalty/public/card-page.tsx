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
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { ArrowRight, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";

import { resolveBrand, type ResolvedBrand } from "@/components/loyalty-card/card-brand";
import { LoyaltyCard } from "@/components/loyalty-card/loyalty-card";
import { stampUnit } from "@/components/loyalty-card/wording";
import { useLoyaltyCard } from "@/data/api/generated/api";

import { stampUnitOf, type CardViewNext as CardView } from "./api-next";
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

  if (card.isLoading) return <PageSkeleton />;

  const data = card.data as CardView | undefined;
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
  const unit = stampUnit(data.mode, stampUnitOf(data));

  return (
    <LoyaltyPage brand={brand}>
      {/* The card is the headline; this names it for a screen reader. */}
      <h1 className="sr-only">
        {t("loyalty.cardTitle", { shop: brand.orgName, defaultValue: "Your {{shop}} card" })}
      </h1>
      <PressStage phase={pass.phase}>
        <PressedCard brand={brand}>
          <LoyaltyCard
            brand={brand}
            mode={data.mode}
            unit={unit}
            balance={data.balance}
            target={data.next_reward_cost}
            member={{ name: data.name, qrUrl: `/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png` }}
          />
        </PressedCard>

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
