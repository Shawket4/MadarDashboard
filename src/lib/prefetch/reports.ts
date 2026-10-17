import {
  getBranchConsumptionQueryOptions,
  getBranchSalesQueryOptions,
  getMenuMarginLedgerQueryOptions,
  getOrgConsumptionQueryOptions,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the reports area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/analytics": (qc, { branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Legacy paths — all now redirect into Reports ▸ Operations.
    if (branchId) void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, period));
  },
  "/insights/sales": (qc, ctx) => routes["/analytics"](qc, ctx),
  "/reports/sales": (qc, ctx) => routes["/analytics"](qc, ctx),
  "/reports/operations": (qc, { branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Default tab is Tables; also warm Overview since it's one click away.
    if (branchId) void qc.prefetchQuery(getBranchSalesQueryOptions(branchId, period));
  },
  "/reports/financial": (qc, { orgId, branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Default tab is Menu Profitability.
    if (orgId) void qc.prefetchQuery(getMenuMarginLedgerQueryOptions(branchId ?? ALL_BRANCHES_ID, period));
  },
  "/reports/inventory": (qc, { orgId, branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Default tab is Consumption.
    if (branchId) void qc.prefetchQuery(getBranchConsumptionQueryOptions(branchId, period));
    else if (orgId) void qc.prefetchQuery(getOrgConsumptionQueryOptions(orgId, period));
  },
  "/inventory/reports": (qc, { orgId, branchId, from, to }) => {
    const period = { from: from ?? undefined, to: to ?? undefined };
    // Legacy paths — both now redirect into Reports ▸ Inventory.
    if (branchId) void qc.prefetchQuery(getBranchConsumptionQueryOptions(branchId, period));
    else if (orgId) void qc.prefetchQuery(getOrgConsumptionQueryOptions(orgId, period));
  },
  "/insights/inventory-reports": (qc, ctx) => routes["/inventory/reports"](qc, ctx),
};
