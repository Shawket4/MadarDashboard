/**
 * One list, two capability families. With `customers.view` it reads
 * `/customers` (badge, source, spend); with only `loyalty.members.list` the
 * Members tab reads the loyalty endpoint and shows what it always showed.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Customer, LoyaltySettings, MemberView } from "@/data/api/generated/models";

const at = "2026-01-01T00:00:00Z";
const customers: Customer[] = [
  { id: "c-1", name: "Sara Ali", phone: "201000000001", is_member: true, points_balance: 120, visits_balance: 3, source: "loyalty", orders_count: 4, total_spent: 125050, last_order_at: "2026-09-10T10:00:00Z", created_at: at, updated_at: at },
  { id: "c-2", name: "Omar", phone: null, is_member: false, source: "pos", orders_count: 0, total_spent: 0, last_order_at: null, created_at: at, updated_at: at },
];
const memberRows = [
  { id: "c-1", name: "Sara Ali", phone: "201000000001", mode: "visits", balance: 3, can_redeem: false, points_to_next_reward: 2, enrolled_at: at },
] as unknown as MemberView[];

let held: string[] = [];
let platform = false;
let settings: Partial<LoyaltySettings> | undefined;
const useListCustomers = vi.fn();
const useListLoyaltyMembers = vi.fn();
const useGetLoyaltySettings = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListCustomers: (...a: unknown[]) => useListCustomers(...a),
  useListLoyaltyMembers: (...a: unknown[]) => useListLoyaltyMembers(...a),
  useGetLoyaltySettings: (...a: unknown[]) => useGetLoyaltySettings(...a),
  listCustomers: vi.fn(),
  listLoyaltyMembers: vi.fn(),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      platform
        ? real.authzFrom(null, { platform: true })
        : real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("./customer-detail-sheet", () => ({
  CustomerDetailSheet: ({ customerId }: { customerId: string | null }) => (customerId ? <div data-testid="person-sheet" data-id={customerId} /> : null),
}));
vi.mock("@/features/orders/order-detail-sheet", () => ({ OrderDetailSheet: () => null }));
vi.mock("@/features/loyalty/admin/members/google-object-dialog", () => ({ GoogleObjectDialog: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CustomersList } = await import("./customers-list");

type Enabled = { query: { enabled: boolean } };
const lastParams = (fn: typeof useListCustomers) => fn.mock.calls[fn.mock.calls.length - 1][0] as Record<string, unknown>;
const lastEnabled = (fn: typeof useListCustomers) => (fn.mock.calls[fn.mock.calls.length - 1][1] as Enabled).query.enabled;

function mount(membersOnly = false) {
  let open: string | null = null;
  const view = () => (
    <QueryClientProvider client={new QueryClient()}>
      <CustomersList membersOnly={membersOnly} openId={open} onOpenIdChange={(id) => { open = id; r.rerender(view()); }} />
    </QueryClientProvider>
  );
  const r = render(view());
  return r;
}

const headers = () => screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());

beforeEach(() => {
  platform = false;
  settings = undefined;
  useListCustomers.mockReset().mockImplementation(() => ({ data: customers, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }));
  useListLoyaltyMembers.mockReset().mockImplementation(() => ({ data: { members: memberRows, total: 1 }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }));
  useGetLoyaltySettings.mockReset().mockImplementation(() => ({ data: settings }));
});

describe("CustomersList", () => {
  it("customers.view alone: everybody, member badge and source, no balance and no loyalty endpoint", () => {
    held = ["customers.view"];
    mount();
    expect(lastParams(useListCustomers)).toMatchObject({ member: undefined, source: undefined, offset: 0 });
    expect(lastEnabled(useListCustomers)).toBe(true);
    expect(lastEnabled(useListLoyaltyMembers)).toBe(false);
    expect(lastEnabled(useGetLoyaltySettings)).toBe(false);

    expect(headers()).toEqual(expect.arrayContaining(["Name", "Phone", "Came from", "Orders", "Total spent", "Last visit"]));
    expect(headers()).not.toContain("Balance");
    const rows = screen.getAllByTestId("customer-row");
    expect(within(rows[0]).getByText("Member")).toBeInTheDocument();
    expect(within(rows[1]).queryByText("Member")).not.toBeInTheDocument();
    expect(screen.getAllByText("+20 100 000 0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Loyalty sign-up").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Google Wallet object" })).not.toBeInTheDocument();
  });

  it("the balance column needs a readable, running program — and speaks its currency", () => {
    held = ["customers.view", "loyalty.read"];
    settings = { enabled: true, mode: "visits" };
    mount();
    expect(headers()).toContain("Balance");
    expect(screen.getAllByText(/^3 orders$/).length).toBeGreaterThan(0);
  });

  it("no balance column when the shop runs no program", () => {
    held = ["customers.view", "loyalty.read"];
    settings = { enabled: false, mode: "points" };
    mount();
    expect(headers()).not.toContain("Balance");
  });

  it("Members only is a server filter", async () => {
    held = ["customers.view"];
    mount();
    await userEvent.click(screen.getByRole("switch", { name: "Members only" }));
    expect(lastParams(useListCustomers)).toMatchObject({ member: true });
  });

  it("a row opens the one sheet by the person's id", async () => {
    held = ["customers.view"];
    mount();
    await userEvent.click(screen.getAllByTestId("customer-row")[0]);
    expect(screen.getByTestId("person-sheet")).toHaveAttribute("data-id", "c-1");
  });

  it("Members tab with only loyalty.members.list: the loyalty endpoint, its old columns, nothing about orders or spend", () => {
    held = ["loyalty.members.list"];
    mount(true);
    expect(lastEnabled(useListCustomers)).toBe(false);
    expect(lastEnabled(useListLoyaltyMembers)).toBe(true);
    expect(headers()).toEqual(expect.arrayContaining(["Name", "Phone", "Balance", "To next reward", "Joined"]));
    for (const h of ["Orders", "Total spent", "Last visit", "Came from"]) expect(headers()).not.toContain(h);
    expect(screen.queryByRole("switch", { name: "Members only" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Came from" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/ })).toBeInTheDocument();
  });

  it("Members tab with both families: the customers list, locked to members", () => {
    held = ["customers.view", "loyalty.members.list", "loyalty.read"];
    settings = { enabled: false, mode: "points" };
    mount(true);
    expect(lastParams(useListCustomers)).toMatchObject({ member: true });
    expect(lastEnabled(useListLoyaltyMembers)).toBe(false);
    // Locked: no switch to turn it off, no badge on every row, and the balance shows even if the program is paused.
    expect(screen.queryByRole("switch", { name: "Members only" })).not.toBeInTheDocument();
    expect(screen.queryByText("Member")).not.toBeInTheDocument();
    expect(headers()).toContain("Balance");
  });

  it("customers.view without loyalty.members.list gets no Members tab list", () => {
    held = ["customers.view"];
    const { container } = mount(true);
    expect(container).toBeEmptyDOMElement();
    expect(lastEnabled(useListCustomers)).toBe(false);
  });

  it("Google Wallet inspection is the platform's, and only on members", () => {
    platform = true;
    mount();
    expect(screen.getAllByRole("button", { name: "Google Wallet object" }).length).toBeGreaterThan(0);
    const omar = screen.getAllByTestId("customer-row")[1].closest("tr") as HTMLElement;
    expect(within(omar).queryByRole("button", { name: "Google Wallet object" })).not.toBeInTheDocument();
  });
});
