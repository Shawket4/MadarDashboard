/**
 * Set-up (SA-4): each step is done from real data — pinned branches, an
 * active employee, an active shift, saved rules — the page counts them, and
 * the nav entry is the owner's only while something is left.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupProgress } from "./setup";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const pinned = { id: "b1", name: "Zamalek", latitude: 30.06, longitude: 31.22, geo_radius_meters: 80 };
const unpinned = { id: "b2", name: "Maadi", latitude: 29.96, longitude: 31.25, geo_radius_meters: null };
let owner = true;
let held: string[] = ["hr.rules.edit"];
let data: Record<string, unknown> = {};
// A read that failed: its error, and the refetch the Retry button must call.
let failing: Record<string, { error: Error; refetch: () => void }> = {};

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, search, children }: { to: string; search?: { edit?: string }; children: ReactNode }) => (
    <a href={search?.edit ? `${to}?edit=${search.edit}` : to}>{children}</a>
  ),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner, platform: false, role_kinds: [],
        capabilities: held as never, ask_manager: [], limits: {},
      }),
  };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: () => failing.branches ?? { data: data.branches, refetch: vi.fn() },
  useListEmployees: () => failing.employees ?? { data: data.employees, refetch: vi.fn() },
  useListWorkShifts: () => failing.shifts ?? { data: data.shifts, refetch: vi.fn() },
  useGetAttendanceSettings: () => failing.settings ?? { data: data.settings, refetch: vi.fn() },
  useLinkableUsers: () => ({ data: [] }),
  createEmployee: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { SetupPage } = await import("./setup-page");
const { NAV, isParent, leafVisible } = await import("@/config/nav");
const { authzFrom } = await import("@/data/authz/use-authz");

const wrap = () => render(<QueryClientProvider client={new QueryClient()}><SetupPage /></QueryClientProvider>);

beforeEach(() => {
  failing = {};
  owner = true;
  held = ["hr.rules.edit"];
  data = {
    branches: [pinned, unpinned],
    employees: [],
    shifts: [{ is_active: false }, { is_active: true }],
    settings: { rules_saved_at: null },
  };
});

describe("setupProgress", () => {
  it("counts only what the data shows done", () => {
    const p = setupProgress(data);
    expect(p).toMatchObject({ ready: true, count: 1, complete: false, done: { branches: false, employees: false, shifts: true, rules: false } });
  });

  it("needs every branch pinned, a live employee, and saved rules", () => {
    const p = setupProgress({
      branches: [pinned],
      employees: [{ employment_status: "terminated" }, { employment_status: "active" }],
      shifts: [{ is_active: true }],
      settings: { rules_saved_at: "2026-09-01T00:00:00Z" },
    });
    expect(p).toMatchObject({ count: 4, complete: true });
    expect(setupProgress({ branches: [], employees: [], shifts: [], settings: {} }).done.branches).toBe(false);
    expect(setupProgress({ branches: [pinned] }).ready).toBe(false);
  });
});

describe("SetupPage", () => {
  it("shows n of 4, and each missing step opens the screen that does it", async () => {
    const user = userEvent.setup();
    wrap();
    expect(screen.getByText("1 of 4 done")).toBeInTheDocument();
    expect(screen.getByTestId("step-shifts")).toHaveAttribute("data-done", "true");
    const branches = screen.getByTestId("step-branches");
    expect(within(branches).getByRole("link", { name: /Pin Maadi/ })).toHaveAttribute("href", "/branches?edit=b2");
    expect(within(branches).queryByRole("link", { name: /Pin Zamalek/ })).not.toBeInTheDocument();
    expect(within(screen.getByTestId("step-rules")).getByRole("link", { name: "Set the rules" })).toHaveAttribute("href", "/staff/rules");
    await user.click(within(screen.getByTestId("step-employees")).getByRole("button", { name: /Add employee/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("says so when a read fails, with a Retry that asks again, instead of an endless skeleton (E2E D-027, O-9)", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    delete data.shifts;
    failing = { shifts: { error: new Error("Request failed with status code 500"), refetch } };
    wrap();
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load the set-up checklist");
    expect(screen.queryByTestId("step-branches")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Retry/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("says so when everything is done", () => {
    data = { ...data, branches: [pinned], employees: [{ employment_status: "active" }], settings: { rules_saved_at: "x" } };
    wrap();
    expect(screen.getByText("4 of 4 done")).toBeInTheDocument();
    expect(screen.getByText(/All set/)).toBeInTheDocument();
  });

  it("is for whoever holds hr.rules.edit, not a role (DSH-6)", () => {
    // An owner who gave the rules away no longer runs set-up...
    held = [];
    const { unmount } = wrap();
    expect(screen.getByText(/Set-up is for whoever sets the rules/)).toBeInTheDocument();
    unmount();
    // ...and a non-owner who was given them does.
    owner = false;
    held = ["hr.rules.edit"];
    wrap();
    expect(screen.queryByText(/Set-up is for whoever sets the rules/)).toBeNull();
    expect(screen.getByTestId("step-branches")).toBeInTheDocument();
  });

  it("puts the nav entry up for hr.rules.edit only while set-up is incomplete", () => {
    const leaf = NAV.flatMap((g) => g.entries).flatMap((e) => (isParent(e) ? e.children : [e])).find((l) => l.to === "/staff/setup")!;
    const me = (o: boolean, caps: string[]) => authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: o, platform: false, role_kinds: [], capabilities: caps as never, ask_manager: [], limits: {} });
    expect(leafVisible(leaf, me(true, ["hr.rules.edit"]), ["dawam"], true)).toBe(true);
    expect(leafVisible(leaf, me(true, ["hr.rules.edit"]), ["dawam"], false)).toBe(false);
    expect(leafVisible(leaf, me(false, ["hr.rules.edit"]), ["dawam"], true)).toBe(true);
    expect(leafVisible(leaf, me(true, []), ["dawam"], true)).toBe(false);
    expect(leafVisible(leaf, me(true, ["hr.rules.edit"]), ["pos"], true)).toBe(false);
  });
});
