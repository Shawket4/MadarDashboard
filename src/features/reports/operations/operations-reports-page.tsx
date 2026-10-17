import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { recipes, Reveal } from "@/lib/motion";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs } from "@/components/ui/tabs";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useScope } from "@/data/scope/use-scope";
import { useListFilters } from "@/data/scope/use-list-filters";
import { operationsReportsSearch } from "../search";
import { useOrgId } from "@/hooks/use-org-id";
import type { Range } from "@/features/analytics/lib";
import { AnalyticsExportButton } from "@/features/analytics/analytics-export-button";
import { OverviewTab } from "./overview-tab";
import { TablesTab } from "./tables-tab";
import { BranchesTab, ItemsTab, TellersTab, WaitersTab } from "./volume-tabs";

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
 * Operations reports — running the floor day to day: table analytics and the
 * Analytics tabs that read volume rather than money (orders, items sold,
 * staff performance, branch comparison). The money-focused tabs — menu
 * profitability, revenue, channel mix, stock valuation, supplier spend, and
 * the material cost trend report — live in Reports ▸ Financial; the
 * inventory-loss tabs live in Reports ▸ Inventory.
 *
 * One page header (title, period, export) and one tab row for every tab; each
 * tab body is built from the Overview's parts (./report-kit), so none brings
 * a header, filter row or card style of its own.
 */
export function OperationsReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { scopeBranchId, from, to, preset } = useScope();
  const range: Range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  // The tab lives in the URL (reports/search.ts).
  const filters = useListFilters(operationsReportsSearch);
  const tab: TabKey = filters.values.tab;
  const setTab = (v: TabKey) => filters.set({ tab: v });
  // Every tab reads orders (orders.read); the server narrows to the person's branches.
  const authz = useAuthz();

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

  if (authz.ready && !authz.can(Cap.ordersRead)) {
    return <Restricted title={t("reports.operations.title", "Operations")} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

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

      {/* A new tab's body fades in, so the switch reads; its groups bring themselves in. */}
      <Reveal replayKey={tab} recipe={recipes.fade()}>
        {tab === "tables" ? <TablesTab />
          : tab === "overview" ? <OverviewTab branchId={scopeBranchId} range={range} />
          : tab === "items" ? <ItemsTab branchId={scopeBranchId} range={range} />
          : tab === "tellers" ? <TellersTab branchId={scopeBranchId} range={range} />
          : tab === "waiters" ? <WaitersTab branchId={scopeBranchId} range={range} />
          : <BranchesTab orgId={orgId ?? ""} range={range} />}
      </Reveal>
    </Page>
  );
}
