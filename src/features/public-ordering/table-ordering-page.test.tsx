/**
 * The table page's three jobs: show the meal, send a round, and never ask a
 * question the code on the table already answered.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publicTable = vi.fn();
const publicTableMenu = vi.fn();
const tableOrder = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  usePublicTable: (id: string, opts?: unknown) => publicTable(id, opts),
  usePublicTableMenu: (id: string, opts?: unknown) => publicTableMenu(id, opts),
  usePublicTableOrder: () => tableOrder(),
  usePublicOrgBrand: () => ({ data: undefined, isPending: false }),
  usePublicMenu: () => ({ data: undefined, isLoading: false, isError: false }),
}));

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
