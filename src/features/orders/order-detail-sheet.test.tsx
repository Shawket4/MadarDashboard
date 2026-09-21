/**
 * The order → member link: the member's name opens the person (a member is a
 * customer under the same id) for someone who may read either side of them,
 * stays plain text otherwise, and a deleted member is never a link.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderFull } from "@/data/api/generated/models";

let held: string[] = [];
let order: Partial<OrderFull> = {};
let delivery: Record<string, unknown> | undefined;
const useGetCustomer = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useGetOrder: () => ({ data: order, isLoading: false }),
  useListCatalog: () => ({ data: [] }),
  useGetDeliveryOrder: () => ({ data: delivery }),
  useGetCustomer: (...a: unknown[]) => useGetCustomer(...a),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("@/features/customers/customer-detail-sheet", () => ({
  CustomerDetailSheet: ({ customerId, readOnly, onOpenOrder }: { customerId: string | null; readOnly?: boolean; onOpenOrder: (id: string) => void }) =>
    customerId ? (
      <div data-testid="member-sheet" data-member={customerId} data-read-only={String(!!readOnly)}>
        <button onClick={() => onOpenOrder("o-2")}>other order</button>
        <button onClick={() => onOpenOrder("o-1")}>this order</button>
      </div>
    ) : null,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { OrderDetailSheet } = await import("./order-detail-sheet");

const baseOrder = {
  id: "o-1",
  order_number: 12,
  status: "completed",
  order_type: "dine_in",
  items: [],
  payments: [],
  created_at: "2026-09-10T10:00:00Z",
  loyalty_customer_id: "m-1",
  loyalty_member_name: "Sara Ali",
} as unknown as Partial<OrderFull>;

function mount() {
  const onSwitchOrder = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrderDetailSheet orderId="o-1" open onOpenChange={() => {}} onSwitchOrder={onSwitchOrder} />
    </QueryClientProvider>,
  );
  return { onSwitchOrder };
}

beforeEach(() => {
  order = { ...baseOrder };
  delivery = undefined;
  useGetCustomer.mockReset().mockReturnValue({ data: undefined });
});

describe("OrderDetailSheet — the loyalty member", () => {
  it.each([["loyalty.read"], ["loyalty.members.list"], ["customers.view"]])("with %s the name opens the person by the same id, read-only", async (cap) => {
    held = [cap];
    mount();
    await userEvent.click(screen.getByRole("button", { name: "Sara Ali" }));
    const sheet = screen.getByTestId("member-sheet");
    expect(sheet).toHaveAttribute("data-member", "m-1");
    expect(sheet).toHaveAttribute("data-read-only", "true");
  });

  it("without any of them the name is plain text", () => {
    held = [];
    mount();
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sara Ali" })).not.toBeInTheDocument();
  });

  it("a deleted member is never a link", () => {
    held = ["loyalty.read"];
    order = { ...baseOrder, loyalty_member_name: null };
    mount();
    expect(screen.getByText("Deleted member")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deleted member" })).not.toBeInTheDocument();
  });

  it("another of the member's orders switches the sheet; this one only closes the member", async () => {
    held = ["loyalty.read"];
    const { onSwitchOrder } = mount();
    await userEvent.click(screen.getByRole("button", { name: "Sara Ali" }));
    await userEvent.click(screen.getByRole("button", { name: "this order" }));
    expect(onSwitchOrder).not.toHaveBeenCalled();
    expect(screen.queryByTestId("member-sheet")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sara Ali" }));
    await userEvent.click(screen.getByRole("button", { name: "other order" }));
    expect(onSwitchOrder).toHaveBeenCalledWith("o-2");
  });
});

describe("OrderDetailSheet — the customer", () => {
  const withCustomer = { ...baseOrder, loyalty_customer_id: null, loyalty_member_name: null, customer_id: "c-9", customer_name: "Omar" };

  it("with customers.view the name on the order opens the customer", async () => {
    held = ["customers.view"];
    order = withCustomer;
    mount();
    await userEvent.click(screen.getByRole("button", { name: "Omar" }));
    expect(screen.getByTestId("member-sheet")).toHaveAttribute("data-member", "c-9");
  });

  it("a loyalty read is not customers.view: the customer's name stays text", () => {
    held = ["loyalty.read"];
    order = withCustomer;
    mount();
    expect(screen.getByText("Omar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Omar" })).not.toBeInTheDocument();
  });

  it("an order with no customer_id is never a link", () => {
    held = ["customers.view"];
    order = { ...withCustomer, customer_id: null };
    mount();
    expect(screen.queryByRole("button", { name: "Omar" })).not.toBeInTheDocument();
  });

  it("a one-time order for someone else says who ordered and who the driver calls", () => {
    held = ["customers.view"];
    order = { ...withCustomer, order_type: "delivery", delivery_order_id: "d-1", delivery: { channel: "outside", customer_phone: "201000000002" } } as never;
    delivery = { id: "d-1", contact_override: true, customer_name: "Omar", customer_phone: "201000000002" };
    useGetCustomer.mockReturnValue({ data: { customer: { id: "c-9", name: "Sara Ali" } } });
    mount();
    expect(screen.getByRole("note")).toHaveTextContent("Ordered by Sara Ali for Omar · +20 100 000 0002");
  });

  it("an ordinary delivery carries no such note, and the customer is not fetched for one", () => {
    held = ["customers.view"];
    order = { ...withCustomer, order_type: "delivery", delivery_order_id: "d-1", delivery: { channel: "outside", customer_phone: "201000000002" } } as never;
    delivery = { id: "d-1", contact_override: false, customer_name: "Omar", customer_phone: "201000000002" };
    mount();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    const opts = useGetCustomer.mock.calls[useGetCustomer.mock.calls.length - 1][1] as { query: { enabled: boolean } };
    expect(opts.query.enabled).toBe(false);
  });
});
