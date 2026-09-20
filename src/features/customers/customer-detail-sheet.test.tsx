/**
 * One sheet for a customer and their card, each section behind its own
 * capability family: the customer side needs customers.view, the card side a
 * loyalty read, and every action its own capability. Read-only hides them all.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerDetail, MemberDetail } from "@/data/api/generated/models";

const at = "2026-01-01T00:00:00Z";
const detail: CustomerDetail = {
  customer: {
    id: "c-1", name: "Sara Ali", phone: "201000000001", is_member: true, points_balance: 120, visits_balance: 0,
    source: "online", locale: "ar", birth_month: 3, birth_day: 14, marketing_opt_out: true,
    orders_count: 4, total_spent: 125050, last_order_at: at, created_at: at, updated_at: at,
  },
  recent_orders: [],
  merged_from: [],
} as unknown as CustomerDetail;
const card = {
  member: { id: "c-1", name: "Sara Ali", phone: "201000000001", mode: "points", balance: 120, lifetime_points: 300, lifetime_visits: 0, points_balance: 120, visits_balance: 0, rewards_ready: 1, points_to_next_reward: 30, can_redeem: true, enrolled_at: at },
  ledger: [],
} as unknown as MemberDetail;

// Invented places: nothing here is, or looks like, somebody's real address.
const addresses = [
  { id: "a-1", customer_id: "c-1", channel: "outside", label: "Home", address_line: "Test Street", floor: "3", unit_number: "12", landmark: "Blue gate", use_count: 7, last_used_at: at, created_at: at },
  { id: "a-2", customer_id: "c-1", channel: "in_mall", label: null, place_name: "Test Shop", use_count: 1, last_used_at: at, created_at: at },
];

let held: string[] = [];
const useGetCustomer = vi.fn();
const useGetLoyaltyMember = vi.fn();
const useListCustomerAddresses = vi.fn();
const confirm = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useGetCustomer: (...a: unknown[]) => useGetCustomer(...a),
  useGetLoyaltyMember: (...a: unknown[]) => useGetLoyaltyMember(...a),
  useListCustomerAddresses: (...a: unknown[]) => useListCustomerAddresses(...a),
  useEraseCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useListBranches: () => ({ data: [] }),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => confirm }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("./customer-dialog", () => ({ CustomerDialog: () => null }));
vi.mock("./merge-dialog", () => ({ MergeDialog: () => null }));
vi.mock("@/features/loyalty/admin/members/adjust-dialog", () => ({ AdjustDialog: () => null }));
vi.mock("@/features/loyalty/admin/members/google-object-dialog", () => ({ GoogleObjectDialog: () => null }));
vi.mock("@/features/loyalty/admin/members/leave-programme-dialog", () => ({
  LeaveProgrammeButton: () => <button type="button">Remove from loyalty programme</button>,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CustomerDetailSheet } = await import("./customer-detail-sheet");

type Enabled = { query: { enabled: boolean } };
const enabled = (fn: typeof useGetCustomer, arg: number) => (fn.mock.calls[fn.mock.calls.length - 1][arg] as Enabled).query.enabled;

const mount = (readOnly = false) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CustomerDetailSheet customerId="c-1" readOnly={readOnly} onOpenChange={() => {}} onOpenOrder={() => {}} />
    </QueryClientProvider>,
  );

const action = (name: RegExp | string) => screen.queryByRole("button", { name });

beforeEach(() => {
  confirm.mockReset().mockResolvedValue(false);
  useGetCustomer.mockReset().mockImplementation(() => ({ data: detail, isLoading: false, isError: false, error: null, refetch: vi.fn() }));
  useGetLoyaltyMember.mockReset().mockImplementation(() => ({ data: card, isLoading: false, isError: false, error: null, refetch: vi.fn() }));
  useListCustomerAddresses.mockReset().mockImplementation(() => ({ data: addresses, isLoading: false, isError: false, error: null, refetch: vi.fn() }));
});

describe("CustomerDetailSheet", () => {
  it("customers.view alone: identity, consent read-only with its note — and nothing of the card", () => {
    held = ["customers.view"];
    mount();
    expect(enabled(useGetCustomer, 1)).toBe(true);
    expect(enabled(useGetLoyaltyMember, 2)).toBe(false);

    expect(screen.getByRole("heading", { name: /Sara Ali/ })).toHaveTextContent("Member");
    expect(screen.getAllByText("+20 100 000 0001").length).toBeGreaterThan(0);
    expect(screen.getByText("Arabic")).toBeInTheDocument();
    expect(screen.getByText("March 14")).toBeInTheDocument();
    expect(screen.getByText("Online order")).toBeInTheDocument();
    expect(screen.getByText("Opted out")).toBeInTheDocument();
    expect(screen.getByText(/Only the customer can change/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: "Loyalty" })).not.toBeInTheDocument();
    for (const name of [/^Edit$/, /Merge into/, /Erase customer/, /Adjust balance/, /Remove from loyalty programme/]) expect(action(name)).not.toBeInTheDocument();
  });

  it("only a loyalty read: the card as it always was, the customer never asked for", () => {
    held = ["loyalty.members.list"];
    mount();
    expect(enabled(useGetCustomer, 1)).toBe(false);
    expect(enabled(useGetLoyaltyMember, 2)).toBe(true);
    expect(screen.getByRole("heading", { name: "Loyalty" })).toBeInTheDocument();
    expect(screen.getByText("Rewards earned")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Details" })).not.toBeInTheDocument();
    expect(screen.queryByText("Total spent")).not.toBeInTheDocument();
    expect(screen.queryByText("Opted out")).not.toBeInTheDocument();
  });

  it("a customer who is not a member: the card is not asked for", () => {
    held = ["customers.view", "loyalty.read"];
    useGetCustomer.mockImplementation(() => ({ data: { ...detail, customer: { ...detail.customer, is_member: false } }, isLoading: false, isError: false, error: null, refetch: vi.fn() }));
    mount();
    expect(enabled(useGetLoyaltyMember, 2)).toBe(false);
    expect(screen.queryByRole("heading", { name: "Loyalty" })).not.toBeInTheDocument();
  });

  it("addresses need customers.addresses.view: without it the section is not drawn and nothing is fetched", () => {
    held = ["customers.view"];
    mount();
    expect(screen.queryByRole("heading", { name: "Addresses" })).not.toBeInTheDocument();
    expect(useListCustomerAddresses).not.toHaveBeenCalled();
  });

  it("with it: label, a followable line, how often and when — a labelless one is named by its channel", () => {
    held = ["customers.view", "customers.addresses.view"];
    mount();
    expect(screen.getByRole("heading", { name: "Addresses" })).toBeInTheDocument();
    expect(useListCustomerAddresses).toHaveBeenCalledWith("c-1");
    const rows = screen.getAllByTestId("customer-address");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Home");
    expect(rows[0]).toHaveTextContent("Unit 12 · Floor 3 · Test Street · Blue gate");
    expect(rows[0]).toHaveTextContent("Used 7×");
    expect(rows[1]).toHaveTextContent("In-mall");
    expect(rows[1]).toHaveTextContent("Test Shop");
  });

  it("no saved addresses says how one comes to be", () => {
    held = ["customers.view", "customers.addresses.view"];
    useListCustomerAddresses.mockImplementation(() => ({ data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() }));
    mount();
    expect(screen.getByText(/No saved addresses/)).toBeInTheDocument();
  });

  it("each action follows its own capability — merge is not edit's", () => {
    held = ["customers.view", "customers.edit", "loyalty.read"];
    mount();
    expect(action(/^Edit$/)).toBeInTheDocument();
    expect(action(/Merge into/)).not.toBeInTheDocument();
    expect(action(/Erase customer/)).not.toBeInTheDocument();
    expect(action(/Adjust balance/)).not.toBeInTheDocument();
  });

  it("holding everything shows everything; read-only (from an order) shows none of it", () => {
    held = ["customers.view", "customers.edit", "customers.merge", "customers.erase", "loyalty.members.list", "loyalty.points.adjust", "loyalty.members.delete"];
    const first = mount();
    for (const name of [/^Edit$/, /Merge into/, /Erase customer/, /Adjust balance/, /Remove from loyalty programme/]) expect(action(name)).toBeInTheDocument();
    first.unmount();

    mount(true);
    expect(screen.getByRole("heading", { name: "Loyalty" })).toBeInTheDocument();
    for (const name of [/^Edit$/, /Merge into/, /Erase customer/, /Adjust balance/, /Remove from loyalty programme/]) expect(action(name)).not.toBeInTheDocument();
  });

  it("erase says the loyalty membership and the wallet card go too", async () => {
    held = ["customers.view", "customers.erase"];
    mount();
    await userEvent.click(screen.getByRole("button", { name: /Erase customer/ }));
    const asked = confirm.mock.calls[0][0] as { description: string; destructive: boolean };
    expect(asked.description).toMatch(/the membership and the wallet card are removed too/);
    // The cascade: every place their name and number were typed, and where they live.
    expect(asked.description).toMatch(/orders, deliveries, bookings and open bills, their saved addresses/);
    expect(asked.destructive).toBe(true);
  });
});
