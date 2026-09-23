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
});

describe("Requests inbox", () => {
  it("never offers a manager their own request, and marks it (RQ-5)", () => {
    renderPage();
    const mine = rowOf("Karim Manager");
    expect(within(mine).getByText("Yours — decided above you")).toBeInTheDocument();
    expect(within(mine).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(within(rowOf("Youssef Adel")).getByRole("button", { name: "Approve" })).toBeInTheDocument();
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

  it("builds an excuse across midnight as filed, and a late arrival with its time only", () => {
    const base = { employee_id: "e1", on_date: "2026-09-23", end_date: "2026-09-23", half_day: false, leave_half: "first" as const, title: "", reason: "" };
    expect(newRequestBody({ ...base, kind: "excuse", from_time: "23:00", to_time: "01:00" })).toMatchObject({
      from_time: "23:00:00", to_time: "01:00:00", end_date: null,
    });
    expect(newRequestBody({ ...base, kind: "late_arrival", from_time: "12:00", to_time: "10:30" })).toMatchObject({
      from_time: null, to_time: "10:30:00",
    });
  });
});
