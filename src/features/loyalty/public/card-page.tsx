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
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, Gift } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltyCard } from "@/data/api/generated/api";
import type { CardView } from "@/data/api/generated/models";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";

import { resolveBrand } from "../shared/brand";
import { CardFace } from "./card-face";
import { CardOrders } from "./card-orders";
import { CardPreferences } from "./card-preferences";
import { LoyaltyPage, Panel, Section, usePageAccent } from "./page-shell";
import { WalletButtons } from "./wallet-buttons";
import { costLabel } from "../shared/util";

export function CardPage({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const card = useLoyaltyCard(token);

  if (card.isLoading) {
    return (
      <StorefrontShell product="loyalty">
        <div className="flex flex-col gap-4 pt-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-11 w-full" />
        </div>
      </StorefrontShell>
    );
  }

  const data = card.data;
  if (!data) {
    return (
      <StorefrontShell product="loyalty">
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <AlertCircle className="size-7 text-muted-foreground" />
          <h1 className="font-serif text-2xl">
            {t("loyalty.noCard", "Card not found")}
          </h1>
          <p className="max-w-[300px] text-sm text-muted-foreground">
            {t(
              "loyalty.noCardBody",
              "This link doesn't match a card. Scan the code on the counter to join.",
            )}
          </p>
        </div>
      </StorefrontShell>
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
  brand: ReturnType<typeof resolveBrand>;
  token: string;
}) {
  const { t } = useTranslation();
  const accent = usePageAccent(brand);

  return (
    <LoyaltyPage
      brand={brand}
      eyebrow={brand.programName}
      title={t("loyalty.yourCard", "Your card")}
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
          accent={accent}
        >
          <WalletButtons passes={data.passes} />
        </Section>
      ) : null}

      <CardPreferences token={token} optedOut={data.marketing_opt_out} />

      {data.rewards.length > 0 ? (
        <Section
          title={t("loyalty.whatYouCanClaim", "What you can claim")}
          accent={accent}
        >
          <Panel className="p-0">
            <ul className="divide-y divide-border/70">
              {data.rewards.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
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

      {/* Last on the page: the least urgent block, and the longest. A member
          opening this at the counter needs the code and the balance, and those
          are at the top; the receipts are for the moment after. */}
      <CardOrders token={token} accent={accent} />
    </LoyaltyPage>
  );
}
