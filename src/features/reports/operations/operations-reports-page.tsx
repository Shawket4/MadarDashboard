import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";

import { EmbeddedPages, Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs } from "@/components/ui/tabs";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { TablesInsightsPage } from "@/features/insights/tables-page";
import {
  BranchesTab, ItemsTab, OverviewTab, TellersTab, WaitersTab, type Range,
} from "@/features/analytics/analytics-page";
import { AnalyticsExportButton } from "@/features/analytics/analytics-export-button";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

type TabKey = "tables" | "overview" | "items" | "tellers" | "waiters" | "branches";

const TABS: TabKey[] = ["tables", "overview", "items", "tellers", "waiters", "branches"];

/**
 * Operations reports — running the floor day to day: table analytics (its
 * own full page, nested via `EmbeddedPages` so its inner Page/PageHeader
 * collapses into a sub-heading instead of a second page chrome), and the
 * Analytics tabs that read volume rather than money (orders, items sold,
 * staff performance, branch comparison). The money-focused tabs — menu
 * profitability, revenue, channel mix, stock valuation, supplier spend, and
 * the material cost trend report — live in Reports ▸ Financial; the
 * inventory-loss tabs live in Reports ▸ Inventory.
 */
export function OperationsReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { scopeBranchId, from, to, preset } = useScope();
  const range: Range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const [tab, setTab] = useState<TabKey>("tables");

  const TAB_LABEL: Record<TabKey, string> = {
    tables: t("reports.operations.tabs.tables", "Tables"),
    overview: t("reports.operations.tabs.overview", "Overview"),
    items: t("reports.operations.tabs.items", "Items"),
    tellers: t("reports.operations.tabs.tellers", "Tellers"),
    waiters: t("reports.operations.tabs.waiters", "Waiters"),
    branches: t("reports.operations.tabs.branches", "Branches"),
  };

  const headerActions = ["items", "tellers", "waiters", "branches"].includes(tab) ? (
    <AnalyticsExportButton tab={tab} branchId={scopeBranchId} orgId={orgId ?? ""} range={range} periodLabel={periodLabel} />
  ) : undefined;

  return (
    <Page>
      <PageHeader
        title={t("reports.operations.title", "Operations")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
        actions={headerActions}
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

      <EmbeddedPages>
        {tab === "tables" ? <TablesInsightsPage />
          : tab === "overview" ? <OverviewTab branchId={scopeBranchId} range={range} />
          : tab === "items" ? <ItemsTab branchId={scopeBranchId} range={range} />
          : tab === "tellers" ? <TellersTab branchId={scopeBranchId} range={range} />
          : tab === "waiters" ? <WaitersTab branchId={scopeBranchId} range={range} />
          : <BranchesTab orgId={orgId ?? ""} range={range} />}
      </EmbeddedPages>
    </Page>
  );
}
