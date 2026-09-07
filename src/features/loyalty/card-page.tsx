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
import { StampRow, stampable } from "./stamp-row";
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
  const isStamps = data.mode === "visits";
  const unit = isStamps ? "orders" : "points";
  const target = data.next_reward_cost;
  const pct = target > 0 ? Math.min(100, Math.round((data.balance / target) * 100)) : 0;

  return (
    <StorefrontShell>
      <div className="flex flex-col gap-5 pt-4">
        {/* The card itself. One tinted surface carrying the shop's identity,
            the balance, and how far there is to go. */}
        <section
          className="flex flex-col items-center gap-5 rounded-3xl px-5 py-7 text-center shadow-sm"
          style={{ backgroundColor: brand.background, color: brand.foreground }}
        >
          <header className="flex flex-col items-center gap-2">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.orgName}
                className="max-h-12 w-auto max-w-[180px] object-contain"
              />
            ) : null}
            {/* The shop's name is always here — with a logo it is the caption,
                without one it is the identity. */}
            <p
              className={brand.logoUrl ? "text-xs tracking-wide" : "font-serif text-xl"}
              style={{ color: brand.logoUrl ? brand.muted : brand.foreground }}
            >
              {brand.orgName}
            </p>
            <p className="text-xs uppercase tracking-wider" style={{ color: brand.muted }}>
              {brand.programName}
            </p>
          </header>

          {isStamps && stampable(target) ? (
            <>
              <StampRow
                earned={data.balance}
                target={target}
                accent={brand.accent}
                foreground={brand.background}
                muted={brand.muted}
              />
              <p className="text-sm" style={{ color: brand.muted }}>
                {data.can_redeem
                  ? t("loyalty.rewardReady", "Reward earned — ask at the counter.")
                  : t("loyalty.ordersToGo", {
                      defaultValue: "{{n}} more orders to your next reward.",
                      n: data.points_to_next_reward,
                    })}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-6xl tabular-nums">{data.balance}</span>
                <span className="text-sm" style={{ color: brand.muted }}>
                  {t(`loyalty.unit.${unit}`, unit)}
                </span>
              </div>
              {/* Decoration; the sentence under it carries the fact. State never
                  rests on a graphic alone. */}
              <div
                className="h-2 w-full max-w-[260px] overflow-hidden rounded-full"
                role="presentation"
                style={{ backgroundColor: brand.muted, opacity: 0.35 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: brand.accent }}
                />
              </div>
              <p className="text-sm" style={{ color: brand.muted }}>
                {data.can_redeem
                  ? t("loyalty.rewardReady", "Reward earned — ask at the counter.")
                  : t("loyalty.toGo", {
                      defaultValue: "{{n}} more to your next reward.",
                      n: data.points_to_next_reward,
                    })}
              </p>
            </>
          )}

          <p className="text-sm font-medium">{data.name}</p>
        </section>

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

        <WalletButtons passes={data.passes} token={data.member_token} />
      </div>
    </StorefrontShell>
  );
}
