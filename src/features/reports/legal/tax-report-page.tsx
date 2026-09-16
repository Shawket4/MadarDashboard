import { useTranslation } from "react-i18next";
import { Ban, Coins, Landmark, Percent, Receipt, TrendingUp } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgTaxReport } from "@/data/api/generated/api";
import { fmtPercent } from "@/lib/format";

/** VAT/tax report, across the branches the caller may see. Meaningful only
 * for a VAT-registered org. The report carries the org's rate itself, so no
 * separate org read is needed (that needs orgs:read, which a branch manager
 * lacks, and would wrongly show them "no VAT configured"). */
export function TaxTab({ range }: { range: { from?: string; to?: string } }) {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canSee = useAuthz().can(Cap.reportsLegal);

  const q = useOrgTaxReport(orgId ?? "", range, { query: { enabled: !!orgId && canSee } });
  const d = q.data;
  // Tax collected under an earlier rate still counts even if the rate is now 0.
  const isVatRegistered = !!d && (d.org_tax_rate > 0 || d.tax_collected > 0 || d.refunded_tax > 0);
  const taxableSales = d ? d.subtotal - d.discount_amount : 0;

  const kpis: LedgerItem[] = [
    { key: "taxable_sales", label: t("analytics.tax.taxableSales", "Taxable Sales"), icon: Receipt, accent: "neutral", value: taxableSales, formatType: "money", loading: q.isLoading },
    { key: "tax_collected", label: t("analytics.tax.taxCollected", "Tax Collected"), icon: Percent, accent: "info", value: d?.tax_collected ?? 0, formatType: "money", loading: q.isLoading },
    { key: "refunded_tax", label: t("analytics.tax.refundedTax", "Refunded Tax"), icon: Ban, accent: "warning", value: d?.refunded_tax ?? 0, formatType: "money", loading: q.isLoading },
    { key: "net_tax_due", label: t("analytics.tax.netTaxDue", "Net Tax Due"), icon: Landmark, accent: "primary", value: d?.net_tax_due ?? 0, formatType: "money", loading: q.isLoading },
    { key: "service_charge", label: t("analytics.tax.serviceCharge", "Service Charge"), icon: Coins, accent: "neutral", value: d?.service_charge_amount ?? 0, formatType: "money", loading: q.isLoading },
    { key: "net_revenue", label: t("dashboard.revenue", "Revenue"), icon: TrendingUp, accent: "neutral", value: d?.net_revenue ?? 0, formatType: "money", loading: q.isLoading },
  ];

  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!orgId || q.isLoading) return <Skeleton className="h-28 w-full" />;
  if (!isVatRegistered) {
    return (
      <EmptyState
        icon={Landmark}
        title={t("reports.legal.noVat", "This organization has no VAT configured")}
        description={t("reports.legal.noVatHint", "Set a tax rate under Settings to see a tax report here.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {d ? (
        <p className="text-xs text-muted-foreground">
          {t("analytics.tax.rateNote", "Org tax rate: {{rate}}", { rate: fmtPercent(d.org_tax_rate) })}
        </p>
      ) : null}
      <LedgerStrip items={kpis} />
    </div>
  );
}
