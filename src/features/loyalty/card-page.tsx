/**
 * The member's own card — where their Wallet pass links back to, and where a
 * customer with no wallet app lives instead.
 *
 * Read-only by design. Points move at the till, never here: there is nothing on
 * this page a customer could press to change their balance, which is what makes
 * it safe to reach with nothing but the token in the URL.
 *
 * It wears the shop's colours, not Madar's, because to the customer this is the
 * shop's card. Madar's palette is the fallback for a tenant who has configured
 * nothing — never a blank or unstyled card — and the shop's NAME is always on
 * it however little else is set.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, Gift } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltyCard } from "@/data/api/generated/api";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";

import { resolveBrand } from "./brand";
import { CardFace } from "./card-face";
import { WalletButtons } from "./wallet-buttons";

export function CardPage({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const card = useLoyaltyCard(token);

  if (card.isLoading) {
    return (
      <StorefrontShell>
        <div className="flex flex-col gap-4 pt-8">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-11 w-full" />
        </div>
      </StorefrontShell>
    );
  }

  const data = card.data;
  if (!data) {
    return (
      <StorefrontShell>
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <AlertCircle className="size-7 text-muted-foreground" />
          <h1 className="font-serif text-2xl">{t("loyalty.noCard", "Card not found")}</h1>
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
  const target = data.next_reward_cost;

  return (
    <StorefrontShell>
      <div className="flex flex-col gap-5 pt-4">
        <CardFace
          brand={brand}
          mode={data.mode}
          balance={data.balance}
          target={target}
          toGo={data.points_to_next_reward}
          canRedeem={data.can_redeem}
          rewardsReady={data.rewards_ready}
          progress={data.progress_to_next}
          memberName={data.name}
          qrUrl={`/api/public/loyalty/card/${encodeURIComponent(token)}/qr.png`}
        />

        {data.rewards.length > 0 ? (
          <ul className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4">
            {data.rewards.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <Gift className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">{r.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.cost_amount}{" "}
                  {t(
                    `loyalty.unit.${r.cost_currency === "visits" ? "orders" : "points"}`,
                    r.cost_currency === "visits" ? "orders" : "points",
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <WalletButtons passes={data.passes} />
      </div>
    </StorefrontShell>
  );
}
