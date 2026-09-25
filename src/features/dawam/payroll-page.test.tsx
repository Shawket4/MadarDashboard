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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// Radix Select asks for pointer capture and scrolls its options; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
let current: CurrentPayroll | undefined;
let adjustments: unknown[] = [];
let advances: unknown[] = [];
let expenses: unknown[] = [];
let isOwner = false;
const expenseCalls = vi.hoisted(() => ({
  clear: vi.fn(async (_id: string, _b: unknown) => ({})),
  reassign: vi.fn(async (_id: string, _b: unknown) => ({})),
}));
let scopeBranch: string | null = null;
const expenseParams: unknown[] = [];
const decideAdjustment = vi.fn(async () => ({}));
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

/** H2: the history sheet's payslips read fails with this. */
let payslipsError: unknown = null;
/** H2-P1: an older month's own reads, by period id, and the preview read's failure. */
let payslipsById: Record<string, unknown[]> = {};
let previewById: Record<string, unknown[]> = {};
let previewError: unknown = null;
/** Any other read that fails, by hook name (H3: a failed list read as "none"). */
let failing: Record<string, unknown> = {};
/** A refetch that failed while the read still holds its last data (a 429, say). */
let refetchFailing: Record<string, unknown> = {};
const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  const error = name === "payslips" ? payslipsError : name === "preview" ? previewError : (failing[name] ?? null);
  if (refetchFailing[name]) return { data: data(), isLoading: false, isFetching: false, error: refetchFailing[name], refetch: vi.fn() };
  return { data: error ? undefined : data(), isLoading: false, isFetching: false, error, refetch: vi.fn() };
};

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner: isOwner, platform: false, role_kinds: [],
        capabilities: held as never, ask_manager: [], limits: {},
      }),
  };
});
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
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
  useListAdvances: hook("advances", () => advances),
  useListExpenseAdvances: (params: unknown, ...rest: unknown[]) => { expenseParams.push(params); return hook("expenses", () => expenses)(params, ...rest); },
  useListPayslips: (id: string, ...rest: unknown[]) => hook("payslips", () => payslipsById[id] ?? [])(id, ...rest),
  usePreviewPeriod: (id: string, ...rest: unknown[]) => hook("preview", () => previewById[id] ?? [])(id, ...rest),
  useListBranches: hook("branches", () => [{ id: "b1", name: "Zamalek" }]),
  exportPeriodCsv: vi.fn(),
  clearExpenseAdvance: expenseCalls.clear,
  reassignExpenseAdvance: expenseCalls.reassign,
  decideAdjustment: (...a: unknown[]) => decideAdjustment(...(a as [])),
  createAdvanceAdmin: vi.fn(),
  reviewAdvance: vi.fn(),
  logExpenseAdvance: vi.fn(),
  ...calls,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { PayrollPage, periodPhase, monthLabel } = await import("./payroll-page");

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
  payslipsError = null;
  payslipsById = {};
  previewById = {};
  previewError = null;
  failing = {};
  refetchFailing = {};
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  for (const f of Object.values(calls)) f.mockClear();
  adjustments = [];
  expenses = [];
  isOwner = false;
  expenseCalls.clear.mockClear();
  expenseCalls.reassign.mockClear();
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

describe("PayrollPage history: never frozen when it wasn't (H2)", () => {
  const july = { ...period("draft"), id: "p1", name: "26 Jul – 25 Aug 2026", start_date: "2026-07-26", end_date: "2026-08-25" };

  it("a past month never approved opens with its preview and Approve, not 'frozen' (H2-D14, H2-P1)", async () => {
    current = { ...current!, history: [july] } as unknown as CurrentPayroll;
    previewById = { p1: [slip("e1", "Sara Ahmed", { net_piastres: 700_000 })] };
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /History/ }));
    await user.click(await screen.findByText("26 Jul – 25 Aug 2026"));
    expect(screen.queryByText("Frozen when payroll was approved.")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("tab", { name: /Payslips/ }));
    expect(await screen.findByText("7,000.00", { exact: false })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve payroll" }));
    await waitFor(() => expect(calls.generatePeriod).toHaveBeenCalledWith("p1"));
  });

  it("a month's payslips that fail to load say so (H2-D14)", async () => {
    current = { ...current!, history: [{ ...july, status: "paid" }] } as unknown as CurrentPayroll;
    payslipsError = new Error("boom");
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /History/ }));
    await user.click(await screen.findByText("26 Jul – 25 Aug 2026"));
    expect(await screen.findByText("Couldn't load this month's payslips")).toBeInTheDocument();
  });
});

describe("the unsettled month's name (A5)", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });
  it("is the month and year only when the period is exactly a calendar month", async () => {
    expect(monthLabel("2026-08-01", "2026-08-31")).toBe("Aug 2026");
    expect(monthLabel("2026-02-01", "2026-02-28")).toBe("Feb 2026");
    expect(monthLabel("2026-08-01", "2026-08-25")).toMatch(/→/);
    expect(monthLabel("2026-07-26", "2026-08-25")).toMatch(/→/);
    await i18n.changeLanguage("ar");
    expect(monthLabel("2026-08-01", "2026-08-31")).toBe("أغسطس 2026");
  });
});

describe("PayrollPage: a failed list never reads as an empty one (H3)", () => {
  it.each([
    ["adjustments", /Bonuses & deductions/, "No bonuses or deductions"],
    ["advances", /Salary advances/, "No salary advances"],
    ["expenses", /Expense advances/, "Nothing logged"],
  ])("%s", async (name, tab, emptyText) => {
    failing = { [name]: new Error("boom") };
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: tab }));
    expect(await screen.findByRole("button", { name: /Retry|Try again/ })).toBeInTheDocument();
    expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
  });
});

describe("PayrollPage: a refresh that fails keeps what was on screen (429)", () => {
  it("the payslips and the pay lines stay when their refetch is refused", async () => {
    refetchFailing = { current: new Error("429"), adjustments: new Error("429") };
    adjustments = [{ id: "a1", kind: "bonus", employee_id: "e1", employee_name: "Sara Ahmed", amount_piastres: 10_000, reason: "Extra hours", status: "approved", effective_date: "2026-09-10", created_at: "2026-09-10T08:00:00Z" }];
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    expect(screen.getAllByText("Sara Ahmed").length).toBeGreaterThan(0);
    expect(screen.queryByText("Couldn't load payroll")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(await screen.findByText(/Extra hours/)).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the bonuses and deductions")).not.toBeInTheDocument();
  });
});

describe("PayrollPage: an older month not fully paid (H2-P1)", () => {
  const july = { ...period("draft"), id: "p1", name: "26 Jul – 25 Aug 2026", start_date: "2026-07-26", end_date: "2026-08-25" };
  const unsettled = (status: string, paid = 0) => ({
    period_id: "p1", starts_on: "2026-07-26", ends_on: "2026-08-25", status, net_total_piastres: 1_625_000, paid_count: paid, people: 2,
  });
  const frozen = (u: string, n: string, paid: string | null) =>
    ({ ...slip(u, n), id: `s-${u}`, employee_name: n, paid_method: paid, payroll_period_id: "p1" }) as unknown as Payslip;
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("a draft month left behind has a banner that opens it, and it is approved by its own id", async () => {
    current = { ...current!, history: [july], unsettled: [unsettled("draft")] } as unknown as CurrentPayroll;
    previewById = { p1: [slip("e1", "Sara Ahmed"), slip("e4", "Youssef Adel")] };
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    const banner = screen.getByRole("alert", { name: /isn't fully paid yet/ });
    expect(within(banner).getByText(/never approved/)).toBeInTheDocument();
    await user.click(within(banner).getByRole("button", { name: /Open/ }));
    // The page now shows that month: its range, its preview, and Approve for it.
    expect(screen.getByText(/You're looking at an earlier month/)).toBeInTheDocument();
    expect(enabledSeen.preview.some(Boolean)).toBe(true);
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve payroll" }));
    await waitFor(() => expect(calls.generatePeriod).toHaveBeenCalledWith("p1"));
    expect(calls.generatePeriod).not.toHaveBeenCalledWith("p2");
    // And back to this month.
    await user.click(screen.getByRole("button", { name: /Back to this month/ }));
    expect(screen.queryByText(/You're looking at an earlier month/)).not.toBeInTheDocument();
  });

  it("an approved month someone is still owed from is marked paid, exported and reopened by its own id", async () => {
    current = { ...current!, history: [{ ...july, status: "generated" }], unsettled: [unsettled("generated")] } as unknown as CurrentPayroll;
    payslipsById = { p1: [frozen("e1", "Sara Ahmed", null), frozen("e4", "Youssef Adel", null)] };
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    const banner = screen.getByRole("alert", { name: /isn't fully paid yet/ });
    expect(within(banner).getByText(/Paid 0 of 2/)).toBeInTheDocument();
    await user.click(within(banner).getByRole("button", { name: /Open/ }));
    expect(screen.getByRole("button", { name: /Reopen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay lists/ })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Mark paid" })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Mark paid" }));
    await waitFor(() => expect(calls.markPaid).toHaveBeenCalledWith("p1", "e1", { method: "bank" }));
  });

  it("an older month's failed read says so, never an empty list", async () => {
    current = { ...current!, history: [july], unsettled: [unsettled("draft")] } as unknown as CurrentPayroll;
    previewError = new Error("boom");
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(within(screen.getByRole("alert", { name: /isn't fully paid yet/ })).getByRole("button", { name: /Open/ }));
    expect(await screen.findByText("Couldn't load payroll")).toBeInTheDocument();
    expect(screen.queryByText("Nobody on payroll yet")).not.toBeInTheDocument();
  });

  it("works on a server without `unsettled`: a past month still draft or approved is found in history", () => {
    current = { ...current!, history: [{ ...july, status: "generated" }, { ...july, id: "p0", name: "Old", start_date: "2026-06-26", end_date: "2026-07-25", status: "paid" }] } as unknown as CurrentPayroll;
    wrap(<PayrollPage />);
    expect(screen.getAllByRole("alert", { name: /isn't fully paid yet/ })).toHaveLength(1);
  });

  it("shows no banner when every older month is paid", () => {
    current = { ...current!, history: [{ ...july, status: "paid" }], unsettled: [] } as unknown as CurrentPayroll;
    wrap(<PayrollPage />);
    expect(screen.queryByRole("alert", { name: /isn't fully paid yet/ })).not.toBeInTheDocument();
  });

  it("says it in Arabic", async () => {
    await i18n.changeLanguage("ar");
    current = { ...current!, history: [july], unsettled: [unsettled("draft")] } as unknown as CurrentPayroll;
    wrap(<PayrollPage />);
    const banner = screen.getByRole("alert");
    expect(banner.textContent).toMatch(/[؀-ۿ]/);
    expect(banner.textContent).not.toMatch(/isn't|never approved|Open/);
    await i18n.changeLanguage("en");
  });
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
    // Each row reads as an estimate, and so does the current step (UX-P).
    expect(screen.getAllByText("Estimate").length).toBe(3);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Estimate");
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve payroll" }));
    await waitFor(() => expect(calls.generatePeriod).toHaveBeenCalledWith("p2"));
  });

  it("says what approving does to whom and for how much before it goes (UX-P)", async () => {
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/people, .* net in total\. Every payslip is frozen/)).toBeInTheDocument();
    expect(calls.generatePeriod).not.toHaveBeenCalled();
  });

  it("warns before approving a month whose last days are still to come (BC-3 decision a, Q-payroll-1)", async () => {
    const { isoDaysFromToday } = await import("@/features/staff/util");
    const user = userEvent.setup();
    current = { ...current!, period: { ...period("draft"), end_date: isoDaysFromToday(5) } };
    const { unmount } = wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    const dialog = await screen.findByRole("alertdialog");
    // Today and the five days after it: nobody can clock in on them once it's approved.
    expect(within(dialog).getByText(/6 days of this month are still to come/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    unmount();
    // In Arabic too.
    await i18n.changeLanguage("ar");
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /اعتماد/ }));
    expect(within(await screen.findByRole("alertdialog")).getByText(/6/)).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });

  it("says nothing about days to come once the month has ended", async () => {
    const { isoDaysFromToday } = await import("@/features/staff/util");
    const user = userEvent.setup();
    current = { ...current!, period: { ...period("draft"), end_date: isoDaysFromToday(-1) } };
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("button", { name: /Approve payroll/ }));
    expect(within(await screen.findByRole("alertdialog")).queryByText(/still to come/)).not.toBeInTheDocument();
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
    // What is being recorded, and that the first payment ends reopening (UX-P).
    expect(within(dialog).getByText(/to Sara Ahmed, recorded as handed over\. This is the first payment/)).toBeInTheDocument();
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

  it("a pay line refused for a paid month asks for an open month, not a day (A5)", async () => {
    const { AxiosError, AxiosHeaders } = await import("axios");
    calls.createAdjustment.mockImplementationOnce(async () => {
      throw new AxiosError("x", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data: { code: "PERIOD_CLOSED", error: "x", vars: { paid: true } },
      });
    });
    const { toast } = await import("sonner");
    const toastError = vi.spyOn(toast, "error");
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getAllByText("Youssef Adel")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Bonus" }));
    const form = (await screen.findAllByRole("dialog")).at(-1)!;
    await user.type(within(form).getByLabelText("Amount (EGP)"), "100");
    await user.type(within(form).getByLabelText("Reason"), "Eid");
    await user.click(within(form).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls.at(-1)![0]).toMatch(/open month/);
    expect(toastError.mock.calls.at(-1)![0]).not.toMatch(/day/);
    toastError.mockRestore();
  });

  it("marks everyone paid from the first page: unpaid payslips come first (A5)", () => {
    const frozen = (u: string, n: string, paid: string | null) =>
      ({ ...slip(u, n), id: `s-${u}`, employee_name: n, paid_method: paid, payroll_period_id: "p2" }) as unknown as Payslip;
    const names = ["Adel", "Basma", "Camilia", "Dina", "Emad", "Fady", "Gamal", "Hoda", "Islam", "Karim", "Laila", "Mona"];
    // By name the two unpaid ones (Laila, Mona) would sit on page 2.
    current = { ...current!, period: period("generated"), paid_count: 10, payslips: names.map((n, i) => frozen(`e${i}`, n, i < 10 ? "cash" : null)) };
    wrap(<PayrollPage />);
    expect(screen.getAllByRole("button", { name: "Mark paid" })).toHaveLength(2);
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

  it("a Stop refused for want of a reason says why in the Stop's own words (A5)", async () => {
    const { AxiosError, AxiosHeaders } = await import("axios");
    calls.stopAdjustment.mockImplementationOnce(async () => {
      throw new AxiosError("x", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data: { code: "REASON_REQUIRED", error: "Stopping a monthly line needs a reason" },
      });
    });
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
    const { toast } = await import("sonner");
    const toastError = vi.spyOn(toast, "error");
    await user.type(within(dialog).getByLabelText("Reason"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Stop" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/Say why this monthly line stops/)));
    toastError.mockRestore();
  });

  it("D6: Stop says this month keeps the line, and a stopped line stays active until its month ends", async () => {
    const { todayIso, isoDaysFromToday } = await import("@/features/staff/util");
    const { fmtDate } = await import("@/lib/format");
    const user = userEvent.setup();
    const line = {
      kind: "bonus", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 30_000, percent_of_base: null,
      value_piastres: 30_000, reason: "Meal allowance", effective_date: "2026-09-01", source: "manual", status: "approved", recurring: true,
    };
    const end = isoDaysFromToday(6);
    adjustments = [
      { ...line, id: "b1", ends_on: null },
      // Stopped today: it still counts this month (owner decision 6).
      { ...line, id: "b2", reason: "Transport", ends_on: end, stopped_at: `${todayIso()}T10:00:00Z`, stop_reason: "Moved nearby" },
      { ...line, id: "b3", reason: "Old allowance", ends_on: "2026-06-25", stopped_at: "2026-06-10T10:00:00Z" },
    ];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(screen.getAllByRole("button", { name: "Stop" })).toHaveLength(1);
    expect(screen.getByText(`monthly until ${fmtDate(end)}`)).toBeInTheDocument();
    expect(screen.getByText("stopped")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/This month keeps it/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/stops from the month that is open now/)).not.toBeInTheDocument();
  });

  it("D7: a manager reads each person's advances as within or over the cap, never the cap", async () => {
    const user = userEvent.setup();
    held = ["hr.payroll.read", "hr.advances.decide"];
    const adv = { employee_id: "e4", employee_name: "Youssef Adel", installments: 1, created_at: "2026-09-20T08:00:00Z", remaining_piastres: 0, monthly_installment_piastres: 0, org_id: "o", updated_at: "" };
    advances = [
      { ...adv, id: "v1", amount_piastres: 50_000, status: "approved", remaining_piastres: 50_000, outstanding_piastres: 50_000, cap_piastres: null, within_cap: true },
      { ...adv, id: "v2", amount_piastres: 90_000, status: "pending", outstanding_piastres: 140_000, cap_piastres: null, within_cap: false },
    ];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Salary advances/ }));
    expect(screen.getByText("Within cap")).toBeInTheDocument();
    expect(screen.getByText("Over the cap: only the owner can approve")).toBeInTheDocument();
    expect(screen.queryByText(/Owes /)).not.toBeInTheDocument();
    advances = [];
  });

  it("D8: the owner rejects a pending pay line only with a reason, and the list shows why", async () => {
    const user = userEvent.setup();
    held = ["hr.payroll.read", "hr.payroll.run", "hr.adjustments.create"];
    const line = {
      kind: "bonus", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 150_000, percent_of_base: null,
      value_piastres: 150_000, reason: "Best month", effective_date: "2026-09-01", source: "manual", recurring: false, ends_on: null,
    };
    adjustments = [
      { ...line, id: "a2", status: "pending" },
      { ...line, id: "a3", status: "rejected", reason: "Extra shift", decision_note: "Already paid as overtime" },
    ];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(screen.getByText(/Already paid as overtime/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Reject" }));
    expect(await within(dialog).findByText("A reason is needed")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Reason"), "Not agreed");
    await user.click(within(dialog).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(decideAdjustment).toHaveBeenCalledWith("bonus", "a2", { approve: false, reason: "Not agreed" }));
    adjustments = [];
  });

  it("D9: flags people on payroll with no salary, and won't approve until it's set", () => {
    held = ["hr.payroll.read", "hr.payroll.run"];
    current = {
      ...current!,
      preview: [
        slip("e1", "Sara Ahmed"),
        { ...slip("e4", "Youssef Adel", { base_piastres: 0, base_salary_piastres: 0, net_piastres: 0 }), salary_missing: true },
      ],
      missing_salary_count: 1,
      totals: { ...current!.totals, missing_salary_count: 1 },
    } as unknown as CurrentPayroll;
    wrap(<PayrollPage />);
    const banner = screen.getByRole("alert");
    expect(within(banner).getByText(/1 person on payroll has no salary/)).toBeInTheDocument();
    expect(within(banner).getByText(/Youssef Adel/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve payroll/ })).toBeDisabled();
    expect(screen.getByText("Not set")).toBeInTheDocument();
    // The fix is one click away, and the next step says to fix it first (UX-P).
    expect(within(banner).getByRole("link", { name: "Set salaries on Employees" })).toHaveAttribute("href", "/staff/employees");
    expect(screen.getByText(/Fix what is listed below, then approve/)).toBeInTheDocument();
  });

  describe("M39: correcting a till-tagged expense advance (owner decision 39)", () => {
    const till = { id: "x1", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 20_000, purpose: "Milk", via: "till", given_on: "2026-09-20", branch_id: "b1", created_at: "", handed_by_name: "Karim" };
    const safe = { ...till, id: "x2", via: "safe", purpose: "Cups" };

    it("the owner clears a till tag with a reason; the pay-out stays", async () => {
      isOwner = true;
      expenses = [till, safe];
      const user = userEvent.setup();
      wrap(<PayrollPage />);
      await user.click(screen.getByRole("tab", { name: /Expense advances/ }));
      // Only the till-tagged one can be corrected here (a hand-logged one is the log itself).
      expect(screen.getAllByRole("button", { name: "Correct the tag" })).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "Correct the tag" }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText(/The cash that left the till stays as it is/)).toBeInTheDocument();
      await user.click(within(dialog).getByRole("radio", { name: "Clear the tag" }));
      await user.click(within(dialog).getByRole("button", { name: "Save" }));
      expect(await within(dialog).findByText("A reason is needed")).toBeInTheDocument();
      expect(expenseCalls.clear).not.toHaveBeenCalled();
      await user.type(within(dialog).getByLabelText("Reason"), "Not an advance: shop milk");
      await user.click(within(dialog).getByRole("button", { name: "Save" }));
      await waitFor(() => expect(expenseCalls.clear).toHaveBeenCalledWith("x1", { reason: "Not an advance: shop milk" }));
    });

    it("the owner reassigns a till tag to someone else, with a reason", async () => {
      isOwner = true;
      expenses = [till];
      const user = userEvent.setup();
      wrap(<PayrollPage />);
      await user.click(screen.getByRole("tab", { name: /Expense advances/ }));
      await user.click(screen.getByRole("button", { name: "Correct the tag" }));
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
      await user.click(await screen.findByRole("option", { name: "Sara Ahmed" }));
      await user.type(within(dialog).getByLabelText("Reason"), "Sara took it, not Youssef");
      await user.click(within(dialog).getByRole("button", { name: "Save" }));
      await waitFor(() => expect(expenseCalls.reassign).toHaveBeenCalledWith("x1", { employee_id: "e1", reason: "Sara took it, not Youssef" }));
    });

    it("a manager isn't offered it", async () => {
      held = ["hr.payroll.read", "hr.expense_advances.log"];
      expenses = [till];
      const user = userEvent.setup();
      wrap(<PayrollPage />);
      await user.click(screen.getByRole("tab", { name: /Expense advances/ }));
      expect(screen.getByText("Youssef Adel")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Correct the tag" })).not.toBeInTheDocument();
    });
  });

  it("M30: rule-made lines say which rule made them, and the empty list doesn't claim only hand-made lines", async () => {
    const user = userEvent.setup();
    const base = { kind: "deduction", employee_id: "e4", employee_name: "Youssef Adel", percent_of_base: null, effective_date: "2026-09-18", status: "approved", recurring: false, ends_on: null, reason_code: null, reason_vars: null };
    adjustments = [
      { ...base, id: "d1", amount_piastres: 3_125, value_piastres: 3_125, reason: "Late by 24 minutes", source: "late_penalty" },
      { ...base, id: "d2", amount_piastres: 20_000, value_piastres: 20_000, reason: "Absent", source: "absence" },
      { ...base, id: "d3", amount_piastres: 5_000, value_piastres: 5_000, reason: "Broken glassware", source: "manual" },
    ];
    const { unmount } = wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(screen.getByText("Rule · late")).toBeInTheDocument();
    expect(screen.getByText("Rule · absence")).toBeInTheDocument();
    expect(screen.getAllByText(/^Rule · /)).toHaveLength(2);
    unmount();
    adjustments = [];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(screen.queryByText(/Lines added by hand show here/)).not.toBeInTheDocument();
    expect(screen.getByText(/the ones the rules make/)).toBeInTheDocument();
  });

  it("M27: after an early approval, a new line defaults to next month (the first open one)", async () => {
    current = { ...current!, period: period("generated") } as unknown as CurrentPayroll;
    const user = userEvent.setup();
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    await user.click(screen.getByRole("button", { name: /Add a bonus or deduction/ }));
    const dialog = await screen.findByRole("dialog");
    // The period 26 Aug – 25 Sep is approved: the line lands in the next one.
    expect(within(dialog).getByLabelText("Counts in the month of")).toHaveValue("2026-10");
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
    await user.click(screen.getByRole("button", { name: /Pay lists/ }));
    await waitFor(() => expect(excel).toHaveBeenCalled());
    const cfg = excel.mock.calls[0][0] as { sheets: { name: string; rows: { employee_id: string }[]; columns: { header: string }[] }[] };
    // Sara is paid by bank but has nothing to receive; Youssef is paid in cash.
    const [bank, wallet, cash] = cfg.sheets;
    expect([...bank.rows, ...wallet.rows]).toEqual([]);
    // M31: the cash list for pay envelopes, name and amount, nobody with nothing to pay.
    expect(cash.name).toBe("Cash");
    expect(cash.rows.map((r) => r.employee_id)).toEqual(["e4"]);
    expect(cash.columns.map((c) => c.header)).toEqual(["Name", "Net"]);
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

  it("words a rule-made line in the reader's language from its code, not the server's English (AT-13)", async () => {
    // E2E payroll (L-27/L-29): the Bonuses & deductions tab showed "Absent — no check-in recorded" in Arabic.
    const user = userEvent.setup();
    adjustments = [
      { id: "d9", kind: "deduction", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 3_125, percent_of_base: null, value_piastres: 3_125,
        reason: "SERVER TEXT late", reason_code: "late", reason_vars: { minutes: 24 }, effective_date: "2026-09-18", source: "late_penalty", status: "approved", recurring: false, ends_on: null },
      { id: "d8", kind: "deduction", employee_id: "e4", employee_name: "Youssef Adel", amount_piastres: 20_000, percent_of_base: null, value_piastres: 20_000,
        reason: "Broken glassware", reason_code: null, reason_vars: null, effective_date: "2026-09-05", source: "manual", status: "approved", recurring: false, ends_on: null },
    ];
    wrap(<PayrollPage />);
    await user.click(screen.getByRole("tab", { name: /Bonuses & deductions/ }));
    expect(screen.getByText(/Late by 24 minutes/)).toBeInTheDocument();
    expect(screen.queryByText(/SERVER TEXT/)).not.toBeInTheDocument();
    expect(screen.getByText(/Broken glassware/)).toBeInTheDocument();
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
              { id: "d1", reason: "Late arrival", piastres: 5_000, source: "late_penalty", waived: true, waive_reason: "Metro <stopped>" },
              { id: "d2", reason: "Broke <b>a</b> glass", piastres: 15_000, source: "manual" },
              { id: "d5", reason: "Absent", piastres: 10_000, source: "absence", override_reason: "Half: he called in" },
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
    // M29: why it was waived (AD-6).
    expect(within(sheet).getByText("Waived: Metro <stopped>")).toBeInTheDocument();
    expect(within(sheet).getByText("Overridden: Half: he called in")).toBeInTheDocument();
    // Only the overridden (live) rule line can be waived; the waived one offers no second waiver.
    expect(within(sheet).getAllByRole("button", { name: "Waive" })).toHaveLength(1);

    await user.click(within(sheet).getByRole("button", { name: /Download PDF/ }));
    expect(open).toHaveBeenCalled();
    const html = doc.write.mock.calls[0][0] as string;
    expect(html).toContain("Madar Coffee");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("line-through");
    // A reason someone typed is text, never markup.
    expect(html).toContain("Broke &lt;b&gt;a&lt;/b&gt; glass");
    expect(html).toContain("Waived: Metro &lt;stopped&gt;");
    await waitFor(() => expect(win.print).toHaveBeenCalled());
    open.mockRestore();
  });
});
