import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";

import { EmbeddedPages, Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Tabs } from "@/components/ui/tabs";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap, type Capability } from "@/generated/capabilities";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import {
  useBranchInventoryValuation, useBranchMaterialCostTrend, useBranchSupplierSpend, useListCatalog,
  useOrgInventoryValuation, useOrgMaterialCostTrend, useOrgSupplierSpend,
} from "@/data/api/generated/api";
import { exportToExcel, exportToCsv, type ExcelColumn } from "@/lib/excel";
import { ProfitabilityPage } from "@/features/insights/profitability-page";
import { ChannelTab, RevenueTab, type Range } from "@/features/analytics/analytics-page";
import { AnalyticsExportButton } from "@/features/analytics/analytics-export-button";
import { buildInventoryExportSheet, MaterialCostTrendTab, SupplierSpendTab, ValuationTab } from "@/features/inventory/reports-page";
import type { Granularity } from "@/features/analytics/lib";
import type { MaterialCostTrendRow } from "@/data/api/generated/models";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

type TabKey = "profitability" | "revenue" | "channel" | "valuation" | "supplierSpend" | "materialCostTrend";

const TABS: TabKey[] = ["profitability", "revenue", "channel", "valuation", "supplierSpend", "materialCostTrend"];

/** What each tab reads: sales (orders.read), stock value (inventory.read), or
 *  what the business pays its suppliers (purchasing.orders.read). */
const TAB_CAP: Record<TabKey, Capability> = {
  profitability: Cap.ordersRead,
  revenue: Cap.ordersRead,
  channel: Cap.ordersRead,
  valuation: Cap.inventoryRead,
  supplierSpend: Cap.purchasingOrdersRead,
  materialCostTrend: Cap.purchasingOrdersRead,
};

const INVENTORY_TABS = new Set<TabKey>(["valuation", "supplierSpend", "materialCostTrend"]);

type InventoryScope = "branch" | "org";

/**
 * Financial reports — the money-focused half of what used to be split across
 * the Sales and Inventory pages: menu profitability (its own full page,
 * nested via `EmbeddedPages`), revenue and channel-mix analytics, stock
 * valuation, supplier spend, and the material cost trend / supplier-switch
 * suggestion report.
 */
export function FinancialReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, scopeBranchId, from, to, preset } = useScope();
  const range: Range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const authz = useAuthz();
  const visible = TABS.filter((k) => authz.can(TAB_CAP[k]));
  const [picked, setTab] = useState<TabKey>("profitability");
  const tab: TabKey = visible.includes(picked) ? picked : (visible[0] ?? "profitability");
  const [gran, setGran] = useState<Granularity>("daily");
  const [invScope, setInvScope] = useState<InventoryScope>(branchId ? "branch" : "org");
  const isInvBranch = invScope === "branch";
  const logoUrl = useExportLogo();
  const [invExporting, setInvExporting] = useState(false);

  const onInv = (key: TabKey) => tab === key && visible.includes(key);
  const branchVal = useBranchInventoryValuation(branchId ?? "", { query: { enabled: isInvBranch && onInv("valuation") && !!branchId } });
  const orgVal = useOrgInventoryValuation(orgId ?? "", { query: { enabled: !isInvBranch && onInv("valuation") && !!orgId } });
  const valuation = isInvBranch ? branchVal : orgVal;
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: onInv("valuation") && !!orgId } });

  const branchSpend = useBranchSupplierSpend(branchId ?? "", range, { query: { enabled: isInvBranch && onInv("supplierSpend") && !!branchId } });
  const orgSpend = useOrgSupplierSpend(orgId ?? "", range, { query: { enabled: !isInvBranch && onInv("supplierSpend") && !!orgId } });
  const supplierSpend = isInvBranch ? branchSpend : orgSpend;

  const branchTrend = useBranchMaterialCostTrend(branchId ?? "", range, { query: { enabled: isInvBranch && onInv("materialCostTrend") && !!branchId } });
  const orgTrend = useOrgMaterialCostTrend(orgId ?? "", range, { query: { enabled: !isInvBranch && onInv("materialCostTrend") && !!orgId } });
  const materialCostTrend = isInvBranch ? branchTrend : orgTrend;

  const byCategory = useMemo(() => {
    const cat = new Map<string, string>();
    for (const c of catalog.data ?? []) cat.set(c.id, c.category_name);
    const sums = new Map<string, number>();
    for (const it of valuation.data?.items ?? []) {
      if (it.value == null) continue;
      const key = cat.get(it.org_ingredient_id) ?? t("inventory.catalog.uncategorized", "Uncategorized");
      sums.set(key, (sums.get(key) ?? 0) + it.value);
    }
    const rows = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    const max = rows.reduce((m, [, v]) => Math.max(m, v), 0);
    return { rows, max };
  }, [catalog.data, valuation.data, t]);

  const TAB_LABEL: Record<TabKey, string> = {
    profitability: t("reports.financial.tabs.profitability", "Menu profitability"),
    revenue: t("reports.financial.tabs.revenue", "Revenue"),
    channel: t("reports.financial.tabs.channel", "Channel"),
    valuation: t("reports.financial.tabs.valuation", "Valuation"),
    supplierSpend: t("reports.financial.tabs.supplierSpend", "Supplier spend"),
    materialCostTrend: t("reports.financial.tabs.materialCostTrend", "Material cost trend"),
  };

  const noData = t("inventory.reports.noDataPeriod", "Nothing recorded for this scope and period.");

  const buildInvSheet = () => {
    if (tab === "materialCostTrend") {
      const rows: MaterialCostTrendRow[] = materialCostTrend.data ?? [];
      const cols: ExcelColumn<MaterialCostTrendRow>[] = [
        { header: t("inventory.reports.ingredient", "Item"), accessor: (r) => r.ingredient_name, type: "text", width: 26 },
        { header: t("inventory.reports.supplier", "Supplier"), accessor: (r) => r.current_supplier_name, type: "text", width: 22 },
        { header: t("inventory.reports.currentCost", "Current cost"), accessor: (r) => r.current_cost, type: "money", width: 14 },
        { header: t("inventory.reports.priceStreak", "Price trend"), accessor: (r) => `+${r.pct_increase}%`, type: "text", width: 14 },
        { header: t("inventory.reports.suggestion", "Suggestion"), accessor: (r) => r.cheaper_supplier_name ?? "", type: "text", width: 22 },
      ];
      const title = t("reports.financial.tabs.materialCostTrend", "Material cost trend");
      return { title, subtitle: isInvBranch ? t("inventory.reports.branch", "This branch") : t("inventory.reports.org", "Whole organization"), rows: rows as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] };
    }
    return buildInventoryExportSheet(tab, isInvBranch, t, {
      byCategory, consumption: undefined, shrinkage: undefined, wasteReport: undefined,
      supplierSpend: supplierSpend.data,
    });
  };
  const handleInvExport = async () => {
    const sheet = buildInvSheet();
    setInvExporting(true);
    try {
      await exportToExcel({ filename: `Madar-${sheet.title}`, logoUrl, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setInvExporting(false);
    }
  };
  const handleInvExportCsv = async () => {
    const sheet = buildInvSheet();
    try {
      await exportToCsv({ filename: `Madar-${sheet.title}`, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const headerActions = ["revenue", "channel"].includes(tab) ? (
    <AnalyticsExportButton tab={tab} branchId={scopeBranchId} orgId={orgId ?? ""} range={range} periodLabel={periodLabel} />
  ) : INVENTORY_TABS.has(tab) ? (
    <ExportButton onExport={handleInvExport} onExportCsv={handleInvExportCsv} loading={invExporting} />
  ) : undefined;

  if (authz.ready && visible.length === 0) {
    return <Restricted title={t("reports.financial.title", "Financial")} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

  return (
    <Page>
      <PageHeader
        title={t("reports.financial.title", "Financial")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
        actions={headerActions}
        below={
          <>
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <PageTabsList>
                {visible.map((k) => (
                  <PageTabsTrigger key={k} value={k} className="first:ps-0">{TAB_LABEL[k]}</PageTabsTrigger>
                ))}
              </PageTabsList>
            </Tabs>
            {INVENTORY_TABS.has(tab) ? (
              <SegmentedControl<InventoryScope>
                value={invScope}
                onChange={setInvScope}
                options={[
                  { value: "branch", label: t("inventory.reports.branch", "This branch") },
                  { value: "org", label: t("inventory.reports.org", "Whole organization") },
                ]}
              />
            ) : null}
          </>
        }
      />

      <EmbeddedPages>
        {tab === "profitability" ? <ProfitabilityPage />
          : tab === "revenue" ? <RevenueTab branchId={scopeBranchId} range={range} gran={gran} setGran={setGran} />
          : tab === "channel" ? <ChannelTab branchId={scopeBranchId} range={range} />
          : tab === "valuation" ? <ValuationTab valuation={valuation} catalogLoading={catalog.isLoading} byCategory={byCategory} />
          : tab === "supplierSpend" ? <SupplierSpendTab supplierSpend={supplierSpend} noData={noData} />
          : <MaterialCostTrendTab trend={materialCostTrend} noData={noData} />}
      </EmbeddedPages>
    </Page>
  );
}
