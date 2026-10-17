import i18next from "i18next";

import { readExcludedItems } from "@/components/app/exclude-items-control";
import {
  getAttendanceCorrectionsAuditQueryOptions,
  getBranchInventoryValuationQueryOptions,
  getBranchMaterialCostTrendQueryOptions,
  getBranchSupplierSpendQueryOptions,
  getBranchTillSessionsQueryOptions,
  getBundlesReportQueryOptions,
  getDeductionOverridesAuditQueryOptions,
  getDiscountsAuditQueryOptions,
  getListCatalogQueryOptions,
  getLoyaltyAdjustmentsAuditQueryOptions,
  getManualDeductionsAuditQueryOptions,
  getOrgInventoryValuationQueryOptions,
  getOrgMaterialCostTrendQueryOptions,
  getOrgSupplierSpendQueryOptions,
  getOrgTaxReportQueryOptions,
  getPriceOverridesQueryOptions,
  getRefundsAuditQueryOptions,
  getVoidsAuditQueryOptions,
  getWaiversAuditQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { Cap } from "@/generated/capabilities";
import { prefetchAnalyticsTab } from "@/features/analytics/queries";
import { prefetchInventoryReports } from "@/features/inventory/queries";
import { prefetchProfitability, prefetchTablesInsights } from "@/features/insights/queries";
import { bundlesReportParams, cachedAuthz, cachedModules, financialTabs, legalTabs, openTab, type LegalTab } from "@/features/reports/queries";
import { bundlesReportSearch, financialReportsSearch, legalReportsSearch, operationsReportsSearch } from "@/features/reports/search";
import { prefetchStaffPoolReport, prefetchStaffPoolSettings } from "@/features/staff-pool/queries";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

const rangeOf = (from: string | null, to: string | null) => ({ from: from ?? undefined, to: to ?? undefined });

/** Each Legal audit tab's one read (Tax is its own). */
const LEGAL_AUDIT = {
  refunds: getRefundsAuditQueryOptions,
  voids: getVoidsAuditQueryOptions,
  discounts: getDiscountsAuditQueryOptions,
  waivers: getWaiversAuditQueryOptions,
  price_overrides: getPriceOverridesQueryOptions,
  manual_deductions: getManualDeductionsAuditQueryOptions,
  deduction_overrides: getDeductionOverridesAuditQueryOptions,
  loyalty_adjustments: getLoyaltyAdjustmentsAuditQueryOptions,
  attendance_corrections: getAttendanceCorrectionsAuditQueryOptions,
} satisfies Record<Exclude<LegalTab, "tax">, unknown>;

/**
 * Sidebar/palette intent prefetch for the reports area: route → the mount-time
 * queries of the tab the page opens on (its remembered tab, else the default,
 * narrowed to the tabs the person may read, exactly as the page decides).
 */
export const routes: RoutePrefetchMap = {
  "/reports/operations": (qc, { orgId, branchId, from, to }) => {
    const { tab } = operationsReportsSearch.entryValues(branchId);
    if (tab === "tables") return prefetchTablesInsights(qc, { branchId, from, to }, i18next.language);
    prefetchAnalyticsTab(qc, tab, {
      orgId,
      scopeBranchId: branchId ?? ALL_BRANCHES_ID,
      range: rangeOf(from, to),
      excludedItems: readExcludedItems(orgId),
    });
  },
  "/reports/financial": (qc, { orgId, branchId, from, to }) => {
    const f = financialReportsSearch.entryValues(branchId);
    const tab = openTab(f.tab, financialTabs(cachedAuthz(qc).can));
    const range = rangeOf(from, to);
    // "This branch" needs a branch: under "All branches" it is the whole organization.
    const isBranch = !!branchId && f.inv === "branch";
    switch (tab) {
      case "profitability":
        return prefetchProfitability(qc, orgId, { branchId, from, to }, f);
      case "revenue":
      case "channel":
        return prefetchAnalyticsTab(qc, tab, { orgId, scopeBranchId: branchId ?? ALL_BRANCHES_ID, range, gran: f.gran });
      case "valuation":
        if (isBranch) void qc.prefetchQuery(getBranchInventoryValuationQueryOptions(branchId));
        else if (orgId) void qc.prefetchQuery(getOrgInventoryValuationQueryOptions(orgId));
        if (orgId) void qc.prefetchQuery(getListCatalogQueryOptions(orgId));
        return;
      case "supplierSpend":
        if (isBranch) void qc.prefetchQuery(getBranchSupplierSpendQueryOptions(branchId, range));
        else if (orgId) void qc.prefetchQuery(getOrgSupplierSpendQueryOptions(orgId, range));
        return;
      case "materialCostTrend":
        if (isBranch) void qc.prefetchQuery(getBranchMaterialCostTrendQueryOptions(branchId, range));
        else if (orgId) void qc.prefetchQuery(getOrgMaterialCostTrendQueryOptions(orgId, range));
        return;
    }
  },
  "/reports/inventory": prefetchInventoryReports,
  "/reports/legal": (qc, { orgId, branchId, from, to }) => {
    if (!orgId) return;
    const authz = cachedAuthz(qc);
    const modules = cachedModules(qc, orgId);
    // Which tabs show depends on the org's modules: unknown yet, nothing is guessed.
    if (!modules || !authz.can(Cap.reportsLegal)) return;
    const tab = openTab(legalReportsSearch.entryValues(branchId).tab, legalTabs(authz.can, modules));
    const range = rangeOf(from, to);
    if (tab === "tax") void qc.prefetchQuery(getOrgTaxReportQueryOptions(orgId, range));
    else if (tab) void qc.prefetchQuery(LEGAL_AUDIT[tab](orgId, range));
  },
  "/reports/bundles": (qc, { branchId, from, to }) => {
    if (!from || !to) return;
    const { kind } = bundlesReportSearch.entryValues(branchId);
    void qc.prefetchQuery(getBundlesReportQueryOptions(bundlesReportParams({ branchId, from, to }, kind)));
  },
  "/reports/staff-pool": prefetchStaffPoolReport,
  // Every tab reads the same sessions list.
  "/reports/tills": (qc, { branchId, from, to }) => {
    void qc.prefetchQuery(getBranchTillSessionsQueryOptions(branchId ?? ALL_BRANCHES_ID, rangeOf(from, to)));
  },
  "/settings/staff-pool": prefetchStaffPoolSettings,
};
