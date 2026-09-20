/**
 * The ordering page, opened from a card: it lands on the menu with what the
 * customer last used, says so in one line, sends the order as the customer —
 * and where the server marked something stale, asks for just that, gently.
 *
 * The steps themselves are stubbed (the map, the menu and the cart have their
 * own tests); the page's decisions are what is under test. Addresses and
 * phones here are invented.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderNowAddress, OrderNowBranch } from "@/data/api/generated/models";

import type { CartLine } from "../types";
import type { OrderNowSession } from "./session";

const createOrder = vi.fn();
const navigate = vi.fn();
let quoteStatus: "ok" | "out_of_range" = "ok";

const branchRow = {
  id: "b-1", name: "Downtown", otp_required: true,
  in_mall_enabled: true, outside_enabled: true, umbrella_enabled: false, pickup_enabled: true,
  in_mall_open_now: true, outside_open_now: true, umbrella_open_now: false, pickup_open_now: true,
  in_mall_require_location: true,
};

vi.mock("@/data/api/generated/api", () => ({
  usePublicBranches: () => ({ data: [branchRow], isLoading: false }),
  usePublicMenu: () => ({ data: { addons: [], discount: null } }),
  useDeliveryQuote: (_b: string, _p: unknown, opts?: { query?: { enabled?: boolean } }) => ({
    data: opts?.query?.enabled ? { status: quoteStatus, fee: 1500 } : undefined,
  }),
  useGuestOrderHistory: () => ({ data: [] }),
  useGuestPastLocations: () => ({ data: [] }),
  useCreateDeliveryOrder: () => ({ mutateAsync: createOrder, isPending: false }),
  createDeliveryOrder: vi.fn(),
  useOtpRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOtpVerify: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOrderNowReplaceIdentity: () => ({ mutateAsync: vi.fn() }),
  useOrderNowCombine: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/features/public-shell/use-brand", () => ({ usePublicBrand: () => null }));
vi.mock("@/features/public-shell/use-public-theme", () => ({
  usePublicTheme: { getState: () => ({ apply: vi.fn(), restoreGlobal: vi.fn() }) },
}));
vi.mock("motion/react", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
  };
});
vi.mock("../components/step-shell", () => ({
  StepShell: ({ step, children }: { step: string; children: React.ReactNode }) => <main data-step={step}>{children}</main>,
}));
vi.mock("../components/branch-step", () => ({ BranchStep: () => <div data-testid="branch-step" /> }));
vi.mock("../components/branch-selector", () => ({ BranchSelector: () => null }));
vi.mock("../components/channel-step", () => ({ ChannelStep: () => <div data-testid="channel-step" /> }));
vi.mock("../components/location-step", () => ({ LocationStep: () => <div data-testid="location-step" /> }));
vi.mock("../components/item-customizer", () => ({ ItemCustomizer: () => null }));
vi.mock("../components/checkout-channel-sheet", () => ({ CheckoutChannelSheet: () => null }));
vi.mock("../components/order-history-drawer", () => ({ OrderHistoryDrawer: () => null }));
vi.mock("../components/cart-sheet", () => ({
  CartSheet: () => null,
  Totals: () => null,
  CartPanel: ({ onCheckout }: { onCheckout: () => void }) => (
    <button type="button" onClick={onCheckout}>
      Checkout
    </button>
  ),
}));
const line = { uid: "l-1", item: { id: "i-1" }, size_label: null, base_price: 5000, quantity: 1, addons: [], optionals: [], notes: null } as unknown as CartLine;
vi.mock("../components/menu-step", () => ({
  MenuStep: ({ onAdd, cartSlot }: { onAdd: (l: CartLine) => void; cartSlot: React.ReactNode }) => (
    <div data-testid="menu-step">
      <button type="button" onClick={() => onAdd(line)}>
        Add item
      </button>
      {cartSlot}
    </div>
  ),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { PublicOrderingPage } = await import("../public-ordering-page");

const home: OrderNowAddress = {
  id: "a-1", customer_id: "c-1", channel: "outside", label: "Home", address_line: "Test Street", floor: "3",
  lat: 30.01, lng: 31.02, use_count: 4, last_used_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z", stale: false,
};
const lastBranch: OrderNowBranch = { id: "b-1", name: "Downtown", channel: "outside", stale: false };

const sessionOf = (over: Partial<OrderNowSession> = {}): OrderNowSession => ({
  memberToken: "card-token",
  orgId: "org-1",
  customer: { id: "c-1", name: "Sara Ali", phone: "201000004567" },
  deviceToken: "tok-mine",
  lastBranch,
  addresses: [home],
  paymentHint: "card",
  onIdentityReplaced: vi.fn(),
  ...over,
});

const mount = (session: OrderNowSession, url: { branch?: string; channel?: string } = { branch: "b-1", channel: "outside" }) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PublicOrderingPage orgId="org-1" orderNow={session} {...url} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  quoteStatus = "ok";
  navigate.mockReset();
  createOrder.mockReset().mockResolvedValue({ id: "order-1" });
});

describe("the ordering page, opened from a card", () => {
  it("lands on the menu — no phone step, no location step — and says where it is going", async () => {
    mount(sessionOf());
    expect(await screen.findByTestId("menu-step")).toBeInTheDocument();
    expect(screen.queryByTestId("location-step")).not.toBeInTheDocument();
    expect(screen.getByText("Welcome back, Sara")).toBeInTheDocument();
    expect(screen.getByText("Delivering to Home")).toBeInTheDocument();
    expect(screen.getByText("Downtown")).toBeInTheDocument();
  });

  it("everything is prefilled and editable, and the order is sent as the customer: member_token, their proof, their saved pin", async () => {
    mount(sessionOf());
    await userEvent.click(await screen.findByRole("button", { name: "Add item" }));
    await userEvent.click(screen.getByRole("button", { name: "Checkout" }));

    expect(screen.getByLabelText(/Full name/)).toHaveValue("Sara Ali");
    const phone = screen.getByRole("textbox", { name: /Phone/ });
    expect(phone).toHaveValue("01000004567");
    expect(phone).not.toHaveAttribute("readonly");
    expect(screen.getByDisplayValue("Test Street")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Place order/i }));
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    const sent = (createOrder.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(sent).toMatchObject({
      member_token: "card-token",
      device_token: "tok-mine",
      branch_id: "b-1",
      channel: "outside",
      customer_name: "Sara Ali",
      address_line: "Test Street",
      floor: "3",
      customer_lat: 30.01,
      customer_lng: 31.02,
      payment_method_hint: "card",
    });
    expect(sent.identity_change).toBeUndefined();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/track/$id", params: { id: "order-1" } })));
  });

  it("Change goes back to where the order is sent, with everything else kept", async () => {
    mount(sessionOf());
    await userEvent.click(await screen.findByRole("button", { name: "Change" }));
    expect(await screen.findByTestId("location-step")).toBeInTheDocument();
  });

  it("stale address: the location step asks again and says why — the rest is kept", async () => {
    mount(sessionOf({ addresses: [{ ...home, stale: true, stale_reason: "out_of_zone" }] }));
    expect(await screen.findByTestId("location-step")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Home is outside Downtown’s delivery area now. Choose where to send this order.");
    expect(screen.queryByTestId("menu-step")).not.toBeInTheDocument();
  });

  it("a paused zone says paused, not moved", async () => {
    mount(sessionOf({ addresses: [{ ...home, stale: true, stale_reason: "zone_unavailable" }] }));
    expect(await screen.findByRole("status")).toHaveTextContent("Delivery to Home is paused right now.");
  });

  it("a pin the quote now refuses goes back to the location step too", async () => {
    quoteStatus = "out_of_range";
    mount(sessionOf());
    expect(await screen.findByTestId("location-step")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/outside Downtown’s delivery area/);
  });

  it("stale branch: the ordinary branch chooser, with a line saying why", async () => {
    mount(sessionOf({ lastBranch: { ...lastBranch, stale: true, stale_reason: "branch_unavailable" } }), {});
    expect(await screen.findByTestId("branch-step")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Downtown isn’t taking online orders right now.");
  });

  it("a closed channel: the branch is kept and only the channel is asked for", async () => {
    mount(sessionOf({ lastBranch: { ...lastBranch, stale: true, stale_reason: "channel_closed" } }), { branch: "b-1" });
    expect(await screen.findByTestId("channel-step")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/isn’t taking that kind of order right now/);
  });

  it("in-mall still asks for the device's location where the branch requires it: a saved address is not proof of being there", async () => {
    const shop: OrderNowAddress = { ...home, id: "a-2", channel: "in_mall", label: null, place_name: "Test Shop", floor: "2", unit_number: "14", lat: null, lng: null };
    mount(sessionOf({ lastBranch: { ...lastBranch, channel: "in_mall" }, addresses: [shop] }), { branch: "b-1", channel: "in_mall" });
    expect(await screen.findByTestId("location-step")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
