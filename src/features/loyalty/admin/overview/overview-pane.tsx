/**
 * The programme at a glance: who has joined, what was given away, and what the
 * outstanding balances are worth to the shop as a liability.
 *
 * Every figure comes from `GET /loyalty/analytics`, computed in the database —
 * the dashboard no longer loads every member to add them up. The member count
 * is the member list's `total` (one row fetched). Redemption figures cover the
 * server's default range (the last 30 days) and narrow to the picked branch;
 * the liability is org-wide either way, since a balance can be spent anywhere.
 */
import { useTranslation } from "react-i18next";
import { Coins, Gift, HandCoins, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { useGetLoyaltyAnalytics, useListLoyaltyMembers } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtNumber } from "@/lib/format";

import { currencyLabel } from "../../shared/util";
import type { ProgramScope } from "../use-program";

export function OverviewPane({ scope }: { scope: ProgramScope }) {
  const { t } = useTranslation();
  const params = scope.branchId ? { branch_id: scope.branchId } : {};
  const analytics = useGetLoyaltyAnalytics(params, { query: { staleTime: 60_000 } });
  const members = useListLoyaltyMembers({ ...params, limit: 1 }, { query: { staleTime: 60_000 } });

  const error = analytics.error ?? members.error;
  if (error) {
    return (
      <EmptyState
        title={t("loyalty.overviewFailed", "Couldn't work out the totals")}
        description={getErrorMessage(error)}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void analytics.refetch();
              void members.refetch();
            }}
          >
            {t("common.retry", "Retry")}
          </Button>
        }
      />
    );
  }

  const a = analytics.data;
  const loading = analytics.isLoading || members.isLoading;
  const liability = a?.liability;
  const outstanding = liability
    ? liability.currency === "visits"
      ? liability.outstanding_visits
      : liability.outstanding_points
    : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          loading={loading}
          icon={Users}
          label={t("loyalty.statMembers", "Members")}
          value={fmtNumber(members.data?.total ?? 0)}
        />
        <StatCard
          loading={loading}
          icon={Coins}
          label={t("loyalty.statOutstanding", "Outstanding balance")}
          value={`${fmtNumber(outstanding)} ${currencyLabel(liability?.currency ?? "points", outstanding)}`}
          hint={t("loyalty.statOutstandingHint", {
            defaultValue: "Held by {{count}} members",
            count: liability?.members_with_balance ?? 0,
          })}
        />
        <StatCard
          loading={loading}
          icon={Wallet}
          accent="warning"
          label={t("loyalty.statLiability", "Liability (estimate)")}
          value={liability?.valued_minor == null ? "—" : fmtMoney(liability.valued_minor)}
          hint={
            liability?.valued_minor == null
              ? t("loyalty.statLiabilityNoRedemptions", "No redemptions yet to value the balances.")
              : t("loyalty.statLiabilityValued", "Balances valued at what a unit has bought on average.")
          }
        />
        <StatCard
          loading={loading}
          icon={Gift}
          label={t("loyalty.statRedemptions", "Rewards redeemed")}
          value={fmtNumber(a?.redemptions ?? 0)}
          hint={t("loyalty.statRedemptionsHint", {
            defaultValue: "{{units}} items over the last 30 days",
            units: fmtNumber(a?.redeemed_units ?? 0),
          })}
        />
        <StatCard
          loading={loading}
          icon={HandCoins}
          label={t("loyalty.statValueGiven", "Value given away")}
          value={fmtMoney(a?.redeemed_value_minor ?? 0)}
          hint={
            a?.refused_redemptions
              ? t("loyalty.statValueGivenHint", {
                  defaultValue: "{{refused}} refused on sync",
                  refused: fmtNumber(a.refused_redemptions),
                })
              : undefined
          }
        />
      </div>

      {a ? (
        <Card className="py-0">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold">{t("loyalty.topRewards", "Top rewards (last 30 days)")}</p>
            {a.top_rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("loyalty.topRewardsEmpty", "No rewards redeemed in the last 30 days.")}
              </p>
            ) : (
              <ul className="divide-y text-sm" data-testid="top-rewards">
                {a.top_rewards.map((r) => (
                  <li key={r.menu_item_id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("loyalty.topRewardsTimes", {
                          defaultValue: "{{count}} redemptions · {{units}} items",
                          count: r.redemptions,
                          units: r.units,
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono tabular">{fmtMoney(r.value_minor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
