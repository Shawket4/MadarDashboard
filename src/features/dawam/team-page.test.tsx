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
const resolveFlag = vi.fn(async () => ({}));
const punchFor = vi.fn(async () => ({}));

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
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b1" }) }));
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
  ]),
  resolveFlag: (...a: unknown[]) => resolveFlag(...(a as [])),
  punchFor: (...a: unknown[]) => punchFor(...(a as [])),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { TeamPage } = await import("./team-page");

const wrap = (node: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);

beforeEach(() => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  resolveFlag.mockClear();
  punchFor.mockClear();
  held = ["hr.attendance.read", "hr.attendance.edit", "hr.attendance.punch_others"];
});

describe("TeamPage", () => {
  it("is closed without attendance rights, and asks for nothing", () => {
    held = [];
    wrap(<TeamPage />);
    expect(screen.getByText(/team board needs attendance rights/)).toBeInTheDocument();
    expect(enabledSeen.presence.every((e) => e === false)).toBe(true);
  });

  it("lists open flags only", () => {
    wrap(<TeamPage />);
    expect(screen.getByText("Youssef Adel · Left mid-shift")).toBeInTheDocument();
    expect(screen.getByText("Laila Hassan · New phone")).toBeInTheDocument();
    expect(screen.queryByText(/Location looks spoofed/)).not.toBeInTheDocument();
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
    await user.click(within(dialog).getByRole("button", { name: "Deduct" }));
    await waitFor(() => expect(resolveFlag).toHaveBeenCalledWith("f1", { action: "deduct", amount_piastres: 4_000 }));
  });

  it("revokes a new phone", async () => {
    const user = userEvent.setup();
    wrap(<TeamPage />);
    await user.click(screen.getByText("Laila Hassan · New phone"));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Revoke this phone" }));
    await waitFor(() => expect(resolveFlag).toHaveBeenCalledWith("f2", { action: "revoke", amount_piastres: null }));
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
});
