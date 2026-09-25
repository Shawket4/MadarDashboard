/**
 * The money forms' contract with the server: a recorded advance is ONE call
 * (AV-2, audit 05 B10) within 1–24 installments; a pay line names its month
 * (AD-1) and never sends a % for a deduction (AD-2); nothing is sent while a
 * required field is empty — the form says so instead of a silent Save.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = {
  recordAdvance: vi.fn(async () => ({})),
  createAdjustment: vi.fn(async () => ({})),
  reviewAdvance: vi.fn(async () => ({})),
};
vi.mock("@/data/api/generated/api", () => ({
  useCurrent: () => ({ data: undefined, isLoading: false }),
  useListEmployees: () => ({ data: [{ id: "e1", name: "Sara Ahmed" }], isLoading: false }),
  useListBranches: () => ({ data: [], isLoading: false }),
  ...calls,
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ can: () => false, canAny: () => false }) }));
const toast = { success: vi.fn(), info: vi.fn(), error: vi.fn(), warning: vi.fn() };
vi.mock("sonner", () => ({ toast }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn() };
});

// Radix Select in jsdom: pointer capture and scrolling don't exist there.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AdjustmentDialog, RecordAdvanceDialog, ReviewAdvanceDialog, firstOpenMonth, monthToDate } = await import("./money-dialogs");

const wrap = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);

beforeEach(() => {
  for (const f of Object.values(calls)) f.mockClear();
  for (const f of Object.values(toast)) f.mockClear();
});

describe("RecordAdvanceDialog", () => {
  it("records an advance in one call, in piastres, within 24 installments", async () => {
    const user = userEvent.setup();
    wrap(<RecordAdvanceDialog open onOpenChange={() => {}} />);
    const dialog = await screen.findByRole("dialog");
    // No employee picked: refused by the form, nothing sent.
    await user.type(within(dialog).getByLabelText("Amount (EGP)"), "1500");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Pick an employee", { selector: "p" })).toBeInTheDocument();
    expect(calls.recordAdvance).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: "Sara Ahmed" }));
    const n = within(dialog).getByLabelText("Monthly installments");
    await user.clear(n);
    await user.type(n, "30");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    // The hint, and now the refusal too.
    expect(await within(dialog).findAllByText("1 to 24 monthly installments")).toHaveLength(2);
    expect(calls.recordAdvance).not.toHaveBeenCalled();

    await user.clear(n);
    await user.type(n, "3");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.recordAdvance).toHaveBeenCalledWith({ employee_id: "e1", amount_piastres: 150_000, installments: 3, reason: null }),
    );
    expect(calls.recordAdvance).toHaveBeenCalledTimes(1);
  });
});

describe("AdjustmentDialog", () => {
  it("needs a reason and an amount, and files the line under a month", async () => {
    const user = userEvent.setup();
    wrap(<AdjustmentDialog open onOpenChange={() => {}} userId="e1" bonus={false} />);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("A reason is needed")).toBeInTheDocument();
    expect(calls.createAdjustment).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Amount (EGP)"), "25");
    await user.type(within(dialog).getByLabelText("Reason"), "Broken tray");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.createAdjustment).toHaveBeenCalledWith({
        employee_id: "e1", kind: "deduction", reason: "Broken tray", recurring: false,
        amount_piastres: 2_500, percent_of_base: null, effective_date: expect.stringMatching(/^\d{4}-\d{2}-01$/),
      }),
    );
  });

  it("says a line over the manager's limit waits for the owner, not that it was added (AD-5)", async () => {
    // E2E: Karim's 1,200 EGP deduction came back pending; the toast said "Pay line added".
    calls.createAdjustment.mockResolvedValueOnce({ status: "pending" } as never);
    const user = userEvent.setup();
    wrap(<AdjustmentDialog open onOpenChange={() => {}} userId="e1" bonus={false} />);
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Amount (EGP)"), "1200");
    await user.type(within(dialog).getByLabelText("Reason"), "Broken tray");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Over your limit: it waits for the owner before it counts."));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("turns a picked month into its first day", () => {
    expect(monthToDate("2026-11")).toBe("2026-11-01");
  });
});

describe("ReviewAdvanceDialog", () => {
  it("sends the amount only when it was changed (audit 06 B11)", async () => {
    const user = userEvent.setup();
    wrap(<ReviewAdvanceDialog advance={{ id: "v1", employee_name: "Sara", amount_piastres: 123_456, installments: 2 }} onOpenChange={() => {}} />);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.reviewAdvance).toHaveBeenCalledWith("v1", { approve: true, amount_piastres: null, installments: 2, note: null }));
    const amount = within(dialog).getByLabelText("Amount (EGP)");
    await user.clear(amount);
    await user.type(amount, "1000");
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.reviewAdvance).toHaveBeenLastCalledWith("v1", { approve: true, amount_piastres: 100_000, installments: 2, note: null }));
  });
});

describe("M27: a new line lands in the first open month", () => {
  const period = (status: string, end_date: string) => ({ status, end_date }) as never;
  it("the open period's month while it is open", () => {
    expect(firstOpenMonth(period("draft", "2026-09-25"), "2026-09-20")).toBe("2026-09");
    expect(firstOpenMonth(period("draft", "2026-09-30"), "2026-09-20")).toBe("2026-09");
  });

  it("the next month once it is approved or paid, across a year", () => {
    expect(firstOpenMonth(period("generated", "2026-09-25"), "2026-09-20")).toBe("2026-10");
    expect(firstOpenMonth(period("paid", "2026-12-31"), "2026-12-31")).toBe("2027-01");
  });

  it("this month when the period isn't known (no payroll right)", () => {
    expect(firstOpenMonth(undefined, "2026-09-20")).toBe("2026-09");
  });
});

