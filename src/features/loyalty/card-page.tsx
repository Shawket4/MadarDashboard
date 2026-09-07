/**
 * The member's own card — where their Wallet pass links back to, and where a
 * customer with no wallet app lives instead.
 *
 * Read-only by design. Points move at the till, never here: there is nothing on
 * this page a customer could press to change their balance, which is what makes
 * it safe to reach with nothing but the token in the URL.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, Gift } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoyaltyCard } from "@/data/api/generated/api";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";

import { WalletButtons } from "./wallet-buttons";

export function CardPage({ token }: { token: string }) {
  const { t } = useTranslation();
  const card = useLoyaltyCard(token);

  if (card.isLoading) {
    return (
      <StorefrontShell>
        <div className="flex flex-col gap-4 pt-8">
          <Skeleton className="h-32 w-full rounded-2xl" />
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
            {t("loyalty.noCardBody", "This link doesn't match a card. Scan the code on the counter to join.")}
          </p>
        </div>
      </StorefrontShell>
    );
  }

  const pct =
    data.next_reward_cost > 0
      ? Math.min(100, Math.round((data.balance / data.next_reward_cost) * 100))
      : 0;
  // "orders", not "visits" — the customer counts the things they bought, and
  // that is the word the counter says back to them. Same wording as the till.
  const unit = data.mode === "visits" ? "orders" : "points";

  return (
    <StorefrontShell>
      <div className="flex flex-col gap-6 pt-4">
        <header className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {data.program_name}
          </p>
          <h1 className="font-serif text-2xl">{data.name}</h1>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-5xl tabular-nums">{data.balance}</span>
            <span className="text-sm text-muted-foreground">
              {t(`loyalty.unit.${unit}`, unit)}
            </span>
          </div>
          {/* The bar is decoration; the sentence under it is the fact. State
              never rests on the graphic alone. */}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div className="h-full rounded-full bg-foreground/80" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {data.can_redeem
              ? t("loyalty.rewardReady", "Reward earned — ask at the counter.")
              : t("loyalty.toGo", {
                  defaultValue: "{{n}} more to your next reward.",
                  n: data.points_to_next_reward,
                })}
          </p>
        </section>

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

        <WalletButtons passes={data.passes} token={data.member_token} />
      </div>
    </StorefrontShell>
  );
}
