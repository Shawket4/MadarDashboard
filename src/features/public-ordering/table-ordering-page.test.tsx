/**
 * The table page's three jobs: show the meal, send a round, and never ask a
 * question the code on the table already answered.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publicTable = vi.fn();
const publicTableMenu = vi.fn();
const tableOrder = vi.fn();
const tableCartQuote = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  usePublicTable: (id: string, opts?: unknown) => publicTable(id, opts),
  usePublicTableMenu: (id: string, opts?: unknown) => publicTableMenu(id, opts),
  usePublicTableOrder: () => tableOrder(),
  usePublicOrgBrand: () => ({ data: undefined, isPending: false }),
  usePublicMenu: () => ({ data: undefined, isLoading: false, isError: false }),
  publicTableCartQuote: (...args: unknown[]) => tableCartQuote(...args),
  publicBranchCartQuote: vi.fn(),
}));

// jsdom has no IntersectionObserver; the menu's category scrollspy wants one.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// The real i18n instance — see the note in `qr/table-codes.test.tsx`. Without
// it `t` hands back a key's inline default with its placeholders unsubstituted,
// which looks exactly like a missing translation and passes anyway.
await import("@/i18n");
const { TableOrderingPage } = await import("./table-ordering-page");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const TABLE = {
  table_id: "t-7",
  branch_id: "b-1",
  org_id: "o-1",
  label: "7",
  branch_name: "Zamalek",
  accepting: true,
  bill: null as unknown,
};

const MENU = { categories: [], items: [], addons: [] };

beforeEach(() => {
  publicTableMenu.mockReturnValue({ data: MENU, isLoading: false, isError: false });
  tableOrder.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  // No quote by default: the basket prices itself from the estimate.
  tableCartQuote.mockReset();
  tableCartQuote.mockRejectedValue(new Error("no quote in this test"));
  publicTable.mockReturnValue({
    data: TABLE,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
});

describe("TableOrderingPage", () => {
  it("names the table the customer is sitting at, and its branch", () => {
    wrap(<TableOrderingPage tableId="t-7" />);
    expect(screen.getByText("Table 7")).toBeInTheDocument();
    expect(screen.getByText("Zamalek")).toBeInTheDocument();
  });

  it("shows the meal in progress, not an empty basket", () => {
    publicTable.mockReturnValue({
      data: {
        ...TABLE,
        bill: {
          ticket_id: "tk-1",
          opened_at: new Date(Date.now() - 42 * 60_000).toISOString(),
          ready: false,
          subtotal: 7500,
          total: 8550,
          rounds: [
            {
              number: 1,
              fired_at: new Date().toISOString(),
              items: [
                { name: "Burger", quantity: 2, line_total: 5000, voided: false },
              ],
            },
            {
              number: 2,
              fired_at: new Date().toISOString(),
              items: [
                { name: "Lemonade", quantity: 1, line_total: 2500, voided: false },
              ],
            },
          ],
        },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    wrap(<TableOrderingPage tableId="t-7" />);

    expect(screen.getByText("Your bill so far")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("Burger")).toBeInTheDocument();
    // How long they have been sitting, counting up from the server's moment.
    expect(screen.getByText("42 min")).toBeInTheDocument();
    // The SERVER's total — 85.50, not the 75.00 the lines add up to.
    expect(screen.getByText(/85\.5/)).toBeInTheDocument();
    // And it says where the money is paid, because this page does not take it.
    expect(screen.getByText(/Pay at the counter/)).toBeInTheDocument();
  });

  it("says the kitchen is closed instead of taking an order it cannot send", () => {
    publicTable.mockReturnValue({
      data: { ...TABLE, accepting: false },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    wrap(<TableOrderingPage tableId="t-7" />);
    expect(screen.getByText("The kitchen is closed right now")).toBeInTheDocument();
  });

  it("a code for a table that is gone says so, without guessing why", () => {
    publicTable.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    wrap(<TableOrderingPage tableId="t-7" />);
    expect(screen.getByText("We can't find that table")).toBeInTheDocument();
  });

  it("asks for no branch, no channel, no phone and no address", () => {
    wrap(<TableOrderingPage tableId="t-7" />);
    // The four questions the code on the table already answered. Each was a
    // step in the delivery flow, and none of them belongs in front of someone
    // who is sitting in the shop.
    for (const asked of [/choose a branch/i, /phone number/i, /address/i, /how would you like/i]) {
      expect(screen.queryByText(asked)).toBeNull();
    }
    // And nothing on the page talks about delivery.
    expect(screen.queryByText(/for delivery/i)).toBeNull();
  });

  it("polls the bill, so a round somebody else sent turns up", () => {
    wrap(<TableOrderingPage tableId="t-7" />);
    const [, opts] = publicTable.mock.calls[0] as [string, { query: { refetchInterval: number } }];
    expect(opts.query.refetchInterval).toBeGreaterThan(0);
  });

  it("reads the DINE-IN menu, never a delivery channel's", () => {
    wrap(<TableOrderingPage tableId="t-7" />);
    expect(publicTableMenu).toHaveBeenCalledWith("t-7", expect.anything());
  });
});

/* ── Combos and deals (T3: a combo sent without picks could never go through) ── */

const choice = (id: string, name: string, sizes?: { label: string; extra: number }[]) => ({
  menu_item_id: id,
  name,
  name_translations: { ar: `${name} (ar)` },
  image_url: null,
  base_price: 9000,
  included_size_label: sizes?.[0]?.label ?? "one_size",
  sizes: (sizes ?? [{ label: "one_size", extra: 0 }]).map((s) => ({ ...s, price: 9000 + s.extra })),
  surcharge: 0,
});

const COFFEE_COMBO = {
  id: "combo-1",
  kind: "combo",
  name: "Coffee & Soft Serve",
  name_translations: {},
  description: null,
  category_id: "cat-1",
  price: 20000,
  sizes: [],
  optionals: [],
  modifier_groups: [],
  allowed_addon_ids: [],
  combo: {
    is_fixed: false,
    slots: [
      // Deliberately out of order: the picker sorts by `sort`.
      {
        id: "slot-dessert",
        name: "Dessert",
        name_translations: { ar: "حلو" },
        sort: 1,
        min: 1,
        max: 1,
        default_item_id: null,
        default_size_label: null,
        choices: [
          choice("vanilla", "Vanilla Soft Serve", [
            { label: "small", extra: 0 },
            { label: "large", extra: 1000 },
          ]),
          choice("coffee-ss", "Coffee Soft Serve", [
            { label: "small", extra: 0 },
            { label: "large", extra: 2000 },
          ]),
        ],
      },
      {
        id: "slot-coffee",
        name: "Coffee",
        name_translations: { ar: "قهوة" },
        sort: 0,
        min: 1,
        max: 1,
        default_item_id: null,
        default_size_label: null,
        choices: [choice("latte", "Latte"), choice("americano", "Americano")],
      },
    ],
  },
};

const BROWNIE_BOX = {
  ...COFFEE_COMBO,
  id: "combo-2",
  name: "Brownie Box",
  price: 32000,
  combo: {
    is_fixed: true,
    slots: [
      {
        id: "slot-brownies",
        name: "Brownies",
        name_translations: {},
        sort: 0,
        min: 3,
        max: 3,
        default_item_id: null,
        default_size_label: null,
        choices: [choice("brownie", "Brownies")],
      },
    ],
  },
};

const COMBO_MENU = {
  categories: [{ id: "cat-1", name: "Combos", name_translations: {} }],
  items: [COFFEE_COMBO, BROWNIE_BOX],
  addons: [],
  deals: [],
};

describe("TableOrderingPage — combos", () => {
  beforeEach(() => {
    publicTableMenu.mockReturnValue({ data: COMBO_MENU, isLoading: false, isError: false });
  });

  it("opens the combo picker, not the item customizer, and holds Add until every slot is filled", () => {
    wrap(<TableOrderingPage tableId="t-7" />);
    fireEvent.click(screen.getByRole("button", { name: /Coffee & Soft Serve/ }));

    // The slots, in the owner's order, and none of the plain item's controls.
    const coffee = screen.getByRole("region", { name: "Coffee" });
    const dessert = screen.getByRole("region", { name: "Dessert" });
    expect(coffee.compareDocumentPosition(dessert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/Show all add-ons/)).toBeNull();
    expect(screen.queryByText("one_size")).toBeNull();

    const blocked = screen.getByRole("button", { name: "Choose your Coffee" });
    expect(blocked).toBeDisabled();

    fireEvent.click(within(coffee).getByRole("button", { name: /Latte/ }));
    expect(screen.getByRole("button", { name: "Choose your Dessert" })).toBeDisabled();

    fireEvent.click(within(dessert).getByRole("button", { name: /Vanilla Soft Serve/ }));
    const add = screen.getByRole("button", { name: /^Add · .*200\.00/ });
    expect(add).toBeEnabled();
  });

  it("a size upgrade adds exactly its extra, and the round carries the picks", () => {
    const mutate = vi.fn();
    tableOrder.mockReturnValue({ mutate, isPending: false, isError: false });
    wrap(<TableOrderingPage tableId="t-7" />);
    fireEvent.click(screen.getByRole("button", { name: /Coffee & Soft Serve/ }));
    fireEvent.click(screen.getByRole("button", { name: /Latte/ }));
    fireEvent.click(screen.getByRole("button", { name: /Vanilla Soft Serve/ }));

    // The included size says so; the upgrade names its price.
    expect(screen.getByRole("radio", { name: /small.*Included/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /large/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Add · .*210\.00/ }));

    // In the basket: the combo, with its picks under it.
    expect(screen.getAllByText(/Latte/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coffee:").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Send to kitchen" })[0]);
    expect(mutate).toHaveBeenCalledTimes(1);
    const body = mutate.mock.calls[0][0].data;
    expect(body.items).toEqual([
      expect.objectContaining({
        menu_item_id: "combo-1",
        size_label: null,
        quantity: 1,
        combo: {
          picks: [
            { slot_id: "slot-coffee", menu_item_id: "latte", size_label: null, quantity: 1 },
            { slot_id: "slot-dessert", menu_item_id: "vanilla", size_label: "large", quantity: 1 },
          ],
        },
      }),
    ]);
  });

  it("a fixed bundle comes filled in: just the quantity and Add", () => {
    const mutate = vi.fn();
    tableOrder.mockReturnValue({ mutate, isPending: false, isError: false });
    wrap(<TableOrderingPage tableId="t-7" />);
    fireEvent.click(screen.getByRole("button", { name: /Brownie Box/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Add · .*320\.00/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Send to kitchen" })[0]);
    expect(mutate.mock.calls[0][0].data.items[0].combo).toEqual({
      picks: [{ slot_id: "slot-brownies", menu_item_id: "brownie", size_label: null, quantity: 3 }],
    });
  });

  it("shows the deal the server will apply, and the total after it", async () => {
    tableCartQuote.mockResolvedValue({
      lines: [{ index: 0, quantity: 1, unit_price: 0, line_total: 32000, deal_minor: 7000 }],
      items_total: 32000,
      deals: [
        {
          deal_rule_id: "deal-1",
          name: "Any 2 bakes for 250",
          name_translations: { ar: "أي ٢ مخبوزات بـ ٢٥٠" },
          times: 1,
          discount: 7000,
          lines: [],
        },
      ],
      deal_discount: 7000,
      total_after_deals: 25000,
    });
    wrap(<TableOrderingPage tableId="t-7" />);
    fireEvent.click(screen.getByRole("button", { name: /Brownie Box/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Add · .*320\.00/ }));

    expect((await screen.findAllByText(/Deal · Any 2 bakes for 250/, {}, { timeout: 2000 })).length).toBeGreaterThan(0);
    // The quote was asked for THIS table, with the combo's picks.
    expect(tableCartQuote).toHaveBeenCalledWith(
      "t-7",
      { items: [expect.objectContaining({ menu_item_id: "combo-2", combo: expect.anything() })] },
      undefined,
      expect.anything(),
    );
    // The total the customer sees is the one after the deal.
    const panelTotal = screen.getAllByText("Total").map((el) => el.parentElement?.textContent ?? "");
    expect(panelTotal.some((txt) => /250\.00/.test(txt))).toBe(true);
    expect(screen.getAllByText(/−.*70\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Deals come off your bill/).length).toBeGreaterThan(0);
  });

  it("a failed send says the server's reason, not just 'try again'", () => {
    const error = new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { code: "COMBO_PICKS_REQUIRED", error: "Bad request: combo picks required" },
    });
    tableOrder.mockReturnValue({ mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: true, error });
    wrap(<TableOrderingPage tableId="t-7" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the items for this combo.");
  });
});
