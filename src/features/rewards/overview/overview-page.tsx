/**
 * Rewards › Overview: the programme in the period picked in the header — who
 * joined, who came back, what was earned and taken, who holds the card in a
 * wallet and what the messages reached — then the win-back and birthday
 * results, what the balances are worth (the old Settings › Loyalty overview,
 * reused) and the latest messages.
 *
 * `GET /loyalty/stats` is org-wide (a member belongs to the shop, not a
 * branch); the campaign and value figures narrow to a picked branch as they
 * always did.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, CalendarRange, Gift, Stamp, UserPlus, Users, Wallet } from "lucide-react";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Link } from "@/components/app/link";
import { DashboardLink } from "@/components/app/dashboard-link";
import { Page, PageHeader } from "@/components/app/page";
import { ProgressBar } from "@/components/app/progress-bar";
import { Restricted } from "@/components/app/restricted";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill, type StatusTone } from "@/components/app/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetLoyaltyCampaignEffectiveness,
  useGetLoyaltyStats,
  useListLoyaltyBroadcasts,
} from "@/data/api/generated/api";
import type { StatsDay } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { OverviewPane } from "@/features/loyalty/admin/overview/overview-pane";
import { unitLabel } from "@/features/loyalty/shared/util";
import { fmtDate, fmtDateTime, fmtNumber, fmtPercent } from "@/lib/format";
import { Stagger, useChartMotion } from "@/lib/motion";

import { rewardsAccess } from "../access";
import { RECENT_BROADCASTS, campaignParams, statsParams } from "../queries";
import { useTrackNames } from "../use-track-names";

type Metric = "new_members" | "active" | "earned" | "redemptions";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

const BROADCAST_TONE: Record<string, StatusTone> = {
  scheduled: "info",
  sending: "warning",
  sent: "success",
  cancelled: "neutral",
};

export function RewardsOverviewPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  const { branchId, from, to, preset } = useScope();
  const stats = useGetLoyaltyStats(statsParams({ from, to }), { query: { enabled: access.canListMembers } });
  const s = stats.data;
  const mode = s?.mode ?? "visits";
  const unit = s?.stamp_unit ?? (mode === "points" ? "points" : "order");
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  if (authz.ready && !access.canListMembers) {
    return (
      <Restricted
        title={t("rewards.overview.title", "Rewards")}
        who={t("rewards.common.noAccess", "Your account can't open this page. The owner can give you access.")}
      />
    );
  }

  const loading = stats.isLoading;
  const kpis: LedgerItem[] = [
    {
      key: "members",
      label: t("rewards.overview.members", "Members"),
      icon: Users,
      accent: "primary",
      value: s?.members_total ?? 0,
      formatType: "number",
      loading,
      hint: t("rewards.overview.membersHint", { defaultValue: "{{n}} joined this period", n: fmtNumber(s?.new_members ?? 0) }),
    },
    {
      key: "active",
      label: t("rewards.overview.active", "Active members"),
      icon: UserPlus,
      accent: "info",
      value: s?.active_members ?? 0,
      formatType: "number",
      loading,
      hint: t("rewards.overview.activeHint", "Earned or took a reward this period"),
    },
    {
      key: "earned",
      label: mode === "points" ? t("rewards.overview.earnedPoints", "Points earned") : t("rewards.overview.earnedStamps", "Stamps given"),
      icon: Stamp,
      accent: "neutral",
      value: s?.earned ?? 0,
      formatType: "number",
      loading,
    },
    {
      key: "redemptions",
      label: t("rewards.overview.redemptions", "Rewards taken"),
      icon: Gift,
      accent: "success",
      value: s?.redemptions ?? 0,
      formatType: "number",
      loading,
    },
    {
      key: "wallet",
      label: t("rewards.overview.inWallet", "Card in a wallet"),
      icon: Wallet,
      accent: "neutral",
      value: s?.members_with_card ?? 0,
      formatType: "number",
      loading,
      hint: s && s.members_total > 0 ? t("rewards.overview.inWalletHint", { defaultValue: "{{share}} of members", share: fmtPercent(s.members_with_card / s.members_total) }) : undefined,
    },
    {
      key: "messages",
      label: t("rewards.overview.messages", "Messages sent"),
      icon: BellRing,
      accent: "warning",
      value: s?.messages_sent ?? 0,
      formatType: "number",
      loading,
      hint: t("rewards.overview.messagesHint", { defaultValue: "{{n}} seen on an iPhone", n: fmtNumber(s?.messages_seen ?? 0) }),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t("rewards.overview.title", "Rewards")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
        actions={
          <DashboardLink to="/reports/loyalty" className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground">
            {t("rewards.overview.toReport", "Open the loyalty report")}
          </DashboardLink>
        }
      />
      <div className="space-y-6">
        {stats.isError ? <ErrorState onRetry={() => void stats.refetch()} /> : <LedgerStrip items={kpis} />}
        <DailyChart days={s?.daily ?? []} loading={loading} mode={mode} unit={unit} />
        <div className="grid gap-6 lg:grid-cols-2">
          {s && s.per_track.length > 1 ? <PerTrack rows={s.per_track} unit={unit} /> : null}
          <Campaigns branchId={branchId} from={from} to={to} />
          <RecentMessages />
        </div>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t("rewards.overview.value", "What the balances are worth")}</h2>
          <OverviewPane key={branchId ?? "org"} scope={{ orgId: "", branchId }} />
        </section>
      </div>
    </Page>
  );
}

function DailyChart({ days, loading, mode, unit }: { days: StatsDay[]; loading: boolean; mode: string; unit: string }) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<Metric>("new_members");
  const motion = useChartMotion();
  const labels: Record<Metric, string> = {
    new_members: t("rewards.overview.dailyNew", "New members"),
    active: t("rewards.overview.dailyActive", "Active"),
    earned: mode === "points" ? t("rewards.overview.earnedPoints", "Points earned") : t("rewards.overview.earnedStamps", "Stamps given"),
    redemptions: t("rewards.overview.redemptions", "Rewards taken"),
  };
  const data = useMemo(() => days.map((d) => ({ date: d.date, value: d[metric] })), [days, metric]);
  const empty = days.every((d) => d.new_members + d.earned + d.redemptions + d.active === 0);

  return (
    <ChartCard
      title={t("rewards.overview.daily", "Day by day")}
      description={labels[metric]}
      actions={
        <SegmentedControl
          value={metric}
          onChange={setMetric}
          options={(Object.keys(labels) as Metric[]).map((m) => ({ value: m, label: labels[m] }))}
        />
      }
    >
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : empty ? (
        <EmptyState className="h-64" title={t("rewards.overview.noActivity", "No activity in this period.")} />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(d: string) => fmtDate(d)} minTickGap={24} />
              <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={<ChartTooltipContent labelFormatter={(d) => fmtDate(String(d))} formatter={(v) => `${fmtNumber(Number(v))} ${metric === "earned" ? unitLabel(unit, Number(v)) : ""}`.trim()} />}
              />
              <Bar dataKey="value" name={labels[metric]} fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={28} {...motion} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function PerTrack({ rows, unit }: { rows: { position: number; earned: number; redemptions: number }[]; unit: string }) {
  const { t } = useTranslation();
  const { tracks } = useTrackNames();
  const max = Math.max(1, ...rows.map((r) => r.earned));
  const name = (p: number) => tracks.find((x) => x.position === p)?.name ?? t("rewards.common.trackN", { defaultValue: "Track {{n}}", n: p });
  return (
    <Card className="gap-4 py-5 shadow-none">
      <CardContent className="space-y-4 px-5">
        <h2 className="text-base font-semibold">{t("rewards.overview.perTrack", "Each stamp track")}</h2>
        <Stagger className="space-y-3">
          {rows.map((r) => (
            <div key={r.position} className="space-y-1.5" data-testid="track-row">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{name(r.position)}</span>
                <span className="text-xs text-muted-foreground">
                  {t("rewards.overview.trackFigures", {
                    defaultValue: "{{earned}} earned · {{taken}} rewards taken",
                    earned: `${fmtNumber(r.earned)} ${unitLabel(r.position === 1 ? unit : "stamp", r.earned)}`,
                    taken: fmtNumber(r.redemptions),
                  })}
                </span>
              </div>
              <ProgressBar value={r.earned} max={max} ariaLabel={name(r.position)} className="h-2" />
            </div>
          ))}
        </Stagger>
      </CardContent>
    </Card>
  );
}

function Campaigns({ branchId, from, to }: { branchId: string | null; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const q = useGetLoyaltyCampaignEffectiveness(campaignParams({ branchId, from, to }));
  const rows = q.data?.campaigns ?? [];
  return (
    <Card className="gap-4 py-5 shadow-none">
      <CardContent className="space-y-4 px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t("rewards.overview.campaigns", "Birthdays and win-back")}</h2>
          <Link to="/rewards/automations" className="text-xs font-medium underline underline-offset-4 hover:text-muted-foreground">
            {t("rewards.overview.campaignsEdit", "Settings")}
          </Link>
        </div>
        {q.isError ? (
          <ErrorState onRetry={() => void q.refetch()} />
        ) : q.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.every((r) => r.sent === 0) ? (
          <p className="text-sm text-muted-foreground">{t("rewards.overview.noCampaigns", "No birthday or win-back gifts were sent in this period.")}</p>
        ) : (
          <Stagger className="space-y-3">
            {rows.map((r) => (
              <div key={r.campaign} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">
                    {r.campaign === "birthday" ? t("rewards.overview.birthday", "Birthday") : t("rewards.overview.winback", "Win-back")}
                  </span>
                  <bdi className="font-mono tabular">{fmtPercent(r.return_rate)}</bdi>
                </div>
                <ProgressBar value={r.return_rate} max={1} ariaLabel={r.campaign} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {t("rewards.overview.campaignHint", {
                    defaultValue: "{{returned}} of {{sent}} came back within 30 days",
                    returned: fmtNumber(r.returned_within_30d),
                    sent: fmtNumber(r.sent),
                  })}
                </p>
              </div>
            ))}
          </Stagger>
        )}
      </CardContent>
    </Card>
  );
}

function RecentMessages() {
  const { t } = useTranslation();
  const q = useGetListBroadcasts();
  const items = q.data?.items ?? [];
  return (
    <Card className="gap-4 py-5 shadow-none">
      <CardContent className="space-y-3 px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t("rewards.overview.recentMessages", "Latest messages")}</h2>
          <Link to="/rewards/notifications" className="text-xs font-medium underline underline-offset-4 hover:text-muted-foreground">
            {t("rewards.overview.allMessages", "All messages")}
          </Link>
        </div>
        {q.isError ? (
          <ErrorState onRetry={() => void q.refetch()} />
        ) : q.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("rewards.overview.noMessages", "No messages sent on the card yet.")}</p>
        ) : (
          <ul className="divide-y text-sm">
            {items.map((b) => (
              <li key={b.id} className="space-y-1 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate" dir="auto">
                    {b.line_en || b.line_ar}
                  </p>
                  <StatusPill tone={BROADCAST_TONE[b.status] ?? "neutral"} size="sm" popOn={b.status}>
                    {t(`rewards.overview.status.${b.status}`, b.status)}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(b.started_at ?? b.scheduled_for)} ·{" "}
                  {t("rewards.overview.messageFigures", {
                    defaultValue: "{{sent}} sent · {{seen}} seen",
                    sent: fmtNumber(b.sent),
                    seen: fmtNumber(b.seen),
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const useGetListBroadcasts = () => useListLoyaltyBroadcasts(RECENT_BROADCASTS);
