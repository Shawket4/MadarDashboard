/**
 * Staff discipline: ranked by department from the attendance ledger, and a
 * cover shows for both people (CV-7) — the one who covered and the one whose
 * shift a colleague covered.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
        capabilities: ["hr.attendance.read"] as never, ask_manager: [], limits: {},
      }),
  };
});
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({ branchId: null, from: "2026-09-01T10:00:00Z", to: "2026-09-21T10:00:00Z", preset: "30d" }),
}));
const row = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  employee_id: id, employee_name: name, department_id: "d1", department_name: "Floor", rank_in_department: 1,
  late_days: 0, absent_days: 0, total_late_minutes: 0, covers_given: 0, covered_by_others: 0, covers_pending: 0, ...over,
});
vi.mock("@/data/api/generated/api", () => ({
  useDisciplineReport: () => ({
    data: { rows: [
      row("e1", "Salma Hany", { covers_given: 1 }),
      row("e2", "Omar Khaled", { rank_in_department: 2, absent_days: 1, covered_by_others: 1 }),
      row("e3", "Mariam Adel", { rank_in_department: 1 }),
    ] },
    isLoading: false, isError: false, refetch: vi.fn(),
  }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { StaffDisciplinePage } = await import("./staff-discipline-page");

describe("StaffDisciplinePage", () => {
  it("shows a cover for both people (CV-7), and nothing extra for someone without one", () => {
    // E2E payroll (D-289): the API sent covers_given / covered_by_others; the page dropped them.
    render(<QueryClientProvider client={new QueryClient()}><StaffDisciplinePage /></QueryClientProvider>);
    expect(screen.getByText("Covered 1 shift")).toBeInTheDocument();
    expect(screen.getByText("1 shift covered by a colleague")).toBeInTheDocument();
    expect(screen.getAllByText(/0 late · 0 absent/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Covered|covered by/)).toHaveLength(2);
  });
});
