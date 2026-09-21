/**
 * The Reports pages that landed after the permissions work: each is gated on
 * its capability, and a person without it gets the restricted page and no
 * request at all.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { NavLeaf } from "@/config/nav";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

let held: string[] = [];
const enabledSeen: Record<string, boolean[]> = {};
const hook = (name: string, data: unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  return { data, isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() };
};
const audit = { total_count: 0, total_amount_minor: 0, by_reason: [], by_issuer: [] };

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({ branchId: null, scopeBranchId: "00000000-0000-0000-0000-000000000000", from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z", preset: "30d" }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useRefundsAudit: hook("refunds", audit),
  useVoidsAudit: hook("voids", audit),
  useDiscountsAudit: hook("discounts", audit),
  useWaiversAudit: hook("waivers", audit),
  usePriceOverrides: hook("overrides", audit),
  useOrgTaxReport: hook("tax", undefined),
  useGetLoyaltyBehavior: hook("loyalty", undefined),
  useDisciplineReport: hook("discipline", { rows: [] }),
  useBranchTillSessions: hook("tillSessions", []),
  useManualDeductionsAudit: hook("manualDeductions", audit),
  useDeductionOverridesAudit: hook("deductionOverrides", audit),
  useLoyaltyAdjustmentsAudit: hook("loyaltyAdjustments", audit),
  useAttendanceCorrectionsAudit: hook("attendanceCorrections", audit),
  useGetLoyaltyCampaignEffectiveness: hook("campaigns", undefined),
  useGetLoyaltyLiabilityTrend: hook("liability", undefined),
  useBranchInventoryValuation: hook("branchValuation", undefined),
  useOrgInventoryValuation: hook("orgValuation", { items: [] }),
  useListCatalog: hook("catalog", []),
  useBranchSupplierSpend: hook("branchSpend", []),
  useOrgSupplierSpend: hook("orgSpend", []),
  useBranchMaterialCostTrend: hook("branchTrend", []),
  useOrgMaterialCostTrend: hook("orgTrend", []),
  useBranchConsumption: hook("branchCons", []),
  useOrgConsumption: hook("orgCons", []),
  useBranchShrinkage: hook("branchShr", []),
  useOrgShrinkage: hook("orgShr", []),
  useBranchWasteReport: hook("branchWaste", []),
  useOrgWasteReport: hook("orgWaste", []),
  useBranchPoLeadTime: hook("branchLead", undefined),
  useOrgPoLeadTime: hook("orgLead", undefined),
}));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/features/insights/profitability-page", () => ({ ProfitabilityPage: () => null }));
vi.mock("@/features/insights/tables-page", () => ({ TablesInsightsPage: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { LegalReportsPage } = await import("./legal/legal-reports-page");
const { LoyaltyReportPage } = await import("./loyalty/loyalty-report-page");
const { StaffDisciplinePage } = await import("./staff/staff-discipline-page");
const { TillSessionsPage } = await import("./tills/till-sessions-page");
const { NAV, isParent, leafVisible } = await import("@/config/nav");
const { authzFrom } = await import("@/data/authz/use-authz");
const { FinancialReportsPage } = await import("./financial/financial-reports-page");
const { OperationsReportsPage } = await import("./operations/operations-reports-page");
const { InventoryReportsPage } = await import("@/features/inventory/inventory-reports-page");
const reset = () => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
};
const neverAsked = (...names: string[]) => names.every((n) => (enabledSeen[n] ?? []).every((e) => e === false));

const wrap = (node: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);
const denied = () => screen.queryByText(/The owner can give you access/);

describe("Reports access", () => {
  it("Legal needs reports.legal, and asks nothing without it", () => {
    held = [];
    for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
    wrap(<LegalReportsPage />);
    expect(denied()).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Refunds" })).not.toBeInTheDocument();
    expect(enabledSeen.refunds?.every((e) => e === false)).toBe(true);
  });

  it("Legal shows its tabs with reports.legal", () => {
    held = ["reports.legal"];
    wrap(<LegalReportsPage />);
    expect(denied()).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Refunds" })).toBeInTheDocument();
  });

  it("Loyalty needs loyalty.members.list", () => {
    held = ["loyalty.read"];
    for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
    wrap(<LoyaltyReportPage />);
    expect(denied()).toBeInTheDocument();
    expect(enabledSeen.loyalty?.every((e) => e === false)).toBe(true);
  });

  it("Staff discipline needs hr.attendance.read", () => {
    held = [];
    for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
    wrap(<StaffDisciplinePage />);
    expect(denied()).toBeInTheDocument();
    expect(enabledSeen.discipline?.every((e) => e === false)).toBe(true);

    held = ["hr.attendance.read"];
    wrap(<StaffDisciplinePage />);
    expect(screen.getAllByText(/Staff discipline/).length).toBeGreaterThan(0);
  });

  it("Till sessions needs till.read.branch — till.read alone is a teller's own drawer", () => {
    held = ["till.read"];
    reset();
    const { unmount } = wrap(<TillSessionsPage />);
    expect(denied()).toBeInTheDocument();
    expect(neverAsked("tillSessions")).toBe(true);
    unmount();

    held = ["till.read", "till.read.branch"];
    wrap(<TillSessionsPage />);
    expect(denied()).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sessions" })).toBeInTheDocument();
    expect(enabledSeen.tillSessions?.at(-1)).toBe(true);
  });

  it("the Tills nav entry follows the same capability as its page", () => {
    const leaf = NAV.flatMap((g) => g.entries)
      .flatMap((e) => (isParent(e) ? e.children : [e]))
      .find((l): l is NavLeaf => l.to === "/reports/tills");
    const holding = (capabilities: string[]) =>
      authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: ["teller"], capabilities: capabilities as never, ask_manager: [], limits: {} });
    expect(leaf).toBeDefined();
    expect(leafVisible(leaf!, holding(["till.read", "orders.read"]))).toBe(false);
    expect(leafVisible(leaf!, holding(["till.read.branch"]))).toBe(true);
  });

  it("Legal hides the payroll tabs without hr.payroll.read, and attendance without hr.attendance.read", () => {
    held = ["reports.legal"];
    reset();
    const { unmount } = wrap(<LegalReportsPage />);
    expect(screen.queryByRole("tab", { name: "Manual deductions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Deduction overrides" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Attendance corrections" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Loyalty adjustments" })).toBeInTheDocument();
    expect(neverAsked("manualDeductions", "deductionOverrides", "attendanceCorrections")).toBe(true);
    unmount();

    held = ["reports.legal", "hr.payroll.read", "hr.attendance.read"];
    wrap(<LegalReportsPage />);
    expect(screen.getByRole("tab", { name: "Manual deductions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Attendance corrections" })).toBeInTheDocument();
  });

  it("Financial shows only the tabs the person can read", () => {
    held = ["inventory.read"];
    reset();
    const { unmount } = wrap(<FinancialReportsPage />);
    expect(screen.getByRole("tab", { name: "Valuation" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Revenue" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Supplier spend" })).not.toBeInTheDocument();
    expect(neverAsked("orgSpend", "branchSpend", "orgTrend", "branchTrend")).toBe(true);
    unmount();

    held = [];
    reset();
    wrap(<FinancialReportsPage />);
    expect(denied()).toBeInTheDocument();
    expect(neverAsked("orgValuation", "orgSpend", "orgTrend")).toBe(true);
  });

  it("Operations needs orders.read", () => {
    held = ["inventory.read"];
    wrap(<OperationsReportsPage />);
    expect(denied()).toBeInTheDocument();
  });

  it("Inventory needs inventory.read, and PO lead time purchasing.orders.read", () => {
    held = [];
    reset();
    const { unmount } = wrap(<InventoryReportsPage />);
    expect(denied()).toBeInTheDocument();
    expect(neverAsked("orgCons", "orgLead")).toBe(true);
    unmount();

    held = ["inventory.read"];
    const { unmount: u2 } = wrap(<InventoryReportsPage />);
    expect(screen.getByRole("tab", { name: "Consumption" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "PO lead time" })).not.toBeInTheDocument();
    u2();

    held = ["inventory.read", "purchasing.orders.read"];
    wrap(<InventoryReportsPage />);
    expect(screen.getByRole("tab", { name: "PO lead time" })).toBeInTheDocument();
  });
});
