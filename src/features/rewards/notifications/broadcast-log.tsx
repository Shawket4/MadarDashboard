/**
 * Every message the shop sent or scheduled, with what the wallets let us know.
 * Apple tells us a phone fetched the card after the push ("seen"); Google
 * accepts the update and says nothing more; WhatsApp is queued. The log says
 * exactly that much and no more.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { Ban, MessageSquare } from "lucide-react";

import { monthNames } from "@/components/inputs/birthday";
import { useConfirm } from "@/components/app/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getListLoyaltyBroadcastsQueryKey, useCancelLoyaltyBroadcast } from "@/data/api/generated/api";
import type { Broadcast } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDateTime, fmtNumber } from "@/lib/format";

import { useTrackNames } from "../use-track-names";
import { audienceSummary, statusTone } from "./util";

export function BroadcastLog({
  items,
  loading,
  error,
  onRetry,
  canCancel,
}: {
  items: Broadcast[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  canCancel: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { tracks } = useTrackNames();
  const months = useMemo(() => monthNames(i18n.language), [i18n.language]);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t("rewards.notifications.logTitle", "Sent and scheduled")}</h2>
        <p className="text-xs text-muted-foreground">
          {t(
            "rewards.notifications.seenExplained",
            "Seen = an iPhone fetched the card after the push (Apple's only delivery signal). Google gives no delivery signal.",
          )}
        </p>
      </div>
      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t("rewards.notifications.logEmpty", "No messages yet")}
          description={t("rewards.notifications.logEmptyHint", "Messages you send or schedule are listed here with how they went.")}
        />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((b) => (
            <LogRow key={b.id} b={b} audience={audienceSummary(b.audience.rules ?? [], t, months, tracks)} canCancel={canCancel} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LogRow({ b, audience, canCancel }: { b: Broadcast; audience: string; canCancel: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const cancel = useCancelLoyaltyBroadcast();
  const status: Record<string, string> = {
    scheduled: t("rewards.notifications.statusScheduled", "Scheduled"),
    sending: t("rewards.notifications.statusSending", "Sending"),
    sent: t("rewards.notifications.statusSent", "Sent"),
    cancelled: t("rewards.notifications.statusCancelled", "Cancelled"),
  };
  const when = b.status === "scheduled" ? b.scheduled_for : (b.started_at ?? b.scheduled_for);

  const doCancel = async () => {
    const ok = await confirm({
      title: t("rewards.notifications.cancelTitle", "Cancel this message?"),
      description: t("rewards.notifications.cancelBody", "It won't be sent. It stays in the log as cancelled."),
      confirmLabel: t("rewards.notifications.cancelConfirm", "Cancel message"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync({ id: b.id });
      toast.success(t("rewards.notifications.cancelled", "Message cancelled"));
      await qc.invalidateQueries({ queryKey: getListLoyaltyBroadcastsQueryKey() });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const figure = (label: string, n: number) =>
    n > 0 ? (
      <span className="whitespace-nowrap">
        {label} <bdi className="font-mono text-foreground tabular">{fmtNumber(n)}</bdi>
      </span>
    ) : null;

  return (
    <li className="space-y-2 p-4" data-testid="broadcast-row">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={statusTone(b.status)} size="sm" popOn={b.status}>
              {status[b.status] ?? b.status}
            </StatusPill>
            <span className="text-xs text-muted-foreground">
              {fmtDateTime(when)}
              {b.created_by_name ? ` · ${t("rewards.notifications.by", { defaultValue: "by {{name}}", name: b.created_by_name })}` : null}
            </span>
          </div>
          {b.line_en ? <p className="text-sm" dir="ltr">{b.line_en}</p> : null}
          {b.line_ar ? <p className="text-sm" dir="rtl">{b.line_ar}</p> : null}
          <p className="text-xs text-muted-foreground">
            {audience}
            {b.whatsapp_fallback ? ` · ${t("rewards.notifications.withWhatsapp", "with WhatsApp")}` : null}
          </p>
        </div>
        {canCancel && b.status === "scheduled" ? (
          <Button variant="outline" size="sm" onClick={() => void doCancel()} loading={cancel.isPending}>
            <Ban className="size-4" />
            {t("rewards.notifications.cancel", "Cancel")}
          </Button>
        ) : null}
      </div>
      {b.status !== "scheduled" && b.status !== "cancelled" ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">
            {t("rewards.notifications.recipients", "Recipients")}{" "}
            <bdi className="font-mono text-foreground tabular">{fmtNumber(b.recipients)}</bdi>
          </span>
          {figure(t("rewards.notifications.chApple", "Apple"), b.apple)}
          {figure(t("rewards.notifications.chSeen", "Seen"), b.seen)}
          {figure(t("rewards.notifications.chGoogle", "Google"), b.google)}
          {figure(t("rewards.notifications.chWhatsapp", "WhatsApp"), b.whatsapp)}
          {figure(t("rewards.notifications.chPending", "Still to send"), b.pending)}
          {figure(t("rewards.notifications.chRecent", "Skipped (messaged recently)"), b.skipped_recent)}
          {figure(t("rewards.notifications.chOptedOut", "Skipped (opted out)"), b.skipped_opted_out)}
          {figure(t("rewards.notifications.chUnreachable", "No card"), b.unreachable)}
          {figure(t("rewards.notifications.chFailed", "Failed"), b.failed)}
        </p>
      ) : null}
    </li>
  );
}
