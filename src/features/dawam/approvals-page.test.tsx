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
const LEAVE = { id: "q1", employee_id: "e1", employee_name: "Youssef Adel", kind: "leave", status: "pending", on_date: "2026-09-25", created_at: "2026-09-22T07:00:00Z", reason: "Family wedding" };
let requestRows: Record<string, unknown>[] = [LEAVE];
const enabledSeen: Record<string, boolean[]> = {};
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
  useListAdvances: hook("advances", () => [
    { id: "v1", employee_name: "Sara Ahmed", amount_piastres: 50_000, installments: 2, status: "pending", created_at: "2026-09-22T08:00:00Z", reason: "Rent" },
    { id: "v0", employee_name: "Sara Ahmed", amount_piastres: 90_000, installments: 1, status: "approved", created_at: "2026-09-01T08:00:00Z" },
  ]),
  useListSwaps: hook("swaps", () => [
    { id: "w1", requester_name: "Sara Ahmed", peer_name: "Youssef Adel", requester_shift_name: "Morning", peer_shift_name: "Evening", requester_date: "2026-09-26", peer_date: "2026-09-26", status: "pending", created_at: "2026-09-22T06:00:00Z" },
  ]),
  useListOpenShifts: hook("claims", () => [
    { id: "o1", shift_name: "Evening", on_date: "2026-09-27", status: "claimed", claimed_by_name: "Laila Hassan" },
    { id: "o2", shift_name: "Morning", on_date: "2026-09-28", status: "open" },
  ]),
  useListAttendance: hook("attendance", () => [
    { id: "r5", employee_name: "Sara Ahmed", covered_employee_id: "e4", cover_status: "pending", work_shift_name: "Evening", business_date: "2026-09-22", check_in_at: "2026-09-22T12:40:00Z", created_at: "2026-09-22T12:40:00Z", overtime_minutes: 0 },
    { id: "r6", employee_name: "Omar Khaled", overtime_status: "pending", overtime_minutes: 45, business_date: "2026-09-21", check_out_at: "2026-09-21T20:45:00Z", created_at: "2026-09-21T08:00:00Z" },
  ]),
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

  it("rejects a swap only after confirming", async () => {
    const user = userEvent.setup();
    wrap(<ApprovalsPage />);
    await user.click(within(approveIn("Shift swap")).getByRole("button", { name: "Reject" }));
    expect(calls.decideSwap).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(calls.decideSwap).toHaveBeenCalledWith("w1", { approve: false }));
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

  it("shows a correction's proposed times against the record's punches, a half day and who decides", () => {
    requestRows = [
      { id: "q2", employee_id: "e1", employee_name: "Youssef Adel", kind: "correction", status: "pending", on_date: "2026-09-21", from_time: "09:00:00", to_time: "17:30:00", record_check_in_at: "2026-09-21T06:40:00Z", record_check_out_at: null, created_at: "2026-09-22T09:00:00Z" },
      { id: "q3", employee_id: "e2", employee_name: "Sara Ahmed", kind: "leave", is_half_day: true, leave_half: "second", status: "pending", on_date: "2026-09-26", created_at: "2026-09-22T09:10:00Z", to_owner: true },
    ];
    held = ["hr.leave.edit"];
    wrap(<ApprovalsPage />);
    expect(screen.getByText(/in .+ → 09:00 · out — → 17:30/)).toBeInTheDocument();
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
});
