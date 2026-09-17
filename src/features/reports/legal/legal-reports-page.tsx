import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs } from "@/components/ui/tabs";
import { useScope } from "@/data/scope/use-scope";
import {
  useAttendanceCorrectionsAudit, useDeductionOverridesAudit, useDiscountsAudit,
  useLoyaltyAdjustmentsAudit, useManualDeductionsAudit, usePriceOverrides,
  useRefundsAudit, useVoidsAudit, useWaiversAudit,
} from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { AuditTab } from "./audit-tab";
import { TaxTab } from "./tax-report-page";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

type TabKey =
  | "tax" | "refunds" | "voids" | "discounts" | "waivers" | "price_overrides"
  | "manual_deductions" | "deduction_overrides" | "loyalty_adjustments" | "attendance_corrections";

const TABS: TabKey[] = [
  "tax", "refunds", "voids", "discounts", "waivers", "price_overrides",
  "manual_deductions", "deduction_overrides", "loyalty_adjustments", "attendance_corrections",
];

/** Legal / compliance reports: the VAT summary plus an audit trail of every
 * kind of money or record a human corrected after the fact — refunds,
 * voids, discounts, service-charge waivers, price overrides, manual payroll
 * deductions, deduction overrides/waivers, manual loyalty adjustments, and
 * attendance corrections. Every audit tab but Tax is the same report shape
 * from the backend (a total plus a reason and an issuer breakdown),
 * rendered by the shared `AuditTab`. */
export function LegalReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { from, to, preset } = useScope();
  const range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const [tab, setTab] = useState<TabKey>("tax");
  const enabled = !!orgId;
  const on = (k: TabKey) => enabled && tab === k;

  const refunds = useRefundsAudit(orgId ?? "", range, { query: { enabled: on("refunds") } });
  const voids = useVoidsAudit(orgId ?? "", range, { query: { enabled: on("voids") } });
  const discounts = useDiscountsAudit(orgId ?? "", range, { query: { enabled: on("discounts") } });
  const waivers = useWaiversAudit(orgId ?? "", range, { query: { enabled: on("waivers") } });
  const overrides = usePriceOverrides(orgId ?? "", range, { query: { enabled: on("price_overrides") } });
  const manualDeductions = useManualDeductionsAudit(orgId ?? "", range, { query: { enabled: on("manual_deductions") } });
  const deductionOverrides = useDeductionOverridesAudit(orgId ?? "", range, { query: { enabled: on("deduction_overrides") } });
  const loyaltyAdjustments = useLoyaltyAdjustmentsAudit(orgId ?? "", range, { query: { enabled: on("loyalty_adjustments") } });
  const attendanceCorrections = useAttendanceCorrectionsAudit(orgId ?? "", range, { query: { enabled: on("attendance_corrections") } });

  const TAB_LABEL: Record<TabKey, string> = {
    tax: t("reports.legal.tabs.tax", "Tax"),
    refunds: t("reports.legal.tabs.refunds", "Refunds"),
    voids: t("reports.legal.tabs.voids", "Voids"),
    discounts: t("reports.legal.tabs.discounts", "Discounts"),
    waivers: t("reports.legal.tabs.waivers", "Waivers"),
    price_overrides: t("reports.legal.tabs.priceOverrides", "Price overrides"),
    manual_deductions: t("reports.legal.tabs.manualDeductions", "Manual deductions"),
    deduction_overrides: t("reports.legal.tabs.deductionOverrides", "Deduction overrides"),
    loyalty_adjustments: t("reports.legal.tabs.loyaltyAdjustments", "Loyalty adjustments"),
    attendance_corrections: t("reports.legal.tabs.attendanceCorrections", "Attendance corrections"),
  };

  const byReason = t("reports.legal.byReason", "By reason");
  const byDiscount = t("reports.legal.byDiscount", "By discount");
  const byBranch = t("reports.legal.byBranch", "By branch");
  const byType = t("reports.legal.byType", "By type");

  return (
    <Page>
      <PageHeader
        title={t("reports.legal.title", "Legal")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
        below={
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <PageTabsList>
              {TABS.map((k) => (
                <PageTabsTrigger key={k} value={k} className="first:ps-0">{TAB_LABEL[k]}</PageTabsTrigger>
              ))}
            </PageTabsList>
          </Tabs>
        }
      />

      {tab === "tax" ? <TaxTab range={range} />
        : tab === "refunds" ? <AuditTab query={refunds} reasonLabel={byReason} exportTitle={TAB_LABEL.refunds} />
        : tab === "voids" ? <AuditTab query={voids} reasonLabel={byReason} exportTitle={TAB_LABEL.voids} />
        : tab === "discounts" ? <AuditTab query={discounts} reasonLabel={byDiscount} exportTitle={TAB_LABEL.discounts} />
        : tab === "waivers" ? <AuditTab query={waivers} reasonLabel={byBranch} exportTitle={TAB_LABEL.waivers} />
        : tab === "price_overrides" ? <AuditTab query={overrides} reasonLabel={byBranch} exportTitle={TAB_LABEL.price_overrides} />
        : tab === "manual_deductions" ? <AuditTab query={manualDeductions} reasonLabel={byReason} exportTitle={TAB_LABEL.manual_deductions} />
        : tab === "deduction_overrides" ? <AuditTab query={deductionOverrides} reasonLabel={byType} exportTitle={TAB_LABEL.deduction_overrides} />
        : tab === "loyalty_adjustments" ? <AuditTab query={loyaltyAdjustments} reasonLabel={byBranch} exportTitle={TAB_LABEL.loyalty_adjustments} />
        : <AuditTab query={attendanceCorrections} reasonLabel={byReason} exportTitle={TAB_LABEL.attendance_corrections} />}
    </Page>
  );
}
