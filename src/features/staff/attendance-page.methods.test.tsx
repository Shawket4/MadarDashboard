/**
 * The attendance list says how each punch was made (CL-16): a manager's
 * punch, the till PIN, a correction, a punch queued offline. The phone's
 * own live punch is the normal case and carries no badge.
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
  record("e1", "Sara Ahmed", "mobile_gps", "mobile_gps"),
  { ...record("e2", "Omar Khaled", "manager", "manager"), punch_reason: "Phone died", check_out_reason: "Forgot to clock out" },
  record("e3", "Hana Mostafa", "correction", "offline"),
  record("e4", "Youssef Adel", "mobile_gps", "auto"),
  record("e5", "Nada Samir", "mobile_gps", "till"),
];

const q = (data: unknown) => () => ({ data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });
// The kit's fields are calendar buttons and a typed time (tested in their own
// suites); the dialogs' logic (branch clock, only-what-changed) runs through plain inputs.
vi.mock("@/components/inputs", async () => {
  const real = await vi.importActual<typeof import("@/components/inputs")>("@/components/inputs");
  return {
    ...real,
    DateField: ({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) => (
      <input id={id} type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    ),
  };
});
vi.mock("./date-time-field", () => ({
  DateTimeField: ({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) => (
    <input id={id} type="datetime-local" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("@/data/api/generated/api", () => ({
  useGetAttendanceSettings: () => ({ data: { period_start_day: 1 } }),
  useListAttendance: q(rows),
  useAttendanceSummary: q([]),
  useListEmployees: q([]),
  useListWorkShifts: q([]),
  useListBranches: q([{ id: "b1", name: "Zamalek", timezone: "Africa/Cairo" }]),
  listAttendance: vi.fn(async () => rows),
  correctRecord: vi.fn(),
  createManualRecord: vi.fn(),
}));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b1" }) }));
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

describe("AttendancePage punch methods (CL-16)", () => {
  it("badges a manager's punch, the till PIN, a correction and an offline punch", async () => {
    await i18n.changeLanguage("en");
    page();
    const omar = within(rowOf("Omar Khaled"));
    expect(omar.getAllByText("by a manager")).toHaveLength(2);
    expect(within(rowOf("Nada Samir")).getByText("till PIN")).toBeInTheDocument();
    const hana = within(rowOf("Hana Mostafa"));
    expect(hana.getByText("corrected")).toBeInTheDocument();
    expect(hana.getByText("queued offline")).toBeInTheDocument();
    const sara = within(rowOf("Sara Ahmed"));
    expect(sara.queryByText(/by a manager|till PIN|corrected|queued offline/)).not.toBeInTheDocument();
    // The automatic close keeps its own badge, once.
    expect(within(rowOf("Youssef Adel")).getAllByText(/auto/)).toHaveLength(1);
  });

  it("says it in Arabic too", async () => {
    await i18n.changeLanguage("ar");
    page();
    const omar = within(rowOf("Omar Khaled"));
    expect(omar.getAllByText("من المدير")).toHaveLength(2);
    expect(within(rowOf("Nada Samir")).getByText("رقم سري على الكاشير")).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });

  it("shows why a manager punched someone in and why they punched them out (AT-10, BC-1)", async () => {
    await i18n.changeLanguage("en");
    page();
    const omar = within(rowOf("Omar Khaled"));
    expect(omar.getByText(/Phone died/)).toBeInTheDocument();
    expect(omar.getByText(/Forgot to clock out/)).toBeInTheDocument();
    expect(within(rowOf("Sara Ahmed")).queryByText(/Phone died|Forgot/)).not.toBeInTheDocument();
  });

  it("keeps the reasons readable on a phone: the punch wraps and the reason takes its own line (E2E team re-verify)", async () => {
    await i18n.changeLanguage("en");
    page();
    const reason = within(rowOf("Omar Khaled")).getByText("Phone died");
    const chip = reason.closest("span[title]")!;
    expect(chip).toHaveClass("basis-full");
    // A phone can't hover, so the whole reason wraps rather than ending in "…".
    expect(chip).not.toHaveClass("truncate");
    expect(chip.parentElement).toHaveClass("flex-wrap");
  });
});
