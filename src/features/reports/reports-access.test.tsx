/**
 * The Reports pages that landed after the permissions work: each is gated on
 * its capability, and a person without it gets the restricted page and no
 * request at all.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

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
  useScope: () => ({ branchId: null, from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z", preset: "30d" }),
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
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { LegalReportsPage } = await import("./legal/legal-reports-page");
const { LoyaltyReportPage } = await import("./loyalty/loyalty-report-page");
const { StaffDisciplinePage } = await import("./staff/staff-discipline-page");

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
});
