/**
 * The programme at a glance: who has joined, what they hold, and what that is
 * worth to the shop as a liability.
 *
 * Built from the member list and the reward catalogue — there is no summary
 * endpoint — so it walks the list once, under the same ceiling an export uses.
 */
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Gift, Users, Wallet, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import {
  listLoyaltyMembers,
  useGetLoyaltyRewardItems,
  useGetLoyaltySettings,
} from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fetchAllPages } from "@/lib/export-all";
import { fmtMoney, fmtNumber } from "@/lib/format";

import { currencyLabel, modeOf } from "../../shared/util";
import type { ProgramScope } from "../use-program";
import { summarise } from "./summary";

export function OverviewPane({ scope }: { scope: ProgramScope }) {
  const { t } = useTranslation();
  const params = scope.branchId ? { branch_id: scope.branchId } : {};
  const settings = useGetLoyaltySettings(params);
  const catalogue = useGetLoyaltyRewardItems(params);
  const members = useQuery({
    queryKey: ["/loyalty/members", "all", params],
    queryFn: () =>
      fetchAllPages<MemberView>(async (offset, limit) => {
        const res = await listLoyaltyMembers({ ...params, limit, offset });
        return { rows: res.members, total: res.total };
      }),
    staleTime: 60_000,
  });

  const error = members.error ?? catalogue.error ?? settings.error;
  if (error) {
    return (
      <EmptyState
        title={t("loyalty.overviewFailed", "Couldn't work out the totals")}
        description={getErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void members.refetch()}>
            {t("common.retry", "Retry")}
          </Button>
        }
      />
    );
  }

  const loading = members.isLoading || catalogue.isLoading || settings.isLoading;
  const mode = modeOf(settings.data);
  const s = summarise(members.data ?? [], catalogue.data?.items ?? []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          loading={loading}
          icon={Users}
          label={t("loyalty.statMembers", "Members")}
          value={fmtNumber(s.members)}
        />
        <StatCard
          loading={loading}
          icon={Coins}
          label={t("loyalty.statOutstanding", "Outstanding balance")}
          value={`${fmtNumber(s.outstanding)} ${currencyLabel(mode, s.outstanding)}`}
        />
        <StatCard
          loading={loading}
          icon={Gift}
          label={t("loyalty.statRewardsOwed", "Rewards earned, not claimed")}
          value={fmtNumber(s.rewardsOwed)}
          hint={t("loyalty.statRewardsOwedHint", {
            defaultValue: "Held by {{count}} members",
            count: s.membersWithReward,
          })}
        />
        <StatCard
          loading={loading}
          icon={Wallet}
          accent="warning"
          label={t("loyalty.statLiability", "Liability (estimate)")}
          value={s.outstandingValue == null ? "—" : fmtMoney(s.outstandingValue)}
          hint={
            s.outstandingValue == null
              ? t("loyalty.statLiabilityNoCatalogue", "Add rewards to value the balances.")
              : t("loyalty.statLiabilityHint", {
                  defaultValue: "Balances valued at your rewards' average menu price; earned rewards alone ≈ {{value}}.",
                  value: fmtMoney(s.rewardsOwedValue ?? 0),
                })
          }
        />
      </div>
    </div>
  );
}
