/**
 * Dawam reports (DSH-3): four tabs over the scope's period, each the
 * server's figures; labour against sales only with POS on (DSH-4); expense
 * advances say when they came out of a till (AV-8).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

let held: string[] = [];
let modules = ["pos", "dawam"];
const seen: Record<string, unknown[]> = {};
const hook = (name: string, data: unknown) => (params: unknown) => {
  (seen[name] ??= []).push(params);
  return { data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
};

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
        capabilities: held as never, ask_manager: [], limits: {},
      }),
  };
});
vi.mock("@/hooks/use-org-modules", () => ({ useOrgModules: () => modules }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({ branchId: "b1", from: "2026-09-01T10:00:00Z", to: "2026-09-21T10:00:00Z" }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: hook("branches", [{ id: "b1", name: "Zamalek" }]),
  useAttendanceSummary: hook("attendance", [
    { employee_id: "e1", employee_name: "Sara Ahmed", present_days: 18, late_days: 2, absent_days: 1, leave_days: 0, half_days: 0, total_late_minutes: 35, total_overtime_minutes: 120, total_worked_minutes: 8_640 },
  ]),
  useLabourVsSales: hook("labour", [
    { branch_id: "b1", date: "2026-09-02", sales_piastres: 2_000_000, labour_piastres: 400_000, labour_share_bp: 2000 },
  ]),
  usePayrollHistory: hook("payroll", [
    { period_id: "p1", name: "Aug", start_date: "2026-07-26", end_date: "2026-08-25", status: "paid", people: 5, base_piastres: 4_500_000, overtime_minutes: 300, overtime_piastres: 90_000, bonuses_piastres: 0, deductions_piastres: 10_000, advances_piastres: 50_000, net_piastres: 4_530_000 },
  ]),
  useAdvances: hook("advances", {
    salary: [{ id: "a1", employee_id: "e1", employee_name: "Sara Ahmed", amount_piastres: 300_000, installments: 3, remaining_piastres: 200_000, status: "approved", given_on: "2026-09-03" }],
    expense: [{ id: "x1", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 25_000, purpose: "Milk", via: "till", given_on: "2026-09-04" }],
    salary_given_piastres: 300_000, salary_outstanding_piastres: 200_000, expense_given_piastres: 25_000,
  }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { StaffReportsPage } = await import("./reports-page");

const wrap = () => render(<QueryClientProvider client={new QueryClient()}><StaffReportsPage /></QueryClientProvider>);

beforeEach(() => {
  held = ["hr.attendance.read", "hr.payroll.read"];
  modules = ["pos", "dawam"];
  for (const k of Object.keys(seen)) delete seen[k];
});

describe("StaffReportsPage", () => {
  it("opens on attendance, over the scope's days and branch", () => {
    wrap();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Attendance & discipline", "Labour vs sales", "Overtime & payroll", "Salary advances",
    ]);
    expect(screen.getAllByText("Sara Ahmed").length).toBeGreaterThan(0);
    expect(seen.attendance[0]).toEqual({ from: expect.stringMatching(/^2026-09-01$/), to: "2026-09-21", branch_id: "b1" });
  });

  it("counts a month's worked time in hours, never days (E2E: 'Worked 7d 00h')", () => {
    wrap();
    expect(screen.getAllByText("144h").length).toBeGreaterThan(0);
    expect(screen.queryByText("6d 00h")).not.toBeInTheDocument();
  });

  it("has no labour-vs-sales tab without POS (DSH-4)", () => {
    modules = ["dawam"];
    wrap();
    expect(screen.queryByRole("tab", { name: /Labour vs sales/ })).not.toBeInTheDocument();
    expect(seen.labour).toBeUndefined();
  });

  it("shows labour against sales, payroll history and advances with a till pay-out", async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByRole("tab", { name: /Labour vs sales/ }));
    expect(screen.getAllByText("20.0%").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: /Overtime & payroll/ }));
    expect(seen.payroll[0]).toMatchObject({ from: "2026-09-01", to: "2026-09-21" });
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: /Salary advances/ }));
    expect(screen.getAllByText("Youssef Adel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Till pay-out").length).toBeGreaterThan(0);
  });

  it("names a period's status in the reader's words, on screen and in the CSV (AT-13)", async () => {
    // E2E payroll: the Status column showed the server's raw "generated".
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByRole("tab", { name: /Overtime & payroll/ }));
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
    expect(screen.queryByText("paid")).not.toBeInTheDocument();
  });

  it("writes plain text to the CSV: no invisible direction marks (AT-2)", async () => {
    // E2E payroll: Arabic hours reached the CSV wrapped in U+2066…U+2069.
    const { toCsv } = await import("./reports-page");
    const csv = toCsv([{ id: "h", header: "Hours", value: (r: { h: string }) => r.h }], [{ h: "\u206622 س 15 د\u2069" }]);
    expect(csv).toBe("Hours\r\n22 س 15 د");
  });

  it("keeps payroll tabs from someone with attendance rights only", () => {
    held = ["hr.attendance.read"];
    wrap();
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(seen.payroll).toBeUndefined();
  });
});
