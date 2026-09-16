import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs } from "@/components/ui/tabs";
import { useScope } from "@/data/scope/use-scope";
import {
  useDiscountsAudit, usePriceOverrides, useRefundsAudit, useVoidsAudit, useWaiversAudit,
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

type TabKey = "tax" | "refunds" | "voids" | "discounts" | "waivers" | "price_overrides";
const TABS: TabKey[] = ["tax", "refunds", "voids", "discounts", "waivers", "price_overrides"];

/** Legal / compliance reports: the VAT summary plus an audit trail of money
 * given away or corrected after a sale — refunds, voids, discounts,
 * service-charge waivers, and price overrides. Every audit tab is the same
 * report shape from the backend (a total plus a reason and an issuer
 * breakdown), rendered by the shared `AuditTab`. */
export function LegalReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { from, to, preset } = useScope();
  const range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const [tab, setTab] = useState<TabKey>("tax");
  const enabled = !!orgId;

  const refunds = useRefundsAudit(orgId ?? "", range, { query: { enabled: enabled && tab === "refunds" } });
  const voids = useVoidsAudit(orgId ?? "", range, { query: { enabled: enabled && tab === "voids" } });
  const discounts = useDiscountsAudit(orgId ?? "", range, { query: { enabled: enabled && tab === "discounts" } });
  const waivers = useWaiversAudit(orgId ?? "", range, { query: { enabled: enabled && tab === "waivers" } });
  const overrides = usePriceOverrides(orgId ?? "", range, { query: { enabled: enabled && tab === "price_overrides" } });

  const TAB_LABEL: Record<TabKey, string> = {
    tax: t("reports.legal.tabs.tax", "Tax"),
    refunds: t("reports.legal.tabs.refunds", "Refunds"),
    voids: t("reports.legal.tabs.voids", "Voids"),
    discounts: t("reports.legal.tabs.discounts", "Discounts"),
    waivers: t("reports.legal.tabs.waivers", "Waivers"),
    price_overrides: t("reports.legal.tabs.priceOverrides", "Price overrides"),
  };

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
        : tab === "refunds" ? <AuditTab query={refunds} reasonLabel={t("reports.legal.byReason", "By reason")} />
        : tab === "voids" ? <AuditTab query={voids} reasonLabel={t("reports.legal.byReason", "By reason")} />
        : tab === "discounts" ? <AuditTab query={discounts} reasonLabel={t("reports.legal.byDiscount", "By discount")} />
        : tab === "waivers" ? <AuditTab query={waivers} reasonLabel={t("reports.legal.byBranch", "By branch")} />
        : <AuditTab query={overrides} reasonLabel={t("reports.legal.byBranch", "By branch")} />}
    </Page>
  );
}
