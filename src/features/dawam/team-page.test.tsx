/**
 * The team board: the right people see it, a flag is handled the way the
 * manager chose (the typed amount for a deduction, CL-7; nothing charged by
 * itself, CL-6), a new phone can be revoked, and a punch for someone needs a
 * reason (CL-13).
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

let held: string[] = [];
const enabledSeen: Record<string, boolean[]> = {};
const querySeen: Record<string, Record<string, unknown> | undefined> = {};
const resolveFlag = vi.fn(async () => ({}));
const punchFor = vi.fn(async () => ({}));
const createAdjustment = vi.fn(async () => ({}));
const logExpenseAdvance = vi.fn(async () => ({}));

const failing: Record<string, Error | null> = {};
const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  querySeen[name] = opts?.query;
  const error = failing[name] ?? null;
  return { data: error ? undefined : data(), isLoading: false, isFetching: false, error, refetch: vi.fn() };
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
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b1" }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn() };
});
vi.mock("./rules-banner", () => ({ RulesFirstBanner: () => null }));
vi.mock("@/data/api/generated/api", () => ({
  useTeamPresence: hook("presence", () => ({
    business_date: "2026-09-22", present: 1, late: 1, absent: 1, on_leave: 0, planned_minutes: 0, worked_minutes: 0,
    rows: [
      { employee_id: "e1", employee_name: "Sara Ahmed", state: "in", check_in_at: "2026-09-22T05:00:00Z", late_minutes: 0, scheduled_minutes: 480, worked_minutes: 60, branch_name: "Zamalek" },
      { employee_id: "e4", employee_name: "Youssef Adel", state: "absent", late_minutes: 0, scheduled_minutes: 480, worked_minutes: 0, branch_name: "Zamalek" },
    ],
  })),
  useListAttendanceFlags: hook("flags", () => [
    { id: "f1", employee_id: "e4", employee_name: "Youssef Adel", kind: "left_mid_shift", minutes_away: 35, detected_at: "2026-09-22T14:10:00Z", resolution: null, suggested_deduction_piastres: 5_500 },
    { id: "f2", employee_id: "e5", employee_name: "Laila Hassan", kind: "new_phone", minutes_away: 0, detected_at: "2026-09-22T07:00:00Z", resolution: null, suggested_deduction_piastres: 0 },
    { id: "f3", employee_id: "e1", employee_name: "Sara Ahmed", kind: "suspicious", minutes_away: 0, detected_at: "2026-09-21T07:00:00Z", resolution: "ignored", suggested_deduction_piastres: 0 },
    { id: "f4", employee_id: "e6", employee_name: "Omar Nabil", kind: "phone_died", minutes_away: 0, detected_at: "2026-09-22T12:00:00Z", resolution: null, suggested_deduction_piastres: 0 },
  ]),
  resolveFlag: (...a: unknown[]) => resolveFlag(...(a as [])),
  punchFor: (...a: unknown[]) => punchFor(...(a as [])),
  useListEmployees: hook("employees", () => [{ id: "e4", name: "Youssef Adel" }, { id: "e6", name: "Omar Nabil", user_id: "u-me" }]),
  useListBranches: hook("branches", () => [{ id: "b1", name: "Zamalek" }]),
  createAdjustment: (...a: unknown[]) => createAdjustment(...(a as [])),
  logExpenseAdvance: (...a: unknown[]) => logExpenseAdvance(...(a as [])),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { TeamPage } = await import("./team-page");

const wrap = (node: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);

beforeEach(() => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  for (const k of Object.keys(failing)) delete failing[k];
  resolveFlag.mockClear();
  punchFor.mockClear();
  held = [
    "hr.attendance.read", "hr.attendance.edit", "hr.attendance.punch_others",
    "hr.deductions.create", "hr.staff.edit", "hr.shift_cover.confirm",
  ];
});

describe("TeamPage", () => {
  it("is closed without attendance rights, and asks for nothing", () => {
    held = [];
    wrap(<TeamPage />);
    expect(screen.getByText(/team board needs attendance rights/)).toBeInTheDocument();
    expect(enabledSeen.presence.every((e) => e === false)).toBe(true);
  });

  it("says the flags couldn't load, never 'No open flags', when their request fails", () => {
    // E2E: a 403 on /staff/flags drew "No open flags" beside the team's error.
    failing.flags = new Error("Forbidden: See attendance");
    wrap(<TeamPage />);
    expect(screen.queryByText("No open flags")).not.toBeInTheDocument();
    expect(screen.getByText("Couldn't load the flags")).toBeInTheDocument();
  });

  it("lists open flags only", () => {
    wrap(<TeamPage />);
    expect(screen.getByText("Youssef Adel · Left mid-shift")).toBeInTheDocument();
    expect(screen.getByText("Laila Hassan · New phone")).toBeInTheDocument();
    expect(screen.queryByText(/Location looks spoofed/)).not.toBeInTheDocument();
  });

  it("names a phone that died on shift as that, not as a spoofed location", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Omar Nabil · Phone likely died"));
    expect(within(await screen.findByRole("dialog")).getByText(/battery low/)).toBeInTheDocument();
  });

  it("offers nothing on the manager's own flag: someone else decides it (B-TEAM-1, OWN_DECISION)", async () => {
    const { useAuthStore } = await import("@/data/stores/auth.store");
    useAuthStore.setState({ user: { id: "u-me" } } as never);
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Omar Nabil · Phone likely died"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Someone else decides your own flags/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Ignore" })).not.toBeInTheDocument();
    useAuthStore.setState({ user: null } as never);
  });

  it("reads the own-decision refusal in Arabic", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.t("errors.codes.OWN_DECISION")).not.toMatch(/Someone else/);
    await i18n.changeLanguage("en");
    expect(i18n.t("errors.codes.OWN_DECISION")).toBe("This one is about you, so someone else has to decide it.");
  });

  it("offers money for a flag only to someone who may add deductions (AT-11)", async () => {
    held = ["hr.attendance.read", "hr.attendance.edit"];
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Youssef Adel · Left mid-shift"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Deduct" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Excuse, unpaid" })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/needs the right to add deductions/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Excuse, paid" }));
    await waitFor(() => expect(resolveFlag).toHaveBeenCalledWith("f1", { action: "excuse_paid", amount_piastres: null, reason: null }));
  });

  it("deducts the amount the manager types, suggested from the server (CL-7)", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Youssef Adel · Left mid-shift"));
    const dialog = await screen.findByRole("dialog");
    const amount = within(dialog).getByLabelText("Deduct (EGP)");
    expect(amount).toHaveValue(55);
    await user.clear(amount);
    await user.type(amount, "40");
    await user.type(within(dialog).getByLabelText("Reason (the employee sees it)"), "Left for two hours");
    await user.click(within(dialog).getByRole("button", { name: "Deduct" }));
    await waitFor(() => expect(resolveFlag).toHaveBeenCalledWith("f1", { action: "deduct", amount_piastres: 4_000, reason: "Left for two hours" }));
  });

  it("refuses a deduction of nothing, and sends nothing", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Youssef Adel · Left mid-shift"));
    const dialog = await screen.findByRole("dialog");
    const amount = within(dialog).getByLabelText("Deduct (EGP)");
    await user.clear(amount);
    await user.type(amount, "0");
    await user.click(within(dialog).getByRole("button", { name: "Deduct" }));
    expect(await within(dialog).findByText("Type an amount above zero")).toBeInTheDocument();
    expect(resolveFlag).not.toHaveBeenCalled();
  });

  it("revokes a new phone", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Laila Hassan · New phone"));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Revoke this phone" }));
    await waitFor(() => expect(resolveFlag).toHaveBeenCalledWith("f2", { action: "revoke", amount_piastres: null, reason: null }));
  });

  it("lets a manager add a pay line or log an expense from here (DSH-1)", async () => {
    const user = userEvent.setup();
    // Without the money rights, no money buttons.
    held = ["hr.attendance.read", "hr.attendance.edit", "hr.attendance.punch_others"];
    const { unmount } = wrap(<TeamPage />);
    expect(screen.queryByRole("button", { name: /Add a bonus or deduction/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Log an expense advance/ })).not.toBeInTheDocument();
    unmount();
    held = [...held, "hr.deductions.create", "hr.expense_advances.log"];
    wrap(<TeamPage />);
    await user.click(screen.getByRole("button", { name: /Add a bonus or deduction/ }));
    expect(within(await screen.findByRole("dialog")).getByText("Add a bonus or deduction")).toBeInTheDocument();
  });

  it("each flag act needs its own right, as the server checks it (PM-4)", async () => {
    const user = userEvent.setup();
    held = ["hr.attendance.read", "hr.attendance.edit"];
    const { unmount } = wrap(<TeamPage />);
    await user.click(screen.getByText("Youssef Adel · Left mid-shift"));
    let dialog = await screen.findByRole("dialog");
    // No deductions right: no amount, no Deduct, no unpaid excuse (it deducts).
    expect(within(dialog).queryByLabelText("Deduct (EGP)")).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Deduct" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Excuse, unpaid" })).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Excuse, paid" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Ignore" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByText("Laila Hassan · New phone"));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Revoke this phone" })).toBeNull();
    unmount();
  });

  it("punches someone in only with a reason (CL-13)", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByRole("button", { name: /Punch in/ }));
    const dialog = await screen.findByRole("dialog");
    const go = within(dialog).getByRole("button", { name: "Punch in" });
    expect(go).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Reason"), "Phone died");
    await user.click(go);
    await waitFor(() => expect(punchFor).toHaveBeenCalledWith({ employee_id: "e4", reason: "Phone died" }));
  });

  it("hides punching from someone without the right", () => {
    held = ["hr.attendance.read"];
    wrap(<TeamPage />);
    expect(screen.queryByRole("button", { name: /Punch/ })).not.toBeInTheDocument();
  });

  it("offers adding people only to someone who may create HR records (DSH-7)", () => {
    const { unmount } = wrap(<TeamPage />);
    expect(screen.queryByRole("button", { name: /Add employee/ })).not.toBeInTheDocument();
    unmount();
    held = [...held, "hr.staff.create"];
    wrap(<TeamPage />);
    expect(screen.getByRole("button", { name: /Add employee/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import from a spreadsheet/ })).toBeInTheDocument();
  });

  it("stays current: the board polls, both lists refetch when the tab comes back, and the header refreshes", () => {
    // Even someone with nothing to add gets the Refresh button.
    held = ["hr.attendance.read"];
    const { container } = wrap(<TeamPage />);
    expect(querySeen.presence).toMatchObject({ enabled: true, refetchInterval: 60_000, refetchOnWindowFocus: true });
    expect(querySeen.flags).toMatchObject({ enabled: true, refetchOnWindowFocus: true });
    const header = container.querySelector<HTMLElement>('[data-slot="page-header"]')!;
    expect(within(header).getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
