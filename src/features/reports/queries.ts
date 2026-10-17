import type { QueryClient } from "@tanstack/react-query";

import { getGetMyAuthzQueryKey, getGetOrgModulesQueryKey } from "@/data/api/generated/api";
import type { MyAuthz } from "@/data/api/generated/models";
import { authzFrom, type Authz } from "@/data/authz/use-authz";
import { useAuthStore } from "@/data/stores/auth.store";
import { Cap, type Capability } from "@/generated/capabilities";
import type { BundleKind } from "@/features/combos/types";
import { cairoParts } from "@/lib/format";

/**
 * What the Reports pages and their sidebar prefetch must agree on: which tab a
 * page opens on (it depends on what the person may read) and the requests
 * whose params are more than an id and the period.
 */

// ── Who may read what, outside React ─────────────────────────────────────────

/** `/authz/me` as the app shell last fetched it; holds nothing until it has answered. */
export function cachedAuthz(qc: QueryClient): Authz {
  const platform = useAuthStore.getState().user?.role === "super_admin";
  return authzFrom(platform ? null : qc.getQueryData<MyAuthz>(getGetMyAuthzQueryKey()), { platform });
}

/** The org's switched-on modules as last fetched; undefined until known. */
export function cachedModules(qc: QueryClient, orgId: string): readonly string[] | undefined {
  return qc.getQueryData<{ modules: string[] }>(getGetOrgModulesQueryKey(orgId))?.modules;
}

// ── Financial ────────────────────────────────────────────────────────────────

export type FinancialTab = "profitability" | "revenue" | "channel" | "valuation" | "supplierSpend" | "materialCostTrend";

export const FINANCIAL_TABS: FinancialTab[] = ["profitability", "revenue", "channel", "valuation", "supplierSpend", "materialCostTrend"];

/** What each tab reads: sales (orders.read), stock value (inventory.read), or
 *  what the business pays its suppliers (purchasing.orders.read). */
const FINANCIAL_TAB_CAP: Record<FinancialTab, Capability> = {
  profitability: Cap.ordersRead,
  revenue: Cap.ordersRead,
  channel: Cap.ordersRead,
  valuation: Cap.inventoryRead,
  supplierSpend: Cap.purchasingOrdersRead,
  materialCostTrend: Cap.purchasingOrdersRead,
};

/** The Financial tabs this person sees, in order. */
export const financialTabs = (can: (c: Capability) => boolean): FinancialTab[] => FINANCIAL_TABS.filter((k) => can(FINANCIAL_TAB_CAP[k]));

// ── Legal ────────────────────────────────────────────────────────────────────

export type LegalTab =
  | "tax" | "refunds" | "voids" | "discounts" | "waivers" | "price_overrides"
  | "manual_deductions" | "deduction_overrides" | "loyalty_adjustments" | "attendance_corrections";

const LEGAL_TABS: LegalTab[] = [
  "tax", "refunds", "voids", "discounts", "waivers", "price_overrides",
  "manual_deductions", "deduction_overrides", "loyalty_adjustments", "attendance_corrections",
];

/** Every tab is reports.legal; these also show pay or attendance, which the
 *  server checks separately (payroll is owner-only by default). */
const LEGAL_EXTRA_CAP: Partial<Record<LegalTab, Capability>> = {
  manual_deductions: Cap.hrPayrollRead,
  deduction_overrides: Cap.hrPayrollRead,
  attendance_corrections: Cap.hrAttendanceRead,
};

/** The module each tab reports on (PS-3): a Dawam-only business sees only
 *  the pay and attendance corrections, a POS-only one only the till's. */
const LEGAL_TAB_MODULE: Record<LegalTab, "pos" | "dawam"> = {
  tax: "pos",
  refunds: "pos",
  voids: "pos",
  discounts: "pos",
  waivers: "pos",
  price_overrides: "pos",
  manual_deductions: "dawam",
  deduction_overrides: "dawam",
  loyalty_adjustments: "pos",
  attendance_corrections: "dawam",
};

/** The Legal tabs this person sees, in order. Pure, so it is tested directly. */
export function legalTabs(can: (c: Capability) => boolean, modules: readonly string[]): LegalTab[] {
  return LEGAL_TABS.filter((k) => modules.includes(LEGAL_TAB_MODULE[k]) && (!LEGAL_EXTRA_CAP[k] || can(LEGAL_EXTRA_CAP[k])));
}

/** The tab a page opens on: the one asked for when the person sees it, else their first. */
export const openTab = <T extends string>(picked: T, visible: readonly T[]): T | undefined => (visible.includes(picked) ? picked : visible[0]);

// ── Bundles ──────────────────────────────────────────────────────────────────

/** ISO instant → the branch-local "YYYY-MM-DD" the report's date params take. */
function localDate(iso: string): string {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Reports ▸ Bundles' request, for the page and the sidebar prefetch alike. */
export const bundlesReportParams = ({ branchId, from, to }: { branchId: string | null; from: string; to: string }, kind: BundleKind) => ({
  from: localDate(from),
  to: localDate(to),
  branch_id: branchId ?? undefined,
  kind,
});
