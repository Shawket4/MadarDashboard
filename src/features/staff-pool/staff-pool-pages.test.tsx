/**
 * The two staff-pool screens, at the three points they have historically gone
 * wrong on other features: the capability gate (restricted page AND no request
 * at all), the org-vs-branch inheritance hint, and the empty item list that
 * means the pool is off while the switch still reads "on".
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  StaffDrink,
  StaffDrinksSummary,
  StaffPoolSettings,
  StaffPoolToday,
} from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";

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
let summary: StaffDrinksSummary | undefined;
let summaryFails = false;
const openedOrders: (string | null)[] = [];
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
  useSummarizeStaffDrinks: (...args: unknown[]) => ({
    ...hook("summary", () => (summaryFails ? undefined : summary))(...args),
    isError: summaryFails,
  }),
  usePutStaffPoolSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
  deleteStaffPoolSettings: vi.fn(),
  useListMenuItems: hook("menuItems", () => [
    { id: "item-a", name: "Latte", name_translations: null },
    { id: "item-b", name: "Iced tea", name_translations: null },
  ]),
}));

// The real sheet pulls half the app behind it; what this page owes it is the
// id of the order to open, and nothing else.
vi.mock("@/features/orders/order-detail-sheet", () => ({
  OrderDetailSheet: ({ orderId, open }: { orderId: string | null; open: boolean }) => {
    if (open) openedOrders.push(orderId);
    return open ? <div data-testid="order-sheet">{orderId}</div> : null;
  },
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
  summary = undefined;
  summaryFails = false;
  openedOrders.length = 0;
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

describe("what each drink gave away, and what it still charged", () => {
  beforeEach(() => {
    held = ["orders.staff_drink.record", "orders.read"];
    branchId = "b-9";
  });

  it("shows the server's comp and the extras as money", () => {
    drinks = [drink({ id: "d-1", order_id: "o-1", comp_minor: 7000, extras_minor: 1500 })];
    wrap(<StaffPoolReportPage />);
    expect(screen.getByRole("columnheader", { name: "Given free" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Extras charged" })).toBeInTheDocument();
    expect(screen.getByText(fmtMoney(7000))).toBeInTheDocument();
    expect(screen.getByText(fmtMoney(1500))).toBeInTheDocument();
    expect(screen.queryByTestId("comp-unpriced")).not.toBeInTheDocument();
  });

  it("shows a free drink with nothing extra as 0.00, which is a real figure", () => {
    drinks = [drink({ id: "d-1", comp_minor: 7000, extras_minor: 0 })];
    wrap(<StaffPoolReportPage />);
    expect(screen.getByText(fmtMoney(0))).toBeInTheDocument();
  });

  it("never shows an old till's drink as 0 — it has no figure, and says why", () => {
    // POS ≤ v0.7.12 records the drink without a priced line: comp is null,
    // which is "unknown". A 0 would claim the branch gave nothing away.
    drinks = [drink({ id: "d-1", comp_minor: null, extras_minor: null, cost_minor: null })];
    wrap(<StaffPoolReportPage />);
    const cells = screen.getAllByTestId("comp-unpriced");
    expect(cells).toHaveLength(2);
    for (const c of cells) {
      expect(c).toHaveTextContent("—");
      expect(c).toHaveTextContent("Rung before staff drinks were priced");
    }
    expect(screen.queryByText(fmtMoney(0))).not.toBeInTheDocument();
    // And the reason is on the page, not only in a tooltip.
    expect(screen.getByText(/means the drink was rung before staff drinks were priced/)).toBeInTheDocument();
  });

  it("treats a row the old shape never carried the fields on the same way", () => {
    drinks = [drink({ id: "d-1" })];
    wrap(<StaffPoolReportPage />);
    expect(screen.getAllByTestId("comp-unpriced")).toHaveLength(2);
  });

  it("marks a row whose till claimed a different comp, and says both figures", () => {
    drinks = [
      drink({ id: "d-1", comp_minor: 7000, comp_minor_reported: 9000, extras_minor: 0 }),
      drink({ id: "d-2", comp_minor: 7000, comp_minor_reported: 7000, extras_minor: 0 }),
      drink({ id: "d-3", comp_minor: 7000, comp_minor_reported: null, extras_minor: 0 }),
    ];
    wrap(<StaffPoolReportPage />);
    const notes = screen.getAllByTestId("comp-mismatch");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toHaveTextContent(
      `The till reported ${fmtMoney(9000)}; the server priced it at ${fmtMoney(7000)}.`,
    );
    expect(screen.getAllByText("Till differs")).toHaveLength(1);
  });

  it("opens the sale a drink was rung on, and offers nothing where there is none", async () => {
    drinks = [
      drink({ id: "d-1", order_id: "o-77", comp_minor: 7000, extras_minor: 0 }),
      drink({ id: "d-2", order_id: null }),
    ];
    wrap(<StaffPoolReportPage />);
    const links = screen.getAllByRole("button", { name: "View order" });
    expect(links).toHaveLength(1);
    await userEvent.click(links[0]);
    expect(screen.getByTestId("order-sheet")).toHaveTextContent("o-77");
  });

  it("draws no order link for someone who cannot read orders", () => {
    held = ["orders.staff_drink.record"];
    drinks = [drink({ id: "d-1", order_id: "o-77", comp_minor: 7000, extras_minor: 0 })];
    wrap(<StaffPoolReportPage />);
    expect(screen.queryByRole("button", { name: "View order" })).not.toBeInTheDocument();
  });
});

describe("the period's totals", () => {
  const totals = (over: Partial<StaffDrinksSummary> = {}): StaffDrinksSummary => ({
    drinks: 4,
    quantity: 5,
    overspent: 2,
    comp_minor: 28000,
    extras_minor: 3500,
    cost_minor: 6100,
    comp_mismatches: 0,
    unpriced: 0,
    ...over,
  });
  beforeEach(() => {
    held = ["orders.staff_drink.record"];
    branchId = "b-9";
  });

  it("asks nothing without the capability", () => {
    held = [];
    wrap(<StaffPoolReportPage />);
    expect(neverAsked("summary")).toBe(true);
  });

  it("shows what the endpoint returns: drinks, given free, extras, cost, over allowance", () => {
    summary = totals();
    wrap(<StaffPoolReportPage />);
    const strip = within(screen.getByTestId("staff-summary"));
    // Drinks is the QUANTITY — what the allowance is measured in — not the rows.
    expect(strip.getByText("Drinks").nextElementSibling).toHaveTextContent("5");
    expect(strip.getByText("Given free").nextElementSibling).toHaveTextContent(fmtMoney(28000));
    expect(strip.getByText("Extras charged").nextElementSibling).toHaveTextContent(fmtMoney(3500));
    expect(strip.getByText("Cost to make").nextElementSibling).toHaveTextContent(fmtMoney(6100));
    expect(strip.getByText("Over allowance").nextElementSibling).toHaveTextContent("2");
    expect(strip.queryByText("Till differs")).not.toBeInTheDocument();
  });

  it("counts the rows a till disagreed on, and the ones with no figures", () => {
    summary = totals({ comp_mismatches: 1, unpriced: 3 });
    wrap(<StaffPoolReportPage />);
    const strip = within(screen.getByTestId("staff-summary"));
    expect(strip.getByText("Till differs").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText(/3 of these were rung before staff drinks were priced/)).toBeInTheDocument();
  });

  it("draws no row of zeroes over an empty period", () => {
    summary = totals({ drinks: 0, quantity: 0, overspent: 0, comp_minor: 0, extras_minor: 0, cost_minor: 0 });
    drinks = [];
    wrap(<StaffPoolReportPage />);
    expect(screen.queryByTestId("staff-summary")).not.toBeInTheDocument();
  });

  it("says the totals failed without taking the rows down with them", () => {
    summaryFails = true;
    wrap(<StaffPoolReportPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load the totals for this period.");
    expect(screen.getByText("Mostafa, closing shift")).toBeInTheDocument();
  });
});

describe("the new figures in Arabic", () => {
  beforeEach(async () => {
    held = ["orders.staff_drink.record", "orders.read"];
    branchId = "b-9";
    await i18n.changeLanguage("ar");
  });
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("names the columns, the marker and the totals in Arabic, with no English left", () => {
    drinks = [
      drink({ id: "d-1", order_id: "o-1", comp_minor: 7000, comp_minor_reported: 9000, extras_minor: 1500 }),
      drink({ id: "d-2", comp_minor: null }),
    ];
    summary = {
      drinks: 2, quantity: 2, overspent: 0, comp_minor: 7000, extras_minor: 1500,
      cost_minor: 2500, comp_mismatches: 1, unpriced: 1,
    };
    const { container } = wrap(<StaffPoolReportPage />);
    expect(i18n.dir()).toBe("rtl");
    expect(screen.getByRole("columnheader", { name: "قُدّم مجانًا" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "إضافات مدفوعة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "افتح الطلب" })).toBeInTheDocument();
    expect(screen.getByTestId("comp-mismatch")).toHaveTextContent(/الكاشير سجّل .*؛ والسيرفر حسبها/);
    expect(screen.getAllByTestId("comp-unpriced")[0]).toHaveTextContent("سُجّل قبل تسعير مشروبات الموظفين");
    expect(screen.getByText(/مشروب واحد منها سُجّل قبل/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Given free|Extras charged|Till differs|View order|The till reported/);
    // Figures stay isolated so a minus or a currency never reorders in RTL.
    expect(screen.getByTestId("staff-summary").querySelectorAll("bdi").length).toBeGreaterThan(0);
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

describe("the pricing rule, said once under the items", () => {
  beforeEach(() => {
    held = ["org.settings.edit"];
  });

  it("says what is free and what is charged", () => {
    wrap(<StaffPoolSettingsPage />);
    const rule = screen.getByText(/What's free is the smallest size and the default of each required choice/);
    expect(rule).toHaveTextContent(/A bigger size, extras and pricier choices are charged/);
    // It sits with the control it explains.
    expect(rule.parentElement).toHaveTextContent("Items that count");
  });

  it("says it in Arabic", async () => {
    await i18n.changeLanguage("ar");
    try {
      wrap(<StaffPoolSettingsPage />);
      expect(screen.getByText(/المجاني هو أصغر حجم والاختيار الأساسي في كل اختيار إلزامي/)).toBeInTheDocument();
      expect(screen.queryByText(/What's free/)).not.toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("en");
    }
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
