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
  createWorkShift: vi.fn(),
  updateWorkShift: vi.fn(),
  patchBranch: (...a: unknown[]) => patchBranch(...(a as [])),
  putAttendanceSettings: (...a: unknown[]) => putSettings(...(a as [])),
}));
const patchBranch = vi.fn(async () => ({}));
const putSettings = vi.fn(async () => ({}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { SetupPage } = await import("./setup-page");
const { NAV, isParent, leafVisible } = await import("@/config/nav");
const { authzFrom } = await import("@/data/authz/use-authz");

const wrap = () => render(<QueryClientProvider client={new QueryClient()}><SetupPage /></QueryClientProvider>);

beforeEach(() => {
  failing = {};
  owner = true;
  held = ["hr.rules.edit", "branches.edit", "hr.staff.create", "hr.schedule.create"];
  patchBranch.mockClear();
  putSettings.mockClear();
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
  it("shows n of 4 and opens on the first step that isn't done", () => {
    wrap();
    expect(screen.getByText("1 of 4 done")).toBeInTheDocument();
    expect(screen.getByTestId("step-shifts")).toHaveAttribute("data-done", "true");
    expect(within(screen.getByTestId("step-branches")).getByRole("button")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("heading", { name: "Where is each branch?" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("pins a branch from a pasted Google Maps link, 200 m by default, with the branch's own PATCH", async () => {
    const user = userEvent.setup();
    wrap();
    // The first branch that isn't pinned is open; the pinned one is ticked.
    const maadi = screen.getByTestId("pin-b2");
    expect(within(screen.getByTestId("pin-b1")).getByText(/Pinned, 80 m around it/)).toBeInTheDocument();
    const paste = within(maadi).getByLabelText(/paste a Google Maps link/);
    await user.type(paste, "https://maps.app.goo.gl/abc");
    expect(within(maadi).getByRole("alert")).toHaveTextContent(/short share link/);
    await user.clear(paste);
    await user.click(paste);
    await user.paste("https://www.google.com/maps/place/X/@29.9,31.2,17z/data=!3d29.960123!4d31.250456");
    expect(within(maadi).getByText("29.96012, 31.25046")).toBeInTheDocument();
    expect(within(maadi).getByRole("link", { name: /Check it on Google Maps/ })).toHaveAttribute("href", "https://www.google.com/maps?q=29.960123,31.250456");
    expect(within(maadi).getByLabelText(/How far from the pin/)).toHaveValue("200");
    await user.click(within(maadi).getByRole("button", { name: "Pin Maadi" }));
    expect(patchBranch).toHaveBeenCalledWith("b2", { latitude: 29.960123, longitude: 31.250456, geo_radius_meters: 200 });
  });

  it("uses the device's location, and says how to fix a refusal", async () => {
    const user = userEvent.setup();
    let fail = false;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback, err: PositionErrorCallback) =>
          fail
            ? err({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
            : ok({ coords: { latitude: 30.0612345, longitude: 31.2198765, accuracy: 25 } } as GeolocationPosition),
      },
    });
    wrap();
    const maadi = screen.getByTestId("pin-b2");
    await user.click(within(maadi).getByRole("button", { name: "Use my location" }));
    expect(within(maadi).getByText("30.06123, 31.21988")).toBeInTheDocument();
    fail = true;
    await user.click(within(maadi).getByRole("button", { name: "Use my location" }));
    expect(within(maadi).getByRole("alert")).toHaveTextContent(/Location is blocked for this site/);
  });

  it("explains a disabled pin instead of failing on save", () => {
    held = ["hr.rules.edit"];
    wrap();
    expect(screen.getByRole("note")).toHaveTextContent(/needs the right to edit branches/);
    expect(within(screen.getByTestId("pin-b2")).getByRole("button", { name: "Pin Maadi" })).toBeDisabled();
  });

  it("walks the steps with Next and Back; an empty step says what to do next", async () => {
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByRole("button", { name: /Next: People/ }));
    expect(screen.getByRole("heading", { name: "Who works here?" })).toBeInTheDocument();
    expect(screen.getByText("Nobody here yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add employee/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("names people whose salary isn't set, and why it matters", async () => {
    const user = userEvent.setup();
    data.employees = [
      { id: "e1", name: "Sara", employment_status: "active", salary_set: true },
      { id: "e2", name: "Omar", employment_status: "active", salary_set: false },
    ];
    wrap();
    await user.click(within(screen.getByTestId("step-employees")).getByRole("button"));
    expect(screen.getByText("Omar")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/1 person has no salary set.*payroll can't be approved/);
  });

  it("saves the suggested rules in one step, with worked examples in money", async () => {
    const user = userEvent.setup();
    data.settings = {
      rules_saved_at: null, late_deduction_tiers: [], working_days_per_month: 30, absence_deduction_days: 1,
      suggested_tiers: [
        { from_minutes: 1, to_minutes: 15, kind: "minutes", value: 15 },
        { from_minutes: 16, to_minutes: 30, kind: "day_fraction", value: 0.25 },
      ],
    };
    wrap();
    await user.click(within(screen.getByTestId("step-rules")).getByRole("button"));
    expect(screen.getByRole("heading", { name: "What does lateness cost?" })).toBeInTheDocument();
    // 0.25 of a day on EGP 12,000 / 30 days.
    expect(screen.getByText("EGP 100.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save these rules" }));
    expect(putSettings).toHaveBeenCalledWith(expect.objectContaining({
      late_deduction_tiers: [
        { from_minutes: 1, to_minutes: 15, kind: "minutes", value: 15 },
        { from_minutes: 16, to_minutes: 30, kind: "day_fraction", value: 0.25 },
      ],
      absence_deduction_days: 1,
      overtime_mode: "off",
    }));
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
