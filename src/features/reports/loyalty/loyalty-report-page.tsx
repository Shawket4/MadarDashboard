import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CalendarRange, Gift, Percent, RotateCcw, UserPlus, Users } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { ErrorState, EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/app/progress-bar";
import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { useScope } from "@/data/scope/use-scope";
import {
  useGetLoyaltyBehavior, useGetLoyaltyCampaignEffectiveness, useGetLoyaltyLiabilityTrend,
} from "@/data/api/generated/api";
import { fmtNumber, fmtPercent } from "@/lib/format";
import { currencyLabel } from "@/features/loyalty/shared/util";

const AXIS = CHART_AXIS_TICK;

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

/** How much of the loyalty member base actually uses the programme, not just
 * what it's worth (that's Settings ▸ Loyalty ▸ Overview). Org-wide figures
 * (total members, ever-redeemed) don't narrow to a picked branch — a
 * member's balance and history aren't branch-scoped. */
export function LoyaltyReportPage() {
  const { t } = useTranslation();
  const { branchId, from, to, preset } = useScope();
  const range = { branch_id: branchId ?? undefined, from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  // loyalty.members.list; the server counts only the branches the person works at.
  const authz = useAuthz();
  const canSee = authz.can(Cap.loyaltyMembersList);
  const q = useGetLoyaltyBehavior(range, { query: { enabled: canSee } });
  const d = q.data;

  const kpis: LedgerItem[] = [
    {
      key: "active_member_rate",
      label: t("reports.loyalty.activeRate", "Active member rate"),
      icon: Users,
      accent: "primary",
      value: d?.active_member_rate ?? 0,
      formatType: "percent",
      loading: q.isLoading,
      hint: t("reports.loyalty.activeRateHint", "{{active}} of {{total}} members", {
        active: fmtNumber(d?.active_members ?? 0),
        total: fmtNumber(d?.total_members ?? 0),
      }),
    },
    {
      key: "redemption_rate",
      label: t("reports.loyalty.redemptionRate", "Redemption rate"),
      icon: Gift,
      accent: "info",
      value: d?.redemption_rate ?? 0,
      formatType: "percent",
      loading: q.isLoading,
      hint: t("reports.loyalty.redemptionRateHint", "{{redeemed}} members have ever redeemed", {
        redeemed: fmtNumber(d?.members_ever_redeemed ?? 0),
      }),
    },
    {
      key: "redemption_ratio",
      label: t("reports.loyalty.redemptionRatio", "Points redeemed vs earned"),
      icon: Percent,
      accent: "info",
      value: d?.redemption_ratio ?? 0,
      formatType: "percent",
      loading: q.isLoading,
      hint: t("reports.loyalty.redemptionRatioHint", "This period"),
    },
    {
      key: "repeat_visit_rate",
      label: t("reports.loyalty.repeatRate", "Repeat visit rate"),
      icon: RotateCcw,
      accent: "neutral",
      value: d?.repeat_visit_rate ?? 0,
      formatType: "percent",
      loading: q.isLoading,
      hint: t("reports.loyalty.repeatRateHint", "{{repeat}} of {{earning}} earning members came back", {
        repeat: fmtNumber(d?.repeat_members ?? 0),
        earning: fmtNumber((d?.repeat_members ?? 0) + (d?.one_time_members ?? 0)),
      }),
    },
    {
      key: "new_member_share",
      label: t("reports.loyalty.newShare", "New member share"),
      icon: UserPlus,
      accent: "warning",
      value: d?.new_member_share ?? 0,
      formatType: "percent",
      loading: q.isLoading,
      hint: t("reports.loyalty.newShareHint", "{{new}} of {{active}} active members joined this period", {
        new: fmtNumber(d?.new_members_active ?? 0),
        active: fmtNumber(d?.active_members ?? 0),
      }),
    },
  ];

  const [tab, setTab] = useState("overview");

  if (authz.ready && !canSee) {
    return <Restricted title={t("reports.loyalty.title", "Loyalty")} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

  return (
    <Page>
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <PageHeader
          title={t("reports.loyalty.title", "Loyalty")}
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange aria-hidden className="size-3.5" />
              {periodLabel}
            </span>
          }
          below={
            <PageTabsList>
              <PageTabsTrigger value="overview" className="first:ps-0">{t("reports.loyalty.tabs.overview", "Overview")}</PageTabsTrigger>
              <PageTabsTrigger value="campaigns">{t("reports.loyalty.tabs.campaigns", "Campaigns")}</PageTabsTrigger>
              <PageTabsTrigger value="liability">{t("reports.loyalty.tabs.liability", "Liability")}</PageTabsTrigger>
            </PageTabsList>
          }
        />

        <TabsContent value="overview">
          {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : <LedgerStrip items={kpis} />}
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab branchId={branchId} from={from} to={to} />
        </TabsContent>
        <TabsContent value="liability">
          <LiabilityTab branchId={branchId} from={from} to={to} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

const CAMPAIGN_LABELS: Record<string, string> = { winback: "Win-back", birthday: "Birthday" };

function CampaignsTab({ branchId, from, to }: { branchId: string | null; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const q = useGetLoyaltyCampaignEffectiveness({ branch_id: branchId ?? undefined, from: from ?? undefined, to: to ?? undefined });
  const rows = q.data?.campaigns ?? [];

  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (q.isLoading) {
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }
  if (rows.length === 0 || rows.every((r) => r.sent === 0)) {
    return <EmptyState title={t("reports.loyalty.noCampaigns", "No outreach sent for this scope and period.")} />;
  }
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      {rows.map((r) => (
        <div key={r.campaign} className="space-y-1.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">{t(`reports.loyalty.campaign.${r.campaign}`, CAMPAIGN_LABELS[r.campaign] ?? r.campaign)}</span>
            <bdi className="font-mono tabular">{fmtPercent(r.return_rate)}</bdi>
          </div>
          <ProgressBar value={r.return_rate} max={1} ariaLabel={r.campaign} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t("reports.loyalty.campaignHint", "{{returned}} of {{sent}} nudged members earned again within 30 days", {
              returned: fmtNumber(r.returned_within_30d),
              sent: fmtNumber(r.sent),
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

function LiabilityTab({ branchId, from, to }: { branchId: string | null; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const q = useGetLoyaltyLiabilityTrend({ branch_id: branchId ?? undefined, from: from ?? undefined, to: to ?? undefined });
  const currency = q.data?.currency ?? "points";
  const chart = useMemo(
    () => (q.data?.points ?? []).map((p) => ({ week: p.week, outstanding: p.outstanding })),
    [q.data],
  );

  return (
    <ChartCard
      title={t("reports.loyalty.liabilityTrend", "Liability trend")}
      description={t("reports.loyalty.liabilityTrendHint", "Net {{unit}} earned minus redeemed each week", { unit: currencyLabel(currency) })}
    >
      {q.isLoading ? <Skeleton className="h-72 w-full" /> : q.isError ? <ErrorState className="h-72" onRetry={() => q.refetch()} /> : chart.length === 0
        ? <EmptyState className="h-72" title={t("reports.loyalty.noLiability", "No loyalty activity for this scope and period.")} />
        : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} />
                <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => `${fmtNumber(Number(v))} ${currencyLabel(currency, Number(v))}`} />} />
                <Bar dataKey="outstanding" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
    </ChartCard>
  );
}
