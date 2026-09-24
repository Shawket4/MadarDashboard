/**
 * Every punch reads on its own branch's clock (AT-1), also with "All
 * branches" in scope: a 09:00 check-in at a Tokyo branch read "03:00 AM"
 * (the business's Cairo clock) in the table while Correct showed 09:00
 * (E2E, team).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

const record = (id: string, name: string, inMethod: string, outMethod: string | null) => ({
  id, org_id: "o", employee_id: id, employee_name: name, branch_id: "b1", work_shift_id: null, work_shift_name: "Morning",
  business_date: "2026-09-22", status: "present", check_in_at: "2026-09-22T06:00:00Z", check_in_method: inMethod,
  check_out_at: outMethod ? "2026-09-22T14:00:00Z" : null, check_out_method: outMethod,
  check_in_distance_meters: null, late_minutes: 0, early_leave_minutes: 0, overtime_minutes: 0, worked_minutes: 480,
  is_manual: false, tracking_off: false, status_overridden: false, created_at: "2026-09-22T06:00:00Z", updated_at: "2026-09-22T14:00:00Z",
});

const rows = [
  { ...record("e1", "Laila Hassan", "manual", "manual"), branch_id: "b2", check_in_at: "2026-09-22T00:00:00Z", check_out_at: "2026-09-22T08:00:00Z" },
  record("e2", "Omar Khaled", "mobile_gps", "mobile_gps"),
];

const q = (data: unknown) => () => ({ data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });
vi.mock("@/data/api/generated/api", () => ({
  useListAttendance: q(rows),
  useAttendanceSummary: q([]),
  useListEmployees: q([]),
  useListWorkShifts: q([]),
  useListBranches: q([{ id: "b1", name: "Zamalek", timezone: "Africa/Cairo" }, { id: "b2", name: "E2E Tokyo", timezone: "Asia/Tokyo" }]),
  listAttendance: vi.fn(async () => rows),
  correctRecord: vi.fn(),
  createManualRecord: vi.fn(),
}));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o1" }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
        capabilities: ["hr.attendance.read", "hr.attendance.edit"] as never, ask_manager: [], limits: {},
      }),
  };
});

const i18n = (await import("@/i18n")).default;
const { AttendancePage } = await import("./attendance-page");
const { TooltipProvider } = await import("@/components/ui/tooltip");

const page = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <AttendancePage />
      </TooltipProvider>
    </QueryClientProvider>,
  );
const rowOf = (name: string) => screen.getAllByText(name)[0].closest("tr") ?? screen.getAllByText(name)[0].parentElement!.parentElement!;

describe("AttendancePage times (AT-1)", () => {
  it("shows each punch on its branch's clock with All branches in scope", async () => {
    await i18n.changeLanguage("en");
    const { useAppStore } = await import("@/data/stores/app.store");
    useAppStore.setState({ activeTimezone: "Africa/Cairo" });
    page();
    const laila = within(rowOf("Laila Hassan"));
    expect(laila.getByText(/09:00 AM/)).toBeInTheDocument();
    expect(laila.getByText(/05:00 PM/)).toBeInTheDocument();
    expect(laila.queryByText(/03:00 AM/)).toBeNull();
    // A Cairo branch still reads on Cairo's clock: 06:00Z is 09:00.
    expect(within(rowOf("Omar Khaled")).getByText(/09:00 AM/)).toBeInTheDocument();
  });
});
