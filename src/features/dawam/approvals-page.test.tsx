/**
 * The approvals queue: each kind shows only to someone who may decide it (and
 * nobody else's data is even asked for), and each approve / reject sends the
 * server exactly its decision — covers, swaps, claims, overtime, advances,
 * pay lines over the limit, and requests with their paid/unpaid call.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let held: string[] = [];
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock, Toaster: () => null }));
const LEAVE = { id: "q1", employee_id: "e1", employee_name: "Youssef Adel", kind: "leave", status: "pending", on_date: "2026-09-25", created_at: "2026-09-22T07:00:00Z", reason: "Family wedding" };
let requestRows: Record<string, unknown>[] = [LEAVE];
const ATTENDANCE = [
  { id: "r5", employee_name: "Sara Ahmed", covered_employee_id: "e4", cover_status: "pending", work_shift_name: "Evening", business_date: "2026-09-22", check_in_at: "2026-09-22T12:40:00Z", created_at: "2026-09-22T12:40:00Z", overtime_minutes: 0 },
  { id: "r6", employee_name: "Omar Khaled", overtime_status: "pending", overtime_minutes: 45, business_date: "2026-09-21", check_out_at: "2026-09-21T20:45:00Z", created_at: "2026-09-21T08:00:00Z" },
];
let attendanceRows: Record<string, unknown>[] = ATTENDANCE;
const ADVANCES = [
  { id: "v1", employee_name: "Sara Ahmed", amount_piastres: 50_000, installments: 2, status: "pending", created_at: "2026-09-22T08:00:00Z", reason: "Rent" },
  { id: "v0", employee_name: "Sara Ahmed", amount_piastres: 90_000, installments: 1, status: "approved", created_at: "2026-09-01T08:00:00Z" },
];
let advanceRows: Record<string, unknown>[] = ADVANCES;
const enabledSeen: Record<string, boolean[]> = {};
const paramsSeen: Record<string, unknown[]> = {};
const calls = {
  decideCover: vi.fn(async () => ({})),
  decideOvertime: vi.fn(async () => ({})),
  decideSwap: vi.fn(async () => ({})),
  decideClaim: vi.fn(async () => ({})),
  decideRequest: vi.fn(async () => ({})),
  decideAdjustment: vi.fn(async () => ({})),
  reviewAdvance: vi.fn(async () => ({})),
};

/** Sections whose list fails (a 403 for a branch manager, say). */
const failing = new Set<string>();
const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  (paramsSeen[name] ??= []).push(args[0]);
  return {
    data: failing.has(name) ? undefined : data(),
    isLoading: false, isFetching: false,
    error: failing.has(name) ? Object.assign(new Error("Forbidden"), { response: { status: 403 } }) : null,
    refetch: vi.fn(),
  };
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
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn(), invalidateRequests: vi.fn() };
});
vi.mock("@/data/api/generated/api", () => ({
  useListRequests: hook("requests", () => requestRows),
  useListEmployees: hook("employees", () => [
    { id: "e-me", name: "Karim Manager", user_id: "u-me" },
    { id: "e1", name: "Youssef Adel", user_id: null },
  ]),
  useListAdvances: hook("advances", () => advanceRows),
  useListSwaps: hook("swaps", () => [
    { id: "w1", requester_name: "Sara Ahmed", peer_name: "Youssef Adel", requester_shift_name: "Morning", peer_shift_name: "Evening", requester_date: "2026-09-26", peer_date: "2026-09-26", status: "pending", created_at: "2026-09-22T06:00:00Z" },
  ]),
  useListOpenShifts: hook("claims", () => [
    { id: "o1", shift_name: "Evening", on_date: "2026-09-27", status: "claimed", claimed_by_name: "Laila Hassan" },
    { id: "o2", shift_name: "Morning", on_date: "2026-09-28", status: "open" },
  ]),
  useListAttendance: hook("attendance", () => attendanceRows),
  listAttendance: vi.fn(async () => [{ id: "a1", check_in_at: "2026-09-20T06:00:00Z" }]),
  useListAdjustments: hook("payLines", () => [
    { id: "a2", kind: "bonus", employee_name: "Sara Ahmed", amount_piastres: 150_000, reason: "Best month", status: "pending", created_at: "2026-09-22T09:00:00Z" },
  ]),
  ...calls,
}));

const { useAuthStore } = await import("@/data/stores/auth.store");
useAuthStore.setState({ user: { id: "u-me" } as never });
const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { ApprovalsPage } = await import("./approvals-page");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider>{node}</ConfirmProvider>
    </QueryClientProvider>,
  );
const approveIn = (text: string) => {
  const title = screen.getAllByText(text)[0];
  let el: HTMLElement | null = title;
  while (el && !within(el).queryByRole("button", { name: "Approve" })) el = el.parentElement;
  return el!;
};

beforeEach(() => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  for (const f of Object.values(calls)) f.mockClear();
  requestRows = [LEAVE];
  advanceRows = ADVANCES;
  held = [
    "hr.leave.edit", "hr.advances.decide", "hr.schedule.edit", "hr.shift_cover.confirm",
    "hr.overtime.approve", "hr.payroll.run",
  ];
});

describe("ApprovalsPage", () => {
  it("shows the lists that loaded when one is refused, and says which (DSH-1)", () => {
    failing.add("advances");
    try {
      wrap(<ApprovalsPage />);
      expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't load Salary advances/);
      // Everything else is still there to decide.
      expect(screen.getByText("Cover")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Approve" }).length).toBeGreaterThan(0);
    } finally {
      failing.clear();
    }
  });

  it("shows only what this person may decide, and asks for nothing else", () => {
    held = ["hr.shift_cover.confirm"];
    wrap(<ApprovalsPage />);
    expect(screen.getByText("Cover")).toBeInTheDocument();
    expect(screen.queryByText("Family wedding", { exact: false })).not.toBeInTheDocument();
    for (const k of ["requests", "advances", "swaps", "claims", "payLines"]) {
      expect(enabledSeen[k].every((e) => e === false), k).toBe(true);
    }
  });

  it("is closed to someone who decides nothing", () => {
    held = [];
    wrap(<ApprovalsPage />);
    expect(screen.getByText(/Nothing here is yours to decide/)).toBeInTheDocument();
  });

  it("lists every pending kind once, and nothing already decided", () => {
    wrap(<ApprovalsPage />);
    // leave, advance, pay line, swap, claim, cover, overtime
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(7);
    expect(screen.getByRole("radio", { name: "All (7)" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Shifts (4)" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Money (2)" })).toBeInTheDocument();
  });

  it("confirms a cover, a claim and overtime in one click each", async () => {
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Cover")).getByRole("button", { name: "Approve" }));
    await user.click(within(approveIn("Laila Hassan")).getByRole("button", { name: "Approve" }));
    await user.click(within(approveIn("Omar Khaled")).getByRole("button", { name: "Approve" }));
    await waitFor(() => {
      expect(calls.decideCover).toHaveBeenCalledWith("r5", { approve: true });
      expect(calls.decideClaim).toHaveBeenCalledWith("o1", { approve: true });
      expect(calls.decideOvertime).toHaveBeenCalledWith("r6", { approve: true });
    });
  });

  it("M26: approving a claim says which labour limit it passes, and blocks nothing (RU-13)", async () => {
    calls.decideClaim.mockResolvedValueOnce({
      warnings: [{ employee_id: "e7", date: "2026-09-27", kind: "day_hours", minutes: 960, limit_minutes: 480 }],
    } as never);
    toastMock.warning.mockClear();
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Laila Hassan")).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(toastMock.warning).toHaveBeenCalledWith("Hours a day: 16h of 8h. Only a warning."));
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("M16: approving a mission over a worked day warns first", async () => {
    requestRows = [{ id: "m1", employee_id: "e1", employee_name: "Youssef Adel", kind: "mission", status: "pending", on_date: "2026-09-20", created_at: "2026-09-22T09:00:00Z", can_decide: true }];
    held = ["hr.leave.edit"];
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/already has punches/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /Approve/ }));
    await waitFor(() => expect(calls.decideRequest).toHaveBeenCalledWith("m1", { status: "approved" }));
  });

  it("a decision goes once however fast Approve is tapped (H2-D10)", async () => {
    let finish: (v: object) => void = () => {};
    calls.decideClaim.mockImplementationOnce(() => new Promise<object>((r) => { finish = r; }));
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    const approve = within(approveIn("Laila Hassan")).getByRole("button", { name: "Approve" });
    await user.click(approve);
    await user.click(approve);
    expect(calls.decideClaim).toHaveBeenCalledTimes(1);
    finish({});
    await waitFor(() => expect(approve).not.toBeDisabled());
  });

  it("a decision someone made first says so and refreshes the queue (H2-B2)", async () => {
    const { invalidateStaff } = await import("@/features/staff/util");
    vi.mocked(invalidateStaff).mockClear();
    const { AxiosError, AxiosHeaders } = await import("axios");
    calls.decideOvertime.mockRejectedValueOnce(
      new AxiosError("409", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        data: { error: "Conflict: Already decided", code: "ALREADY_DECIDED", vars: { status: "approved" } },
      }),
    );
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Omar Khaled")).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Someone already decided this: Approved. The list is up to date now."));
    expect(invalidateStaff).toHaveBeenCalled();
  });

  it("rejects a swap only after confirming", async () => {
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Shift swap")).getByRole("button", { name: "Reject" }));
    expect(calls.decideSwap).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(calls.decideSwap).toHaveBeenCalledWith("w1", { approve: false }));
  });

  it("warns that rejecting a request lets the day's penalties apply (E2E, team)", async () => {
    requestRows = [{ ...LEAVE, can_decide: true }];
    held = ["hr.leave.edit"];
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/any lateness or absence penalty applies/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/nothing is paid or changed/)).toBeNull();
  });

  it("asks for claims however far ahead the week is published (O-8; E2E, team: a claim 40 days out never showed)", () => {
    wrap(<ApprovalsPage />);
    const { to } = paramsSeen.claims.at(-1) as { to: string };
    const days = (Date.parse(to) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(300);
  });

  it("asks for every pending cover and overtime, however old (H2-B5, H2-D11: -35 days lost them)", () => {
    wrap(<ApprovalsPage />);
    const asked = paramsSeen.attendance as Record<string, unknown>[];
    expect(asked).toContainEqual({ cover_status: "pending" });
    expect(asked).toContainEqual({ overtime_status: "pending" });
    expect(asked.some((p) => "from" in p || "to" in p)).toBe(false);
  });

  it("asks for claims on open shifts a year back as well as a year ahead (H3: a -35-day window dropped older claims)", async () => {
    const { isoDaysFromToday } = await import("@/features/staff/util");
    wrap(<ApprovalsPage />);
    const asked = paramsSeen.claims as { from: string; to: string }[];
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.every((p) => p.from <= isoDaysFromToday(-365) && p.to >= isoDaysFromToday(365))).toBe(true);
  });

  it("approves leave as unpaid when the manager says so (RQ-2)", async () => {
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Youssef Adel")).getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch"));
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(calls.decideRequest).toHaveBeenCalledWith("q1", expect.objectContaining({ status: "approved", is_paid: false })),
    );
  });

  it("approves an advance with changed installments, and a pay line over the limit", async () => {
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Salary advance")).getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    const n = within(dialog).getByLabelText("Monthly installments");
    await user.clear(n);
    await user.type(n, "4");
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      // The amount was not touched, so none is sent: the piastres asked for stay (audit 06 B11).
      expect(calls.reviewAdvance).toHaveBeenCalledWith("v1", { approve: true, amount_piastres: null, installments: 4, note: null }),
    );
    await user.click(within(approveIn("Bonus over the limit")).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.decideAdjustment).toHaveBeenCalledWith("bonus", "a2", { approve: true }));
  });

  it("never offers a manager their own request, which someone above them decides (RQ-5)", () => {
    requestRows = [
      LEAVE,
      { id: "q9", employee_id: "e-me", employee_name: "Karim Manager", kind: "early_departure", status: "pending", on_date: "2026-09-24", from_time: "15:00:00", created_at: "2026-09-22T09:00:00Z", paid_default: true },
    ];
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    expect(screen.queryByText("Karim Manager")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
  });

  it("leaves out a request the server says the caller can't decide (can_decide)", () => {
    requestRows = [
      LEAVE,
      { id: "q8", employee_id: "e-peer", employee_name: "Hana Peer", kind: "leave", status: "pending", on_date: "2026-09-25", created_at: "2026-09-22T09:05:00Z", is_own: false, can_decide: false, to_owner: true },
    ];
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    expect(screen.queryByText("Hana Peer")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
  });

  it("a request in a closed month offers Reject only, with a note (month_closed)", async () => {
    requestRows = [{ ...LEAVE, month_closed: true, can_decide: true }];
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(screen.getByText("Month closed: reject only")).toBeInTheDocument();
  });

  it("M32: closed-month cover and overtime offer Reject only, and point to next month's lines (month_closed)", async () => {
    // Approving moves money into a closed month (refused); rejecting moves none (owner decision 32).
    attendanceRows = ATTENDANCE.map((r) => ({ ...r, month_closed: true }));
    requestRows = [];
    held = ["hr.shift_cover.confirm", "hr.overtime.approve"];
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    const rowOf = (text: string) => screen.getAllByText(text)[0].closest('[data-slot="list-card"] > div') as HTMLElement;
    for (const row of [rowOf("Cover"), rowOf("Omar Khaled")]) {
      expect(within(row).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
      expect(within(row).getByRole("button", { name: "Reject" })).toBeInTheDocument();
      expect(within(row).getByText("Month closed: reject only")).toBeInTheDocument();
      expect(within(row).getByText(/add it as a line in next month/)).toBeInTheDocument();
    }
    await user.click(within(rowOf("Omar Khaled")).getByRole("button", { name: "Reject" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(calls.decideOvertime).toHaveBeenCalledWith("r6", { approve: false }));
    attendanceRows = ATTENDANCE;
  });

  it("shows a correction's proposed times against the record's punches, a half day and who decides", () => {
    requestRows = [
      { id: "q2", employee_id: "e1", employee_name: "Youssef Adel", kind: "correction", status: "pending", on_date: "2026-09-21", from_time: "09:00:00", to_time: "17:30:00", record_check_in_at: "2026-09-21T06:40:00Z", record_check_out_at: null, created_at: "2026-09-22T09:00:00Z" },
      { id: "q3", employee_id: "e2", employee_name: "Sara Ahmed", kind: "leave", is_half_day: true, leave_half: "second", status: "pending", on_date: "2026-09-26", created_at: "2026-09-22T09:10:00Z", to_owner: true },
    ];
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    // One clock style on both sides of the arrow (E2E: "out 12:01 AM → 23:55").
    expect(screen.getByText(/in \d\d:\d\d [AP]M → 09:00 AM · out — → 05:30 PM/)).toBeInTheDocument();
    expect(screen.getByText("½ day · second half")).toBeInTheDocument();
    expect(screen.getByText(/half day/)).toBeInTheDocument();
    expect(screen.getByText("For the owner")).toBeInTheDocument();
  });

  it("approves a correction in one click with no pay question", async () => {
    requestRows = [
      { id: "q2", employee_id: "e1", employee_name: "Youssef Adel", kind: "correction", status: "pending", on_date: "2026-09-21", from_time: "09:00:00", created_at: "2026-09-22T09:00:00Z" },
    ];
    const user = userEvent.setup();
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.decideRequest).toHaveBeenCalledWith("q2", { status: "approved" }));
  });

  it("starts an excuse's pay from the rule and leaves the answer to the rule unless changed (RQ-7)", async () => {
    requestRows = [
      { id: "q4", employee_id: "e1", employee_name: "Youssef Adel", kind: "excuse", status: "pending", on_date: "2026-09-21", from_time: "12:00:00", to_time: "13:00:00", created_at: "2026-09-22T09:00:00Z", paid_default: false },
    ];
    const user = userEvent.setup();
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    let dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("switch")).not.toBeChecked();
    expect(within(dialog).getByText("The rule says unpaid.")).toBeInTheDocument();
    // D2: only the minutes actually away count; paid never adds worked time.
    expect(within(dialog).getByText(/Only the minutes they were actually away count/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/still count toward the day/)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.decideRequest).toHaveBeenCalledWith("q4", { status: "approved", note: null }));

    calls.decideRequest.mockClear();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch"));
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.decideRequest).toHaveBeenCalledWith("q4", { status: "approved", is_paid: true, note: null }));
  });

  it("keeps the queue when a decision is refused, and says why", async () => {
    calls.decideRequest.mockRejectedValueOnce(new Error("A manager's own request is decided by someone above them"));
    requestRows = [
      { id: "q2", employee_id: "e1", employee_name: "Youssef Adel", kind: "late_arrival", status: "pending", on_date: "2026-09-21", to_time: "10:00:00", created_at: "2026-09-22T09:00:00Z" },
    ];
    const user = userEvent.setup();
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.decideRequest).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  describe("D7: the advance cap (owner decision 7)", () => {
    const pending = { id: "v2", employee_name: "Omar Nabil", amount_piastres: 80_000, installments: 1, status: "pending", created_at: "2026-09-23T08:00:00Z", outstanding_piastres: 140_000 };

    it("a manager sees an over-cap advance as the owner's to approve, with no cap figure", () => {
      held = ["hr.advances.decide"];
      advanceRows = [{ ...pending, cap_piastres: null, within_cap: false }];
      wrap(<ApprovalsPage />);
      expect(screen.getByText("Over the cap: only the owner can approve")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
      expect(screen.queryByText(/1,400|cap EGP|of a/)).not.toBeInTheDocument();
    });

    it("a manager sees an advance within the cap as that, and may approve it", () => {
      held = ["hr.advances.decide"];
      advanceRows = [{ ...pending, cap_piastres: null, within_cap: true }];
      wrap(<ApprovalsPage />);
      expect(screen.getByText("Within cap")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    });

    it("the owner sees the figures and may pass the cap", () => {
      advanceRows = [{ ...pending, cap_piastres: 100_000, within_cap: false }];
      wrap(<ApprovalsPage />);
      expect(screen.getByText("Over cap")).toBeInTheDocument();
      expect(screen.getByText(/Owes EGP 1,400\.00 of a EGP 1,000\.00 cap/)).toBeInTheDocument();
      expect(within(approveIn("Salary advance")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    });
  });

  describe("D8: a rejected advance or pay line says why (owner decision 8)", () => {
    it("an advance is rejected only with a reason, which goes to the server", async () => {
      const user = userEvent.setup();
      wrap(<ApprovalsPage />);
      await user.click(within(approveIn("Salary advance")).getByRole("button", { name: "Reject" }));
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Reject" }));
      expect(await within(dialog).findByText("A reason is needed")).toBeInTheDocument();
      expect(calls.reviewAdvance).not.toHaveBeenCalled();
      await user.type(within(dialog).getByLabelText("Reason"), "Asked too soon after the last one");
      await user.click(within(dialog).getByRole("button", { name: "Reject" }));
      await waitFor(() => expect(calls.reviewAdvance).toHaveBeenCalledWith("v1", { approve: false, reason: "Asked too soon after the last one" }));
    });

    it("a pay line over the limit is rejected only with a reason", async () => {
      const user = userEvent.setup();
      wrap(<ApprovalsPage />);
      await user.click(within(approveIn("Bonus over the limit")).getByRole("button", { name: "Reject" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText("Reason"), "Not this month");
      await user.click(within(dialog).getByRole("button", { name: "Reject" }));
      await waitFor(() => expect(calls.decideAdjustment).toHaveBeenCalledWith("bonus", "a2", { approve: false, reason: "Not this month" }));
    });
  });
});

