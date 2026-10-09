/**
 * The Attendance page's actions (PM-4, AT-1): "Add record" and "Correct" are
 * offered only with hr.attendance.create / hr.attendance.edit, the forms are
 * validated before anything is sent, a correction sends only what changed,
 * and every time is typed on the BRANCH's clock, whatever the browser's zone.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
// Radix Select asks for pointer capture and scrolls its options; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
const correctRecord = vi.fn(async () => ({}));
const createManualRecord = vi.fn(async () => ({}));
const q = (data: unknown) => ({ data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });

const record = {
  id: "r1",
  employee_id: "e1",
  employee_name: "Sara Ahmed",
  branch_id: "b1",
  business_date: "2026-09-22",
  // 09:02 and 17:00 in Cairo (UTC+3).
  check_in_at: "2026-09-22T06:02:00Z",
  check_out_at: "2026-09-22T14:00:00Z",
  status: "late",
  late_minutes: 2,
  worked_minutes: 478,
  overtime_minutes: 0,
};

let records: Record<string, unknown>[] = [record];
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
let scopeBranch: string | null = "b1";
/** H3: the window's summary read fails with this. */
let summaryError: unknown = null;
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: scopeBranch }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o1" }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("./util", async () => {
  const real = await vi.importActual<typeof import("./util")>("./util");
  return { ...real, invalidateAttendance: vi.fn() };
});
/** Blocks at the record's branch (b1), another branch (b2), and the whole business. */
let shifts: { id: string; name: string; branch_id: string | null }[] = [];
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
  listAttendance: vi.fn(async () => []),
  useListAttendance: () => q(records),
  useAttendanceSummary: () => (summaryError ? { ...q(undefined), error: summaryError } : q([])),
  useListEmployees: () => q([
    { id: "e1", name: "Sara Ahmed", branch_ids: ["b1"] }, { id: "e2", name: "Omar Nabil", branch_ids: ["b1"] },
    { id: "e3", name: "Hana Adel", branch_ids: ["b1", "b2"] },
  ]),
  useListWorkShifts: () => q(shifts),
  // The browser here runs in UTC; the branch is in Cairo.
  useListBranches: () => q([{ id: "b1", name: "Zamalek", timezone: "Africa/Cairo" }, { id: "b2", name: "Maadi", timezone: "Africa/Cairo" }]),
  correctRecord: (...a: unknown[]) => correctRecord(...(a as [])),
  createManualRecord: (...a: unknown[]) => createManualRecord(...(a as [])),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AttendancePage } = await import("./attendance-page");
const { TooltipProvider } = await import("@/components/ui/tooltip");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>{node}</TooltipProvider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  correctRecord.mockClear();
  createManualRecord.mockClear();
  held = ["hr.attendance.read", "hr.attendance.edit", "hr.attendance.create"];
  shifts = [];
});

describe("Attendance: a failed summary is no reassuring zero (H3)", () => {
  it("the headline counts read '—' when the summary fails", () => {
    summaryError = new Error("boom");
    try {
      wrap(<AttendancePage />);
      const card = screen.getByText("Absent days").closest("div")!.parentElement!;
      expect(card.textContent).toMatch(/—/);
      expect(card.textContent).not.toMatch(/\b0\b/);
    } finally {
      summaryError = null;
    }
  });
});

describe("Attendance reads plainly (UX-P)", () => {
  it("says what late and left early are measured from, and explains the words", async () => {
    records = [{ ...record, scheduled_start_at: "2026-09-22T06:00:00Z", scheduled_end_at: "2026-09-22T14:30:00Z", early_leave_minutes: 30 }];
    try {
      wrap(<AttendancePage />);
      // 09:00 and 17:30 on the Cairo branch's clock, not the browser's UTC.
      expect(screen.getAllByText("after 09:00 AM").length).toBeGreaterThan(0);
      expect(screen.getAllByText("before 05:30 PM").length).toBeGreaterThan(0);
      expect(screen.getByText("What late, left early and absent mean")).toBeInTheDocument();
    } finally {
      records = [record];
    }
  });

  it("offers one-tap ranges, the pay period among them", () => {
    wrap(<AttendancePage />);
    const quick = screen.getByRole("group", { name: "Quick ranges" });
    expect(within(quick).getByRole("button", { name: "This pay period" })).toBeInTheDocument();
    expect(within(quick).getByRole("button", { name: "This week" })).toBeInTheDocument();
  });
});

describe("Attendance actions follow capabilities", () => {
  it("a reader gets neither Add record nor Correct", () => {
    held = ["hr.attendance.read"];
    wrap(<AttendancePage />);
    expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add record/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^correct$/i })).toBeNull();
  });

  it("a record in a closed month can't be corrected, and says so (month_closed)", () => {
    records = [{ ...record, month_closed: true }];
    wrap(<AttendancePage />);
    expect(screen.queryByRole("button", { name: /^correct$/i })).toBeNull();
    expect(screen.getByText("Month closed")).toBeInTheDocument();
    records = [record];
  });

  it("the clock-in distance carries the language's unit (E2E: '14m' in Arabic)", async () => {
    records = [{ ...record, check_in_distance_meters: 14.2 }];
    await i18n.changeLanguage("ar");
    wrap(<AttendancePage />);
    expect(screen.getByText("14 م")).toBeInTheDocument();
    await i18n.changeLanguage("en");
    records = [record];
  });

  it("hr.attendance.edit alone: Correct but not Add", () => {
    held = ["hr.attendance.read", "hr.attendance.edit"];
    wrap(<AttendancePage />);
    expect(screen.queryByRole("button", { name: /add record/i })).toBeNull();
    expect(screen.getByRole("button", { name: /^correct$/i })).toBeInTheDocument();
  });
});

describe("Correct a record", () => {
  it("shows the stamps on the branch's clock and sends only what changed", async () => {
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /^correct$/i }));
    const dialog = await screen.findByRole("dialog");
    const inField = within(dialog).getByLabelText("In") as HTMLInputElement;
    const outField = within(dialog).getByLabelText("Out") as HTMLInputElement;
    expect(inField.value).toBe("2026-09-22T09:02");
    expect(outField.value).toBe("2026-09-22T17:00");

    // Without a reason nothing is sent.
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Say why")).toBeInTheDocument();
    expect(correctRecord).not.toHaveBeenCalled();

    await user.clear(outField);
    await user.type(outField, "2026-09-22T18:30");
    await user.type(within(dialog).getByLabelText("Reason"), "Forgot to clock out");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(correctRecord).toHaveBeenCalledTimes(1));
    expect(correctRecord).toHaveBeenCalledWith("r1", {
      check_in_at: null, // untouched: kept by the server
      check_out_at: "2026-09-22T15:30:00.000Z", // 18:30 Cairo
      status: null,
      reason: "Forgot to clock out",
    });
  });

  it("refuses an out before the in", async () => {
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /^correct$/i }));
    const dialog = await screen.findByRole("dialog");
    const outField = within(dialog).getByLabelText("Out");
    await user.clear(outField);
    await user.type(outField, "2026-09-22T08:00");
    await user.type(within(dialog).getByLabelText("Reason"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Out must be after in")).toBeInTheDocument();
    expect(correctRecord).not.toHaveBeenCalled();
  });
});

describe("Add a record by hand", () => {
  it("offers only the record's branch's blocks and business-wide ones (E2E team re-verify)", async () => {
    // The owner at Arkan was offered Maadi's "Evening" and saved an Arkan record on it.
    shifts = [
      { id: "w1", name: "Morning", branch_id: "b1" },
      { id: "w2", name: "Evening Maadi", branch_id: "b2" },
      { id: "w3", name: "Anywhere", branch_id: null },
    ];
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Work shift" }));
    expect(await screen.findByRole("option", { name: "Morning" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Anywhere" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Evening Maadi" })).not.toBeInTheDocument();
  });

  it("needs an employee and a reason, and writes the branch's clock with a derived status", async () => {
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findAllByText(/Pick an employee|Say why/)).not.toHaveLength(0);
    expect(createManualRecord).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: "Sara Ahmed" }));
    const date = within(dialog).getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2026-09-20");
    await user.type(within(dialog).getByLabelText("In"), "2026-09-20T09:00");
    await user.type(within(dialog).getByLabelText("Reason"), "The app missed the day");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createManualRecord).toHaveBeenCalledTimes(1));
    expect(createManualRecord).toHaveBeenCalledWith({
      employee_id: "e1",
      branch_id: "b1",
      business_date: "2026-09-20",
      work_shift_id: null,
      check_in_at: "2026-09-20T06:00:00.000Z",
      check_out_at: null,
      status: null,
      reason: "The app missed the day",
    });
  });
});

/** Omar's absent day, and Salma covering it (D1). */
const absent = {
  ...record, id: "r2", employee_id: "e2", employee_name: "Omar Nabil", check_in_at: null, check_out_at: null,
  status: "absent", late_minutes: 0, worked_minutes: 0, work_shift_id: "w1",
};
const cover = {
  ...record, id: "c1", employee_id: "e7", employee_name: "Salma Adel", covered_employee_id: "e2", cover_status: "pending",
  work_shift_id: "w1", check_in_method: "cover",
};

describe("D1: a shift a colleague covers", () => {
  it("says who covers the owner's day", () => {
    records = [absent, cover];
    wrap(<AttendancePage />);
    expect(screen.getByText("Covered by Salma Adel")).toBeInTheDocument();
    records = [record];
  });

  it("a correction can't clock the owner in while it's covered", async () => {
    records = [absent, cover];
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    const omar = screen.getByText("Omar Nabil").closest("tr") as HTMLElement;
    await user.click(within(omar).getByRole("button", { name: /^correct$/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("In"), "2026-09-22T09:30");
    await user.type(within(dialog).getByLabelText("Reason"), "He came in");
    expect(within(dialog).getByText(/Covered by Salma Adel/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    expect(correctRecord).not.toHaveBeenCalled();
    records = [record];
  });

  it("Add record can't clock the owner in on the covered shift", async () => {
    records = [absent, cover];
    shifts = [{ id: "w1", name: "Morning", branch_id: "b1" }];
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: "Omar Nabil" }));
    const date = within(dialog).getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2026-09-22");
    await user.click(within(dialog).getByRole("combobox", { name: "Work shift" }));
    await user.click(await screen.findByRole("option", { name: "Morning" }));
    await user.type(within(dialog).getByLabelText("In"), "2026-09-22T09:30");
    expect(within(dialog).getByText(/Covered by Salma Adel/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    records = [record];
  });
});

describe("A closed month (box verify, BC-3 decision a)", () => {
  it("Add record says the day is in an approved month and won't save", async () => {
    records = [{ ...record, month_closed: true }];
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = await screen.findByRole("dialog");
    const date = within(dialog).getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2026-09-20");
    expect(await within(dialog).findByText(/That day is in an approved payroll month/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    records = [record];
  });
});

describe("Add record with every branch in scope (box verify: Karim has one branch)", () => {
  it("takes the branch from someone who works at one, and asks among theirs otherwise", async () => {
    scopeBranch = null;
    const user = userEvent.setup();
    wrap(<AttendancePage />);
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: "Sara Ahmed" }));
    expect(within(dialog).queryByRole("combobox", { name: "Branch" })).not.toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Reason"), "The app missed the day");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createManualRecord).toHaveBeenCalledWith(expect.objectContaining({ employee_id: "e1", branch_id: "b1" })));

    // Someone at two branches: pick which.
    createManualRecord.mockClear();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const again = await screen.findByRole("dialog");
    await user.click(within(again).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: "Hana Adel" }));
    await user.click(within(again).getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Maadi" }));
    await user.type(within(again).getByLabelText("Reason"), "Covered at Maadi");
    await user.click(within(again).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createManualRecord).toHaveBeenCalledWith(expect.objectContaining({ employee_id: "e3", branch_id: "b2" })));
    scopeBranch = "b1";
  });
});

