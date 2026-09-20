/**
 * The order → member link: the member's name opens the member for someone who
 * may read one, stays plain text otherwise, and a deleted member is never a link.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderFull } from "@/data/api/generated/models";

let held: string[] = [];
let order: Partial<OrderFull> = {};

vi.mock("@/data/api/generated/api", () => ({
  useGetOrder: () => ({ data: order, isLoading: false }),
  useListCatalog: () => ({ data: [] }),
  useGetDeliveryOrder: () => ({ data: undefined }),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("@/features/loyalty/admin/members/member-detail-sheet", () => ({
  MemberDetailSheet: ({ memberId, canAdjust, onOpenOrder }: { memberId: string | null; canAdjust: boolean; onOpenOrder: (id: string) => void }) =>
    memberId ? (
      <div data-testid="member-sheet" data-member={memberId} data-adjust={String(canAdjust)}>
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
});

describe("OrderDetailSheet — the loyalty member", () => {
  it.each([["loyalty.read"], ["loyalty.members.list"]])("with %s the name opens the member, read-only", async (cap) => {
    held = [cap];
    mount();
    await userEvent.click(screen.getByRole("button", { name: "Sara Ali" }));
    const sheet = screen.getByTestId("member-sheet");
    expect(sheet).toHaveAttribute("data-member", "m-1");
    expect(sheet).toHaveAttribute("data-adjust", "false");
  });

  it("without either capability the name is plain text", () => {
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
