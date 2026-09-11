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
 * balance) first, the wallet second, then what the balance buys, then the two
 * things a member can change, then the receipts — the least urgent block and
 * the longest — and where else to find the shop.
 */
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { CreditCard } from "lucide-react";

import { useLoyaltyCard } from "@/data/api/generated/api";
import type { CardView } from "@/data/api/generated/models";

import { resolveBrand, type ResolvedBrand } from "../shared/brand";
import { CardFace } from "./card-face";
import { CardOrders } from "./card-orders";
import { CardPreferences } from "./card-preferences";
import { LoyaltyPage, PageNotice, PageSkeleton, Panel, Section, usePageAccent } from "./page-shell";
import { RewardsList } from "./rewards-list";
import { SocialLinks } from "./social-links";
import { WalletButtons } from "./wallet-buttons";

export function CardPage({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const card = useLoyaltyCard(token);

  if (card.isLoading) return <PageSkeleton />;

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

  return (
    <LoyaltyPage
      brand={brand}
      eyebrow={t("loyalty.yourCard", "Your card")}
      title={brand.programName}
    >
      <CardFace
        brand={brand}
        mode={data.mode}
        balance={data.balance}
        target={data.next_reward_cost}
        toGo={data.points_to_next_reward}
        canRedeem={data.can_redeem}
        rewardsReady={data.rewards_ready}
        progress={data.progress_to_next}
        memberName={data.name}
        qrUrl={`/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png`}
      />

      {data.passes.any ? (
        <Section
          title={t("loyalty.keepItHandy", "Keep it handy")}
          hint={t("loyalty.walletHint", "It updates itself every time you earn, and it's there when you're back.")}
        >
          <Panel>
            <WalletButtons passes={data.passes} />
          </Panel>
        </Section>
      ) : null}

      <RewardsList rewards={data.rewards} accent={accent} />

      <CardPreferences token={token} optedOut={data.marketing_opt_out} />

      <CardOrders token={token} />

      <SocialLinks links={data.brand.social_links} accent={accent} />
    </LoyaltyPage>
  );
}
