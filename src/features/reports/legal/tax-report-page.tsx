import { useTranslation } from "react-i18next";
import { Ban, CalendarRange, Coins, Landmark, Percent, Receipt, TrendingUp } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { useGetOrg, useOrgTaxReport } from "@/data/api/generated/api";
import { fmtPercent } from "@/lib/format";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

/** Org-wide VAT/tax report. Meaningful only for a VAT-registered org
 * (tax_rate > 0); reading tax_rate needs orgs:read, which only
 * org_admin/super_admin hold by default. */
export function TaxReportPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { from, to, preset } = useScope();
  const range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const role = useAuthStore((s) => s.user?.role);
  const canSeeOrg = role === "org_admin" || role === "super_admin";
  const orgQuery = useGetOrg(orgId ?? "", { query: { enabled: canSeeOrg && !!orgId } });
  const isVatRegistered = Number(orgQuery.data?.tax_rate ?? 0) > 0;

  const q = useOrgTaxReport(orgId ?? "", range, { query: { enabled: !!orgId && isVatRegistered } });
  const d = q.data;
  const taxableSales = d ? d.subtotal - d.discount_amount : 0;

  const kpis: LedgerItem[] = [
    { key: "taxable_sales", label: t("analytics.tax.taxableSales", "Taxable Sales"), icon: Receipt, accent: "neutral", value: taxableSales, formatType: "money", loading: q.isLoading },
    { key: "tax_collected", label: t("analytics.tax.taxCollected", "Tax Collected"), icon: Percent, accent: "info", value: d?.tax_collected ?? 0, formatType: "money", loading: q.isLoading },
    { key: "refunded_tax", label: t("analytics.tax.refundedTax", "Refunded Tax"), icon: Ban, accent: "warning", value: d?.refunded_tax ?? 0, formatType: "money", loading: q.isLoading },
    { key: "net_tax_due", label: t("analytics.tax.netTaxDue", "Net Tax Due"), icon: Landmark, accent: "primary", value: d?.net_tax_due ?? 0, formatType: "money", loading: q.isLoading },
    { key: "service_charge", label: t("analytics.tax.serviceCharge", "Service Charge"), icon: Coins, accent: "neutral", value: d?.service_charge_amount ?? 0, formatType: "money", loading: q.isLoading },
    { key: "net_revenue", label: t("dashboard.revenue", "Revenue"), icon: TrendingUp, accent: "neutral", value: d?.net_revenue ?? 0, formatType: "money", loading: q.isLoading },
  ];

  return (
    <Page>
      <PageHeader
        title={t("reports.legal.tax", "Tax report")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
      />

      {!orgQuery.isLoading && !isVatRegistered ? (
        <EmptyState
          icon={Landmark}
          title={t("reports.legal.noVat", "This organization has no VAT configured")}
          description={t("reports.legal.noVatHint", "Set a tax rate under Settings to see a tax report here.")}
        />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-4">
          {d ? (
            <p className="text-xs text-muted-foreground">
              {t("analytics.tax.rateNote", "Org tax rate: {{rate}}", { rate: fmtPercent(d.org_tax_rate) })}
            </p>
          ) : null}
          <LedgerStrip items={kpis} />
        </div>
      )}
    </Page>
  );
}
