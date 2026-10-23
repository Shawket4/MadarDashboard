/**
 * Rewards › Notifications: a one-line message on the members' cards, and the
 * log of every one sent. Reading needs `loyalty.members.list`; writing,
 * scheduling and cancelling need `loyalty.broadcast` (owner and manager by
 * default). At most `limits.daily_limit` messages per shop per 24 hours.
 */
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { useListLoyaltyBroadcasts } from "@/data/api/generated/api";
import type { Limits } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { fmtNumber } from "@/lib/format";

import { rewardsAccess } from "../access";
import { BROADCAST_LOG } from "../queries";
import { useCardRules } from "../use-card-rules";
import { BroadcastLog } from "./broadcast-log";
import { Composer } from "./composer";

export function NotificationsPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const { canListMembers, canBroadcast } = rewardsAccess(authz);
  const log = useListLoyaltyBroadcasts(BROADCAST_LOG, { query: { enabled: canListMembers } });
  const { rules: card } = useCardRules();
  const limits: Limits | undefined = log.data?.limits ?? card?.card_rules().message;
  const sent = log.data?.sent_last_24h ?? 0;
  const atLimit = !!limits && sent >= limits.daily_limit;
  const title = t("rewards.notifications.title", "Notifications");

  if (authz.ready && !canListMembers) {
    return <Restricted title={title} who={t("rewards.notifications.restricted", "Messages to members are for managers. The owner can give you access.")} />;
  }

  return (
    <Page>
      <PageHeader
        title={title}
        subtitle={t("rewards.notifications.subtitle", "A one-line message on your members' cards, on their lock screen.")}
        actions={
          limits ? (
            <span className="text-sm text-muted-foreground" data-testid="quota">
              {t("rewards.notifications.quota", {
                defaultValue: "{{sent}} of {{limit}} sent today",
                sent: fmtNumber(sent),
                limit: fmtNumber(limits.daily_limit),
              })}
            </span>
          ) : null
        }
      />
      <div className="space-y-8">
        {canBroadcast ? (
          limits ? (
            <Composer limits={limits} atLimit={atLimit} />
          ) : null
        ) : (
          <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            {t("rewards.notifications.noSend", "You can see the messages sent here; sending one needs the owner's permission.")}
          </p>
        )}
        <BroadcastLog
          items={log.data?.items ?? []}
          loading={log.isLoading}
          error={log.error}
          onRetry={() => void log.refetch()}
          canCancel={canBroadcast}
        />
      </div>
    </Page>
  );
}
