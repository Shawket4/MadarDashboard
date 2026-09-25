/**
 * The Requests inbox: filing for someone without leave types (RQ-2), which
 * half of a half day (RQ-8), a mission without a title, leave approved only
 * with a paid/unpaid answer, a cancellation that says why (AT-7), and a
 * manager's own request never offered for a decision (RQ-5).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Radix Select needs these in jsdom.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const decideRequest = vi.fn(async (_id: string, _body: unknown) => ({}));
const createRequestAdmin = vi.fn(async (_body: unknown) => ({ status: "pending" }));
const toastError = vi.fn();
const toastSuccess = vi.fn();

const LEAVE = { id: "q1", employee_id: "e1", employee_name: "Youssef Adel", kind: "leave", status: "pending", on_date: "2026-09-25", end_date: "2026-09-26", is_half_day: false, created_at: "2026-09-22T07:00:00Z" };
const MINE = { id: "q2", employee_id: "e-me", employee_name: "Karim Manager", kind: "late_arrival", status: "pending", on_date: "2026-09-24", to_time: "10:00:00", is_half_day: false, created_at: "2026-09-22T08:00:00Z" };
const APPROVED = { id: "q3", employee_id: "e1", employee_name: "Youssef Adel", kind: "mission", status: "approved", on_date: "2026-09-20", title: "Supplier visit", is_half_day: false, created_at: "2026-09-19T08:00:00Z" };
let rows: Record<string, unknown>[] = [];

vi.mock("@/data/api/generated/api", () => ({
  useListRequests: () => ({ data: rows, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
  useListEmployees: () => ({
    data: [
      { id: "e-me", name: "Karim Manager", user_id: "u-me" },
      { id: "e1", name: "Youssef Adel", user_id: null },
    ],
  }),
  decideRequest: (id: string, body: unknown) => decideRequest(id, body),
  createRequestAdmin: (body: unknown) => createRequestAdmin(body),
}));
let held = ["hr.leave.create", "hr.leave.edit", "hr.attendance.edit"];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u-me", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateRequests: vi.fn(), todayIso: () => "2026-09-23" };
});
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), info: vi.fn(), error: (m: string) => toastError(m) },
}));

const { useAuthStore } = await import("@/data/stores/auth.store");
useAuthStore.setState({ user: { id: "u-me" } as never });
const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { RequestsInboxPage, newRequestBody } = await import("./requests-inbox");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { TooltipProvider } = await import("@/components/ui/tooltip");

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider><ConfirmProvider><RequestsInboxPage /></ConfirmProvider></TooltipProvider>
    </QueryClientProvider>,
  );
const rowOf = (name: string) => {
  let el: HTMLElement | null = screen.getAllByText(name)[0];
  while (el && within(el).queryAllByRole("button", { name: /Cancel request/ }).length === 0) el = el.parentElement;
  return el!;
};
const pick = async (user: ReturnType<typeof userEvent.setup>, combobox: string, option: string) => {
  await user.click(screen.getByRole("combobox", { name: combobox }));
  await user.click(await screen.findByRole("option", { name: option }));
};

beforeEach(() => {
  decideRequest.mockClear();
  createRequestAdmin.mockClear();
  toastError.mockClear();
  toastSuccess.mockClear();
  rows = [LEAVE, MINE, APPROVED];
  held = ["hr.leave.create", "hr.leave.edit", "hr.attendance.edit"];
});

describe("Requests inbox", () => {
  it("offers filing for someone only with hr.leave.create (E2E: a branch manager got a 403)", () => {
    held = ["hr.leave.edit", "hr.attendance.edit"];
    renderPage();
    expect(screen.queryByRole("button", { name: /New request/ })).not.toBeInTheDocument();
  });

  it("a cancelled request says who cancelled it and why, keeping the approval's note (RQ-F6)", () => {
    rows = [
      { ...APPROVED, id: "q8", employee_name: "Omar Cancelled", status: "cancelled", decided_by: "u-other", decision_note: "Enjoy the trip",
        cancelled_by: "u-me", cancel_note: "Trip called off" },
      { ...LEAVE, id: "q9", employee_name: "Nada Self", status: "cancelled", cancelled_by: null, cancel_note: null },
    ];
    renderPage();
    const row = screen.getByText(/Trip called off/);
    expect(row.textContent).toContain("Enjoy the trip");
    expect(row.textContent).toContain("Cancelled by Karim Manager: Trip called off");
    expect(screen.queryByText(/Cancelled by .*Nada/)).not.toBeInTheDocument();
  });

  it("never offers a manager their own request, and marks it (RQ-5)", () => {
    renderPage();
    const mine = rowOf("Karim Manager");
    expect(within(mine).getByText("Yours — decided above you")).toBeInTheDocument();
    expect(within(mine).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(within(rowOf("Youssef Adel")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("offers a decision only when the server says the caller may make it (can_decide)", () => {
    // A peer manager's request at a shared branch: not mine, not mine to decide.
    rows = [LEAVE, { ...LEAVE, id: "q7", employee_id: "e-peer", employee_name: "Hana Peer", is_own: false, can_decide: false, to_owner: true }];
    renderPage();
    expect(within(rowOf("Hana Peer")).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(within(rowOf("Hana Peer")).queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(within(rowOf("Youssef Adel")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("a request in a closed month offers Reject only, and says why (month_closed)", async () => {
    rows = [
      { ...LEAVE, id: "q5", employee_name: "Ziad Closed", month_closed: true, can_decide: true },
      { ...APPROVED, id: "q6", employee_name: "Omar Closed", month_closed: true },
    ];
    const user = userEvent.setup();
    renderPage();
    const pending = rowOf("Ziad Closed");
    expect(within(pending).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(within(pending).getByText("Month closed: reject only")).toBeInTheDocument();
    await user.click(within(pending).getByRole("button", { name: "Reject" }));
    // Approved time in a closed month can't be cancelled.
    expect(screen.getAllByText("Omar Closed").length).toBeGreaterThan(0);
    const approvedRow = screen.getAllByText("Omar Closed")[0].closest("[data-slot], div")!.parentElement!;
    expect(within(approvedRow.parentElement!).queryByRole("button", { name: /Cancel request/ })).not.toBeInTheDocument();
  });

  it("approves leave only with a paid/unpaid answer (RQ-2, was sent with none)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(rowOf("Youssef Adel")).getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Paid leave")).toBeInTheDocument();
    expect(within(dialog).getByRole("switch")).toBeChecked();
    await user.click(within(dialog).getByRole("switch"));
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(decideRequest).toHaveBeenCalledWith("q1", { status: "approved", is_paid: false, note: null }));
  });

  it("cancels someone else's request only with a note (AT-7)", async () => {
    const user = userEvent.setup();
    renderPage();
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel request" });
    await user.click(cancelButtons.at(-1)!);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel request" }));
    expect(await within(dialog).findByText("Say why it is cancelled")).toBeInTheDocument();
    expect(decideRequest).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Why"), "Visit moved");
    await user.click(within(dialog).getByRole("button", { name: "Cancel request" }));
    await waitFor(() => expect(decideRequest).toHaveBeenCalledWith("q3", { status: "cancelled", note: "Visit moved" }));
  });

  it("lets a manager withdraw their own pending request without a note", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(rowOf("Karim Manager")).getByRole("button", { name: "Cancel request" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel request" }));
    await waitFor(() => expect(decideRequest).toHaveBeenCalledWith("q2", { status: "cancelled", note: null }));
  });

  it("shows the server's refusal of a decision", async () => {
    decideRequest.mockRejectedValueOnce(new Error("This month is closed"));
    rows = [{ ...LEAVE, kind: "late_arrival", to_time: "10:00:00" }];
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});

describe("Requests inbox, server answers", () => {
  it("shows why an approved request was cancelled, beside the approver's note (B-TEAM-3)", () => {
    rows = [{ ...APPROVED, status: "cancelled", decision_note: "Go ahead", cancel_note: "Trip postponed", decided_by_name: "Tasbeeh", cancelled_by_name: "Karim Mostafa" }];
    renderPage();
    expect(screen.getByText(/Go ahead/)).toBeInTheDocument();
    expect(screen.getByText(/Trip postponed/)).toBeInTheDocument();
    // Who decided and who cancelled (backend 68078ac, AT-10).
    expect(screen.getByText(/Decided by Tasbeeh/)).toBeInTheDocument();
    expect(screen.getByText(/Cancelled by Karim Mostafa/)).toBeInTheDocument();
    // On a phone the whole line wraps rather than cutting off who cancelled (E2E team re-verify).
    expect(screen.getByText(/Cancelled by Karim Mostafa/)).not.toHaveClass("truncate");
  });

  it("never offers to cancel an approved correction, which the server refuses (409)", () => {
    rows = [{ id: "q5", employee_id: "e1", employee_name: "Youssef Adel", kind: "correction", status: "approved", on_date: "2026-09-20", from_time: "09:00:00", is_half_day: false, created_at: "2026-09-19T08:00:00Z" }];
    renderPage();
    expect(screen.queryByRole("button", { name: "Cancel request" })).not.toBeInTheDocument();
  });

  it("reads a closed month in the user's language (PERIOD_CLOSED)", async () => {
    const { getErrorMessage } = await import("@/data/api/errors");
    const { AxiosError } = await import("axios");
    const e = new AxiosError("409", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 409, data: { error: "closed", code: "PERIOD_CLOSED" }, statusText: "", headers: {}, config: {} as never,
    });
    expect(getErrorMessage(e)).toMatch(/payroll month is closed/);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(e)).toMatch(/شهر الرواتب هذا مغلق/);
    await i18n.changeLanguage("en");
  });
});

describe("Filing for someone", () => {
  it("files a second-half half-day leave with no leave type (RQ-2, RQ-8)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText("Leave type")).not.toBeInTheDocument();
    await pick(user, "Kind", "Leave");
    await pick(user, "Employee", "Youssef Adel");
    await user.click(within(dialog).getByRole("switch", { name: "Half a day" }));
    await user.click(within(dialog).getByRole("radio", { name: "Second half" }));
    expect(within(dialog).queryByLabelText("To")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createRequestAdmin).toHaveBeenCalled());
    const body = createRequestAdmin.mock.calls[0][0] as Record<string, unknown>;
    expect(body).toMatchObject({ employee_id: "e1", kind: "leave", on_date: "2026-09-23", end_date: null, is_half_day: true, leave_half: "second" });
    expect(body).not.toHaveProperty("leave_type_id");
  });

  it("'To' follows 'From' until it is set on its own, and never sits before it (box verify)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    await pick(user, "Kind", "Mission");
    const from = within(dialog).getByLabelText("From");
    const to = within(dialog).getByLabelText("To");
    await user.clear(from);
    await user.type(from, "2026-10-05");
    expect(to).toHaveValue("2026-10-05");
    await user.clear(to);
    await user.type(to, "2026-10-07");
    await user.clear(from);
    await user.type(from, "2026-10-06");
    expect(to).toHaveValue("2026-10-07");
    await user.clear(from);
    await user.type(from, "2026-10-09");
    expect(to).toHaveValue("2026-10-09");
  });

  it("files a mission with only a note, and refuses one with neither title nor note", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    await pick(user, "Kind", "Mission");
    await pick(user, "Employee", "Youssef Adel");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Give the mission a title or a note")).toBeInTheDocument();
    expect(createRequestAdmin).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Reason"), "Bank run");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createRequestAdmin).toHaveBeenCalled());
    expect(createRequestAdmin.mock.calls[0][0]).toMatchObject({ kind: "mission", title: null, reason: "Bank run", end_date: "2026-09-23" });
  });

  it("says so when the server approved it as it was filed", async () => {
    createRequestAdmin.mockResolvedValueOnce({ status: "approved" });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    await pick(user, "Employee", "Karim Manager");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Request filed and approved"));
  });

  it("asks paid or unpaid when the filer's own leave is approved as filed, and refuses without it (QUESTIONS #19, RQ-2)", async () => {
    held = ["hr.leave.create", "hr.leave.edit", "hr.attendance.edit", "hr.requests.self_approve"];
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    await pick(user, "Kind", "Leave");
    await pick(user, "Employee", "Karim Manager");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Say whether this leave is paid or unpaid")).toBeInTheDocument();
    expect(createRequestAdmin).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("radio", { name: "Unpaid" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createRequestAdmin).toHaveBeenCalled());
    expect(createRequestAdmin.mock.calls[0][0]).toMatchObject({ employee_id: "e-me", kind: "leave", is_paid: false });
  });

  it("doesn't ask for someone else's leave (their approver chooses)", async () => {
    held = ["hr.leave.create", "hr.leave.edit", "hr.attendance.edit", "hr.requests.self_approve"];
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /New request/ }));
    const dialog = await screen.findByRole("dialog");
    await pick(user, "Kind", "Leave");
    await pick(user, "Employee", "Youssef Adel");
    expect(within(dialog).queryByRole("radio", { name: "Unpaid" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(createRequestAdmin).toHaveBeenCalled());
    expect(createRequestAdmin.mock.calls[0][0]).not.toHaveProperty("is_paid");
  });

  it("builds an excuse across midnight as filed, and a late arrival with its time only", () => {
    const base = { employee_id: "e1", on_date: "2026-09-23", end_date: "2026-09-23", half_day: false, leave_half: "first" as const, pay: "" as const, title: "", reason: "" };
    expect(newRequestBody({ ...base, kind: "excuse", from_time: "23:00", to_time: "01:00" })).toMatchObject({
      from_time: "23:00:00", to_time: "01:00:00", end_date: null,
    });
    expect(newRequestBody({ ...base, kind: "late_arrival", from_time: "12:00", to_time: "10:30" })).toMatchObject({
      from_time: null, to_time: "10:30:00",
    });
  });
});

describe("Owner decisions 18 and 43: small wording", () => {
  it("M18: a half-day leave with no half picked reads '½ day', not 'first half'", () => {
    rows = [
      { ...LEAVE, id: "h1", employee_name: "Old Seed", is_half_day: true, leave_half: null, end_date: null },
      { ...LEAVE, id: "h2", employee_name: "New Filing", is_half_day: true, leave_half: "second", end_date: null },
    ];
    renderPage();
    expect(screen.getByText("½ day")).toBeInTheDocument();
    expect(screen.getByText("½ day · second half")).toBeInTheDocument();
    expect(screen.queryByText("½ day · first half")).not.toBeInTheDocument();
  });

  it("M43: a mission shows its title in the list and in Approvals' detail", () => {
    rows = [APPROVED];
    renderPage();
    expect(screen.getByText(/Supplier visit/)).toBeInTheDocument();
  });

  it("M43: an approved correction shows the time it set once, not 'out 05:45 PM → 05:45 PM'", () => {
    rows = [{
      id: "c1", employee_id: "e1", employee_name: "Youssef Adel", kind: "correction", status: "approved", on_date: "2026-09-21",
      to_time: "17:45:00", record_check_out_at: "2026-09-21T14:45:00Z", is_half_day: false, created_at: "2026-09-21T18:00:00Z",
    }];
    renderPage();
    const meta = screen.getByText(/out /);
    expect(meta.textContent).not.toMatch(/→/);
    expect(meta.textContent).toMatch(/out 0?5:45\s?PM/i);
  });
});

