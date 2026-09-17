import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, CalendarRange, Store } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { ExportButton } from "@/components/app/export-button";
import { SegmentedControl } from "@/components/app/segmented-control";
import { EmptyState } from "@/components/app/empty-state";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import {
  useBranchConsumption, useBranchPoLeadTime, useBranchShrinkage, useBranchWasteReport,
  useOrgConsumption, useOrgPoLeadTime, useOrgShrinkage, useOrgWasteReport,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { exportToExcel, exportToCsv } from "@/lib/excel";
import {
  buildInventoryExportSheet, ConsumptionTab, PoLeadTimeTab, ShrinkageTab, WasteTab,
} from "@/features/inventory/reports-page";
import { LowStockTab } from "@/features/inventory/low-stock-tab";

type ReportScope = "branch" | "org";
type TabKey = "consumption" | "shrinkage" | "waste" | "poLeadTime" | "lowStock";

const SCOPED_TABS = new Set<TabKey>(["consumption", "shrinkage", "waste", "poLeadTime"]);

/** Inventory reports — consumption, shrinkage, waste, PO fulfillment lead
 *  time, and a read-only low-stock listing. Stock valuation and supplier
 *  spend moved to Reports ▸ Financial; menu profitability, revenue and
 *  channel mix live there too. */
export function InventoryReportsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, from, to, preset } = useScope();

  const [scope, setScope] = useState<ReportScope>(branchId ? "branch" : "org");
  const [tab, setTab] = useState<TabKey>("consumption");
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  const isBranch = scope === "branch";
  const scopeId = isBranch ? branchId : orgId;
  const range = { from: from ?? undefined, to: to ?? undefined };
  // inventory.read for the page; PO lead time is purchasing (purchasing.orders.read).
  const authz = useAuthz();
  const canLead = authz.can(Cap.purchasingOrdersRead);
  const canSee = authz.can(Cap.inventoryRead);
  const on = (key: TabKey) => canSee && tab === key && !!scopeId && (key !== "poLeadTime" || canLead);

  const branchCons = useBranchConsumption(branchId ?? "", range, { query: { enabled: isBranch && on("consumption") && !!branchId } });
  const orgCons = useOrgConsumption(orgId ?? "", range, { query: { enabled: !isBranch && on("consumption") && !!orgId } });
  const consumption = isBranch ? branchCons : orgCons;

  const branchShr = useBranchShrinkage(branchId ?? "", range, { query: { enabled: isBranch && on("shrinkage") && !!branchId } });
  const orgShr = useOrgShrinkage(orgId ?? "", range, { query: { enabled: !isBranch && on("shrinkage") && !!orgId } });
  const shrinkage = isBranch ? branchShr : orgShr;

  const branchWaste = useBranchWasteReport(branchId ?? "", range, { query: { enabled: isBranch && on("waste") && !!branchId } });
  const orgWaste = useOrgWasteReport(orgId ?? "", range, { query: { enabled: !isBranch && on("waste") && !!orgId } });
  const wasteReport = isBranch ? branchWaste : orgWaste;

  const branchLead = useBranchPoLeadTime(branchId ?? "", range, { query: { enabled: isBranch && on("poLeadTime") && !!branchId } });
  const orgLead = useOrgPoLeadTime(orgId ?? "", range, { query: { enabled: !isBranch && on("poLeadTime") && !!orgId } });
  const poLeadTime = isBranch ? branchLead : orgLead;

  const buildExportSheet = () => buildInventoryExportSheet(tab, isBranch, t, {
    byCategory: { rows: [] }, consumption: consumption.data, shrinkage: shrinkage.data, wasteReport: wasteReport.data,
    poLeadTime: poLeadTime.data,
  });

  const handleExport = async () => {
    const sheet = buildExportSheet();
    setExporting(true);
    try {
      await exportToExcel({ filename: `Madar-${sheet.title}`, logoUrl, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    const sheet = buildExportSheet();
    try {
      await exportToCsv({ filename: `Madar-${sheet.title}`, sheets: [{ name: sheet.title, ...sheet }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const currentCount =
    tab === "consumption" ? (consumption.data?.length ?? 0)
      : tab === "shrinkage" ? (shrinkage.data?.length ?? 0)
        : tab === "waste" ? (wasteReport.data?.length ?? 0)
          : (poLeadTime.data?.by_supplier.length ?? 0);

  if (authz.ready && !canSee) {
    return <Restricted title={t("inventory.reports.title", "Inventory reports")} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("inventory.reports.title", "Inventory reports")} />
        <EmptyState icon={Boxes} title={t("inventory.pickOrg", "Select an organization to manage inventory")} />
      </Page>
    );
  }

  const branchGate = isBranch && !branchId;
  const noData = t("inventory.reports.noDataPeriod", "Nothing recorded for this scope and period.");
  const isExportableTab = tab !== "lowStock";

  return (
    <Page>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-6">
        <PageHeader
          title={t("inventory.reports.title", "Inventory reports")}
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange aria-hidden className="size-3.5" />
              {t(`scope.preset.${preset ?? "30d"}`, preset ?? "30d")}
            </span>
          }
          actions={isExportableTab ? <ExportButton onExport={handleExport} onExportCsv={handleExportCsv} loading={exporting} disabled={branchGate || !currentCount} /> : undefined}
          below={
            <>
              <PageTabsList>
                <PageTabsTrigger value="consumption" className="first:ps-0">{t("inventory.reports.consumption", "Consumption")}</PageTabsTrigger>
                <PageTabsTrigger value="shrinkage">{t("inventory.reports.shrinkage", "Shrinkage")}</PageTabsTrigger>
                <PageTabsTrigger value="waste">{t("inventory.reports.wasteReport", "Waste")}</PageTabsTrigger>
                {canLead ? <PageTabsTrigger value="poLeadTime">{t("inventory.reports.poLeadTime", "PO lead time")}</PageTabsTrigger> : null}
                <PageTabsTrigger value="lowStock">{t("reports.operations.tabs.lowStock", "Low stock")}</PageTabsTrigger>
              </PageTabsList>
              {SCOPED_TABS.has(tab) ? (
                <SegmentedControl<ReportScope>
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: "branch", label: t("inventory.reports.branch", "This branch") },
                    { value: "org", label: t("inventory.reports.org", "Whole organization") },
                  ]}
                />
              ) : null}
            </>
          }
        />

        {branchGate && tab !== "lowStock" ? (
          <EmptyState icon={Store} title={t("inventory.pickBranch", "Select a branch to manage its stock")} />
        ) : (
          <>
            <TabsContent value="consumption">
              <ConsumptionTab consumption={consumption} noData={noData} />
            </TabsContent>
            <TabsContent value="shrinkage">
              <ShrinkageTab shrinkage={shrinkage} noData={noData} />
            </TabsContent>
            <TabsContent value="waste">
              <WasteTab wasteReport={wasteReport} noData={noData} />
            </TabsContent>
            {canLead ? (
              <TabsContent value="poLeadTime">
                <PoLeadTimeTab poLeadTime={poLeadTime} noData={noData} />
              </TabsContent>
            ) : null}
            <TabsContent value="lowStock">
              <LowStockTab orgId={orgId} branchId={branchId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </Page>
  );
}
