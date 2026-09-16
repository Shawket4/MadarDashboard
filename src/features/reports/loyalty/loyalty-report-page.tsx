import { useTranslation } from "react-i18next";
import { CalendarRange, Gift, Percent, RotateCcw, UserPlus, Users } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { useScope } from "@/data/scope/use-scope";
import { useGetLoyaltyBehavior } from "@/data/api/generated/api";
import { fmtNumber } from "@/lib/format";

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

  const q = useGetLoyaltyBehavior(range);
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

  return (
    <Page>
      <PageHeader
        title={t("reports.loyalty.title", "Loyalty")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
      />

      {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : <LedgerStrip items={kpis} />}
    </Page>
  );
}
