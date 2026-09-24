/**
 * The payroll page against the moments money goes wrong: someone without
 * payroll rights (no page, no request), the live preview vs the frozen slips,
 * approve → mark paid → no reopen, and the two line actions a manager has —
 * waive a rule-made deduction (never delete it) and delete a manual one.
 * The server decides every figure; these check what the page sends it.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComputedPayslip, CurrentPayroll, Employee, Payslip } from "@/data/api/generated/models";

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
let current: CurrentPayroll | undefined;
let adjustments: unknown[] = [];
let scopeBranch: string | null = null;
const expenseParams: unknown[] = [];
const enabledSeen: Record<string, boolean[]> = {};
const calls = {
  generatePeriod: vi.fn(async () => ({})),
  setPeriodStatus: vi.fn(async () => ({})),
  markPaid: vi.fn(async () => ({})),
  waiveDeduction: vi.fn(async () => ({})),
  unwaiveDeduction: vi.fn(async () => ({})),
  overrideDeduction: vi.fn(async () => ({})),
  deleteDeduction: vi.fn(async () => ({})),
  deleteBonus: vi.fn(async () => ({})),
  createAdjustment: vi.fn(async () => ({})),
  recordAdvance: vi.fn(async () => ({})),
  stopAdjustment: vi.fn(async () => ({})),
};

const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  return { data: data(), isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
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
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
const excel = vi.fn(async (_c: unknown) => {});
vi.mock("@/lib/excel", () => ({ exportToExcel: (c: unknown) => excel(c) }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn() };
});
vi.mock("./rules-banner", () => ({ RulesFirstBanner: () => null }));
vi.mock("@/hooks/use-org-modules", () => ({ useCurrentOrg: () => ({ name: "Madar Coffee" }), useOrgModules: () => ["pos", "dawam"] }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: scopeBranch }) }));
vi.mock("@/data/api/generated/api", () => ({
  useCurrent: hook("current", () => current),
  useListEmployees: hook("employees", () => [
    { id: "e1", name: "Sara Ahmed", pay_method: "bank", pay_account: "EG38 0019" },
    { id: "e4", name: "Youssef Adel", pay_method: "cash" },
  ] as Partial<Employee>[]),
  useListAdjustments: hook("adjustments", () => adjustments),
  useListAdvances: hook("advances", () => []),
  useListExpenseAdvances: (params: unknown, ...rest: unknown[]) => { expenseParams.push(params); return hook("expenses", () => [])(params, ...rest); },
  useListPayslips: hook("payslips", () => []),
  useListBranches: hook("branches", () => [{ id: "b1", name: "Zamalek" }]),
  exportPeriodCsv: vi.fn(),
  decideAdjustment: vi.fn(),
  createAdvanceAdmin: vi.fn(),
  reviewAdvance: vi.fn(),
  logExpenseAdvance: vi.fn(),
  ...calls,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { PayrollPage, periodPhase } = await import("./payroll-page");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider>{node}</ConfirmProvider>
    </QueryClientProvider>,
  );

const slip = (user: string, name: string, over: Partial<ComputedPayslip> = {}): ComputedPayslip =>
  ({
    employee_id: user, name, base_piastres: 900_000, base_salary_piastres: 900_000, net_piastres: 880_000,
    overtime_piastres: 0, overtime_minutes: 0, bonuses_piastres: 0, deductions_piastres: 20_000,
    advance_installment_piastres: 0, carry_out_piastres: 0, absent_days: 0, leave_days: 0,
    late_minutes: 12, worked_days: 20,
    breakdown: {
      paid_days: 31, window_days: 31, bonuses: [], advances: [],
      deductions: [
        { id: "d1", reason: "Late arrival", piastres: 5_000, source: "late_penalty" },
        { id: "d2", reason: "Broke a glass", piastres: 15_000, source: "manual" },
      ],
    },
    ...over,
  }) as ComputedPayslip;

const period = (status: string) => ({
  id: "p2", name: "26 Aug – 25 Sep 2026", start_date: "2026-08-26", end_date: "2026-09-25", status,
  org_id: "o", created_at: "", updated_at: "", employee_count: 2, total_net_piastres: 0,
});

beforeEach(() => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  for (const f of Object.values(calls)) f.mockClear();
  adjustments = [];
  scopeBranch = null;
  expenseParams.length = 0;
  held = ["hr.payroll.read", "hr.payroll.run", "hr.adjustments.create", "hr.deductions.create"];
  current = {
    period: period("draft"),
    preview: [slip("e1", "Sara Ahmed"), slip("e4", "Youssef Adel", { net_piastres: 745_000 })],
    payslips: [],
    history: [],
  } as unknown as CurrentPayroll;
});

describe("PayrollPage", () => {
  it("is closed to someone without payroll rights, and asks the server nothing", () => {
    held = [];
    wrap(<PayrollPage />);
    expect(screen.getByText(/Payroll needs payroll rights/)).toBeInTheDocument();
    expect(enabledSeen.current.every((e) => e === false)).toBe(true);
  });

  it("shows the live preview and approves the period (PAY-2, PAY-5)", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    expect(screen.getAllByText("Sara Ahmed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimate").length).toBe(2);
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve payroll" }));
    await waitFor(() => expect(calls.generatePeriod).toHaveBeenCalledWith("p2"));
  });

  it("marks someone paid with their own pay method, and hides reopen once anyone is paid (PAY-6, PAY-7)", async () => {
    const user = userEvent.setup();
    const frozen = (u: string, n: string, paid: string | null) =>
      ({ ...slip(u, n), id: `s-${u}`, employee_name: n, paid_method: paid, payroll_period_id: "p2" }) as unknown as Payslip;
    current = { ...current!, period: period("generated"), payslips: [frozen("e1", "Sara Ahmed", null), frozen("e4", "Youssef Adel", null)] };
    const { unmount } = wrap(<PayrollPage />);
    expect(screen.getByRole("button", { name: /Reopen/ })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Mark paid" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("radio", { name: "Bank transfer" })).toHaveAttribute("aria-checked", "true");
    await user.click(within(dialog).getByRole("button", { name: "Mark paid" }));
    await waitFor(() => expect(calls.markPaid).toHaveBeenCalledWith("p2", "e1", { method: "bank" }));
    unmount();

    current = { ...current!, paid_count: 1, payslips: [frozen("e1", "Sara Ahmed", "bank"), frozen("e4", "Youssef Adel", null)] };
    wrap(<PayrollPage />);
    expect(screen.queryByRole("button", { name: /Reopen/ })).not.toBeInTheDocument();
    // The server's count, not a client sum (AT-3).
    expect(screen.getByText("Paid 1 of 2")).toBeInTheDocument();
  });

  it("still offers reopen when the only 'paid' slip is a zero-net one settled automatically (PAY-6, PAY-7)", () => {
    // E2E: the owner's 0-net payslip is settled at approval (paid_method "none");
    // the server still allows a reopen, but the page hid the button.
    const frozen = (u: string, n: string, paid: string | null, net = 880_000) =>
      ({ ...slip(u, n, { net_piastres: net }), id: `s-${u}`, employee_name: n, paid_method: paid, payroll_period_id: "p2" }) as unknown as Payslip;
    current = { ...current!, period: period("generated"), paid_count: 1, payslips: [frozen("e1", "Sara Ahmed", null), frozen("e9", "The Owner", "none", 0)] };
    wrap(<PayrollPage />);
    expect(screen.getByRole("button", { name: /Reopen/ })).toBeInTheDocument();
    expect(screen.queryByText("none")).not.toBeInTheDocument();
  });

  it("reopens only with a reason, which goes to the server (PAY-6, AD-9)", async () => {
    const user = userEvent.setup();
    current = { ...current!, period: period("generated"), payslips: [], paid_count: 0 };
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /Reopen/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Reopen" }));
    expect(calls.setPeriodStatus).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Reason"), "A line was missing");
    await user.click(within(dialog).getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(calls.setPeriodStatus).toHaveBeenCalledWith("p2", { status: "draft", reason: "A line was missing" }));
  });

  it("overrides a rule-made line with a reason, and undoes a waiver with one (AD-8, AT-7)", async () => {
    const user = userEvent.setup();
    current = {
      ...current!,
      preview: [slip("e1", "Sara Ahmed", {
        breakdown: {
          paid_days: 31, window_days: 31, bonuses: [], advances: [],
          deductions: [
            { id: "d1", reason: "Late arrival", piastres: 5_000, source: "late_penalty" },
            { id: "d3", reason: "Absent", piastres: 9_000, source: "absence", waived: true },
          ],
        },
      })],
    } as unknown as CurrentPayroll;
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Sara Ahmed")[0]);
    const sheet = await screen.findByRole("dialog");
    await user.click(within(sheet).getByRole("button", { name: "Override" }));
    const form = (await screen.findAllByRole("dialog")).at(-1)!;
    const amount = within(form).getByLabelText("New amount (EGP)");
    expect(amount).toHaveValue(50);
    await user.clear(amount);
    await user.type(amount, "0");
    await user.type(within(form).getByLabelText("Reason"), "Covered by a colleague");
    await user.click(within(form).getByRole("button", { name: "Override" }));
    await waitFor(() => expect(calls.overrideDeduction).toHaveBeenCalledWith("d1", { amount_piastres: 0, reason: "Covered by a colleague" }));

    await user.click(within(sheet).getByRole("button", { name: "Undo the waiver" }));
    const undo = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.type(within(undo).getByLabelText("Reason"), "Waived the wrong day");
    await user.click(within(undo).getByRole("button", { name: "Undo the waiver" }));
    await waitFor(() => expect(calls.unwaiveDeduction).toHaveBeenCalledWith("d3", { reason: "Waived the wrong day" }));
  });

  it("keeps deductions to hr.deductions.create and bonuses to hr.adjustments.create (AD-5)", async () => {
    const user = userEvent.setup();
    held = ["hr.payroll.read", "hr.adjustments.create"];
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Sara Ahmed")[0]);
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByRole("button", { name: "Bonus" })).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: "Deduction" })).not.toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: "Waive" })).not.toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: "Override" })).not.toBeInTheDocument();
    // The manual deduction line is not theirs to delete either.
    expect(within(sheet).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("files a pay line under the month picked (AD-1, AD-10)", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Youssef Adel")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Bonus" }));
    const form = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.type(within(form).getByLabelText("Amount (EGP)"), "100");
    await user.type(within(form).getByLabelText("Reason"), "Eid");
    const month = within(form).getByLabelText("Counts in the month of");
    expect((month as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}$/);
    await user.clear(month);
    await user.type(month, "2026-11");
    await user.click(within(form).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.createAdjustment).toHaveBeenCalledWith(expect.objectContaining({ effective_date: "2026-11-01", amount_piastres: 10_000 })),
    );
  });

  it("waives a rule-made line and deletes only a manual one (AD-7)", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Sara Ahmed")[0]);
    const sheet = await screen.findByRole("dialog");
    // The rule line can be waived, not deleted; the manual one the other way round.
    expect(within(sheet).getAllByRole("button", { name: "Waive" })).toHaveLength(1);
    expect(within(sheet).getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    await user.click(within(sheet).getByRole("button", { name: "Waive" }));
    const waive = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.type(within(waive).getByLabelText("Reason"), "First week");
    await user.click(within(waive).getByRole("button", { name: "Waive" }));
    await waitFor(() => expect(calls.waiveDeduction).toHaveBeenCalledWith("d1", { reason: "First week" }));

    await user.click(within(sheet).getByRole("button", { name: "Delete" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(calls.deleteDeduction).toHaveBeenCalledWith("d2"));
    expect(calls.deleteBonus).not.toHaveBeenCalled();
  });

  it("adds a bonus from a payslip in piastres", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Youssef Adel")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Bonus" }));
    const form = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.type(within(form).getByLabelText("Amount (EGP)"), "150.5");
    await user.type(within(form).getByLabelText("Reason"), "Best month");
    await user.click(within(form).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.createAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: "e4", kind: "bonus", amount_piastres: 15_050, reason: "Best month", percent_of_base: null }),
      ),
    );
  });

  it("never sends a percentage for a deduction (AD-2)", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Youssef Adel")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Bonus" }));
    const form = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.click(within(form).getByRole("radio", { name: "% of salary" }));
    await user.click(within(form).getByRole("radio", { name: "Deduction" }));
    expect(within(form).queryByRole("radio", { name: "% of salary" })).not.toBeInTheDocument();
    await user.type(within(form).getByLabelText("Amount (EGP)"), "10");
    await user.type(within(form).getByLabelText("Reason"), "Broken cup");
    await user.click(within(form).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.createAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "deduction", amount_piastres: 1_000, percent_of_base: null }),
      ),
    );
  });

  it("keeps an open payslip current when the server's figures change", async () => {
    const user = userEvent.setup();
    const ui = () => (
      <QueryClientProvider client={new QueryClient()}>
        <ConfirmProvider><PayrollPage /></ConfirmProvider>
      </QueryClientProvider>
    );
    const { rerender } = render(ui());
    await user.click(screen.getAllByText("Sara Ahmed")[0]);
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("EGP 8,800.00")).toBeInTheDocument();
    // The waiver landed: the server now answers without that line.
    current = {
      ...current!,
      preview: [slip("e1", "Sara Ahmed", {
        net_piastres: 885_000, deductions_piastres: 15_000,
        breakdown: { paid_days: 31, window_days: 31, bonuses: [], advances: [], deductions: [{ id: "d2", reason: "Broke a glass", piastres: 15_000, source: "manual" }] },
      })],
    };
    rerender(ui());
    const again = await screen.findByRole("dialog");
    expect(within(again).getByText("EGP 8,850.00")).toBeInTheDocument();
    expect(within(again).queryByText("Late arrival")).not.toBeInTheDocument();
  });

  it("stops a monthly line only with a reason, which goes to the server (AD-3, AD-9)", async () => {
    // E2E payroll: Stop sent {} — the audit row had no "why".
    const user = userEvent.setup();
    adjustments = [{
      id: "b7", kind: "bonus", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 30_000, percent_of_base: null,
      value_piastres: 30_000, reason: "Meal allowance", effective_date: "2026-09-01", source: "manual", status: "approved",
      recurring: true, ends_on: null,
    }];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    await user.click(await screen.findByRole("button", { name: "Stop" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Stop" }));
    expect(await within(dialog).findByText("A reason is needed")).toBeInTheDocument();
    expect(calls.stopAdjustment).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Reason"), "Moved to the day shift");
    await user.click(within(dialog).getByRole("button", { name: "Stop" }));
    await waitFor(() => expect(calls.stopAdjustment).toHaveBeenCalledWith("bonus", "b7", { reason: "Moved to the day shift" }));
  });

  it("leaves nothing-to-transfer payslips out of the bank and wallet lists (PAY-8)", async () => {
    // E2E payroll: a 0.00 net (deductions carried to next month) was listed as a bank transfer;
    // the server's bank/wallet CSV already lists only net > 0.
    const user = userEvent.setup();
    const frozen = (u: string, n: string, net: number) =>
      ({ ...slip(u, n, { net_piastres: net }), id: `s-${u}`, employee_name: n, paid_method: null, payroll_period_id: "p2" }) as unknown as Payslip;
    current = { ...current!, period: period("generated"), payslips: [frozen("e1", "Sara Ahmed", 0), frozen("e4", "Youssef Adel", 745_000)] };
    excel.mockClear();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /Bank & wallet lists/ }));
    await waitFor(() => expect(excel).toHaveBeenCalled());
    const cfg = excel.mock.calls[0][0] as { sheets: { rows: { employee_id: string }[] }[] };
    // Sara is paid by bank but has nothing to receive; Youssef is paid in cash.
    expect(cfg.sheets.flatMap((sh) => sh.rows)).toEqual([]);
  });

  it("lists expense advances for the scope bar's branch, or every branch (AV-9)", async () => {
    // E2E payroll (B-PAY-3): the list ignored the branch picked in the scope bar.
    const user = userEvent.setup();
    scopeBranch = "b1";
    const { unmount } = wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Expense advances/ }));
    expect(expenseParams.at(-1)).toEqual({ branch_id: "b1" });
    unmount();
    scopeBranch = null;
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Expense advances/ }));
    expect(expenseParams.at(-1)).toEqual({});
  });

  it("reads the server's period status as a phase", () => {
    expect(periodPhase(period("draft") as never)).toBe("open");
    expect(periodPhase(period("generated") as never)).toBe("approved");
    expect(periodPhase(period("paid") as never)).toBe("paid");
  });

  it("strikes a waived line through, offers no second waiver, and prints a payslip (AD-8, PAY-10)", async () => {
    const user = userEvent.setup();
    current = {
      ...current!,
      preview: [
        slip("e1", "Sara Ahmed", {
          net_piastres: 885_000, deductions_piastres: 15_000,
          breakdown: {
            paid_days: 31, window_days: 31, bonuses: [], advances: [],
            deductions: [
              { id: "d1", reason: "Late arrival", piastres: 5_000, source: "late_penalty", waived: true },
              { id: "d2", reason: "Broke <b>a</b> glass", piastres: 15_000, source: "manual" },
            ],
          },
        }),
      ],
    } as unknown as CurrentPayroll;
    const doc = { open: vi.fn(), write: vi.fn(), close: vi.fn(), fonts: { ready: Promise.resolve() } };
    const win = { document: doc, focus: vi.fn(), print: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Sara Ahmed")[0]);
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Late arrival")).toHaveClass("line-through");
    expect(within(sheet).getByText("Waived")).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: "Waive" })).not.toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Download PDF/ }));
    expect(open).toHaveBeenCalled();
    const html = doc.write.mock.calls[0][0] as string;
    expect(html).toContain("Madar Coffee");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("line-through");
    // A reason someone typed is text, never markup.
    expect(html).toContain("Broke &lt;b&gt;a&lt;/b&gt; glass");
    await waitFor(() => expect(win.print).toHaveBeenCalled());
    open.mockRestore();
  });
});
