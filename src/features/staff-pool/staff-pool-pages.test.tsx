/**
 * The two staff-pool screens, at the three points they have historically gone
 * wrong on other features: the capability gate (restricted page AND no request
 * at all), the org-vs-branch inheritance hint, and the empty item list that
 * means the pool is off while the switch still reads "on".
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffDrink, StaffPoolSettings, StaffPoolToday } from "@/data/api/generated/models";

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
let branchId: string | null = null;
let settings: StaffPoolSettings | undefined;
let today: StaffPoolToday | undefined;
let drinks: StaffDrink[] = [];
const enabledSeen: Record<string, boolean[]> = {};

const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as
    | { query?: { enabled?: boolean } }
    | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  return {
    data: data(),
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
};

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u",
        epoch: 0,
        spec_version: 0,
        owner: false,
        platform: false,
        role_kinds: [],
        capabilities: held as never,
        ask_manager: [],
        limits: {},
      }),
  };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({
    branchId,
    from: "2026-09-19T00:00:00Z",
    to: "2026-09-19T12:00:00Z",
    preset: "today",
  }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useGetStaffPoolSettings: hook("settings", () => settings),
  useGetStaffPoolToday: hook("today", () => today),
  useListStaffDrinks: hook("drinks", () => drinks),
  usePutStaffPoolSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
  deleteStaffPoolSettings: vi.fn(),
  useListMenuItems: hook("menuItems", () => [
    { id: "item-a", name: "Latte", name_translations: null },
    { id: "item-b", name: "Iced tea", name_translations: null },
  ]),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { StaffPoolSettingsPage } = await import("./staff-pool-settings-page");
const { StaffPoolReportPage } = await import("./staff-pool-report-page");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider>{node}</ConfirmProvider>
    </QueryClientProvider>,
  );
const denied = () => screen.queryByText(/can't open this report|can't change this/);
const neverAsked = (name: string) => (enabledSeen[name] ?? []).every((e) => e === false);

beforeEach(() => {
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
  branchId = null;
  settings = { org_id: "org-1", branch_id: null, enabled: true, daily_allowance: 3, eligible_item_ids: ["item-a"] };
  today = {
    branch_id: "b-9",
    business_date: "2026-09-19",
    enabled: true,
    allowance: 3,
    used: 5,
    remaining: 0,
    over: 2,
    eligible_item_ids: ["item-a"],
  };
  drinks = [drink({ id: "d-1" })];
});

const drink = (over: Partial<StaffDrink> = {}): StaffDrink => ({
  id: "d-1",
  branch_id: "b-9",
  order_id: null,
  menu_item_id: "item-a",
  item_name: "Latte",
  size_label: null,
  quantity: 1,
  note: "Mostafa, closing shift",
  business_date: "2026-09-19",
  allowance_at_record: 3,
  used_before: 0,
  overspent: false,
  overspent_on_replay: false,
  cost_minor: 1250,
  recorded_by: "u-1",
  recorded_at: "2026-09-19T09:00:00Z",
  ...over,
});

describe("the staff drinks report's capability gate", () => {
  it("needs orders.staff_drink.record, and asks nothing without it", () => {
    held = [];
    wrap(<StaffPoolReportPage />);
    expect(denied()).toBeInTheDocument();
    // The point of the gate: no request fires, so nobody meets a 403.
    expect(neverAsked("today")).toBe(true);
    expect(neverAsked("drinks")).toBe(true);
  });

  it("shows the day's figures with the capability", () => {
    held = ["orders.staff_drink.record"];
    branchId = "b-9";
    wrap(<StaffPoolReportPage />);
    expect(denied()).not.toBeInTheDocument();
    expect(screen.getAllByText("Over allowance").length).toBeGreaterThan(0);
    expect(neverAsked("today")).toBe(false);
  });

  it("asks nothing until a branch is chosen", () => {
    // The pool is one branch's day; there is no all-branches total.
    held = ["orders.staff_drink.record"];
    branchId = null;
    wrap(<StaffPoolReportPage />);
    expect(screen.getByText("Choose a branch")).toBeInTheDocument();
    expect(neverAsked("today")).toBe(true);
    expect(neverAsked("drinks")).toBe(true);
  });
});

describe("the drink-by-drink table", () => {
  beforeEach(() => {
    held = ["orders.staff_drink.record"];
    branchId = "b-9";
  });

  it("shows each drink with its note, which is the whole point of the page", () => {
    // There is no "who is this for" field anywhere in the pool by design; the
    // note is the only record of who drank it, so it must be on screen in full.
    drinks = [
      drink({ id: "d-1", note: "Mostafa, closing shift" }),
      drink({ id: "d-2", item_name: "Iced tea", note: "the electrician, waiting on the fridge" }),
    ];
    wrap(<StaffPoolReportPage />);
    expect(screen.getByText("Mostafa, closing shift")).toBeInTheDocument();
    expect(screen.getByText("the electrician, waiting on the fridge")).toBeInTheDocument();
    expect(screen.getByText(/Iced tea/)).toBeInTheDocument();
  });

  it("badges only the drinks that actually went over", () => {
    drinks = [
      drink({ id: "d-1", overspent: false }),
      drink({ id: "d-2", overspent: true }),
    ];
    const { container } = wrap(<StaffPoolReportPage />);
    // One badge for one overspent row — not one per row, and not none. Counted
    // by the badge itself: "Over allowance" is also a stat label and a column
    // header, so matching the text would count the chrome as evidence.
    expect(container.querySelectorAll('[data-slot="badge"][data-variant="destructive"]')).toHaveLength(1);
    expect(screen.queryByText("· on recount")).not.toBeInTheDocument();
  });

  it("says quietly when the server, not the till, made it an overspend", () => {
    // Two devices disagreed about the day's count. Worth seeing on the badge,
    // not worth a column of its own.
    drinks = [drink({ id: "d-1", overspent: true, overspent_on_replay: true })];
    wrap(<StaffPoolReportPage />);
    expect(screen.getByText("· on recount")).toBeInTheDocument();
  });

  it("asks for the whole scope period, not only its last day", () => {
    // The summary is one day — the pool resets nightly — but finding last
    // Tuesday's overspend must not mean moving the date picker twice.
    drinks = [];
    wrap(<StaffPoolReportPage />);
    expect(neverAsked("drinks")).toBe(false);
    expect(screen.getByText("No staff drinks in this period")).toBeInTheDocument();
  });
});

describe("the staff drinks settings' capability gate", () => {
  it("needs org.settings, and asks nothing without it", () => {
    held = [];
    wrap(<StaffPoolSettingsPage />);
    expect(denied()).toBeInTheDocument();
    expect(neverAsked("settings")).toBe(true);
  });

  it("lets a reader look without offering Save", () => {
    held = ["org.settings.read"];
    wrap(<StaffPoolSettingsPage />);
    expect(denied()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByText(/only an owner or admin can change them/)).toBeInTheDocument();
  });
});

describe("the organisation's settings versus a branch's own", () => {
  beforeEach(() => {
    held = ["org.settings.edit"];
  });

  it("says a branch is following the organisation when the row is not its own", () => {
    // The API answers a branch query with the settings IN FORCE, so the
    // response alone cannot say which. A `branch_id` of null is the tell.
    branchId = "b-9";
    settings = { ...settings!, branch_id: null };
    wrap(<StaffPoolSettingsPage />);
    expect(screen.getByText(/follows the organisation's staff drinks settings/)).toBeInTheDocument();
    // Nothing to revert to: it is already following.
    expect(screen.queryByRole("button", { name: /Follow the organisation/ })).not.toBeInTheDocument();
  });

  it("offers the revert once the branch has rules of its own", () => {
    branchId = "b-9";
    settings = { ...settings!, branch_id: "b-9" };
    wrap(<StaffPoolSettingsPage />);
    expect(screen.queryByText(/follows the organisation's staff drinks settings/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Follow the organisation/ })).toBeInTheDocument();
  });

  it("never offers the revert at the organisation scope", () => {
    branchId = null;
    wrap(<StaffPoolSettingsPage />);
    expect(screen.queryByText(/follows the organisation's staff drinks settings/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Follow the organisation/ })).not.toBeInTheDocument();
  });
});

describe("an empty item list reads as 'the pool is off'", () => {
  beforeEach(() => {
    held = ["org.settings.edit"];
  });

  it("says so in words even while the switch is on", () => {
    settings = { ...settings!, enabled: true, eligible_item_ids: [] };
    wrap(<StaffPoolSettingsPage />);
    expect(screen.getByText(/The pool is off: with no items chosen/)).toBeInTheDocument();
    expect(screen.getByText("No items chosen — the pool is off")).toBeInTheDocument();
  });

  it("says nothing of the sort once an item is chosen and the switch is on", () => {
    settings = { ...settings!, enabled: true, eligible_item_ids: ["item-a"] };
    wrap(<StaffPoolSettingsPage />);
    expect(screen.queryByText(/The pool is off/)).not.toBeInTheDocument();
  });

  it("still says the pool is off when the switch is off", () => {
    settings = { ...settings!, enabled: false, eligible_item_ids: ["item-a"] };
    wrap(<StaffPoolSettingsPage />);
    expect(screen.getByText(/The pool is off\./)).toBeInTheDocument();
  });
});
