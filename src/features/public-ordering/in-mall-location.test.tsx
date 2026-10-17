/**
 * The branch's "Require GPS location" toggle (`in_mall_require_location`) on an
 * in-mall order. On: the location step runs. Off: nothing is asked, the order
 * goes without coordinates, its flat fee still shows, and shop, floor and unit
 * stay required. The steps are stubbed (they have their own tests); the page's
 * decisions are what is under test. Phones and addresses are invented.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CartLine } from "./types";

const createOrder = vi.fn();
const quoteCalls: { channel: string; enabled: boolean }[] = [];
let requireLocation = true;
let pastLocations: unknown[] = [];

const branchRow = () => ({
  id: "b-1", name: "Downtown", otp_required: false,
  in_mall_enabled: true, outside_enabled: true, umbrella_enabled: false, pickup_enabled: false,
  in_mall_open_now: true, outside_open_now: true, umbrella_open_now: false, pickup_open_now: false,
  in_mall_require_location: requireLocation,
});

vi.mock("@/data/api/generated/api", () => ({
  usePublicBranches: () => ({ data: [branchRow()], isLoading: false }),
  usePublicMenu: () => ({ data: { addons: [], discount: null } }),
  useDeliveryQuote: (_b: string, p: { channel: string }, opts?: { query?: { enabled?: boolean } }) => {
    const enabled = !!opts?.query?.enabled;
    quoteCalls.push({ channel: p.channel, enabled });
    return { data: enabled ? { status: "ok", fee: 1500 } : undefined };
  },
  useGuestOrderHistory: () => ({ data: [] }),
  useGuestPastLocations: () => ({ data: pastLocations }),
  useCreateDeliveryOrder: () => ({ mutateAsync: createOrder, isPending: false }),
  createDeliveryOrder: vi.fn(),
  useOtpRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOtpVerify: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOrderNowReplaceIdentity: () => ({ mutateAsync: vi.fn() }),
  useOrderNowCombine: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/features/public-shell/use-brand", () => ({ usePublicBrand: () => null }));
vi.mock("@/features/public-shell/use-public-theme", () => ({
  usePublicTheme: { getState: () => ({ apply: vi.fn(), restoreGlobal: vi.fn() }) },
}));
vi.mock("./components/step-shell", () => ({
  StepShell: ({ step, children }: { step: string; children: React.ReactNode }) => <main data-step={step}>{children}</main>,
}));
vi.mock("./components/branch-step", () => ({ BranchStep: () => <div data-testid="branch-step" /> }));
vi.mock("./components/branch-selector", () => ({ BranchSelector: () => null }));
vi.mock("./components/channel-step", () => ({ ChannelStep: () => <div data-testid="channel-step" /> }));
vi.mock("./components/location-step", () => ({ LocationStep: () => <div data-testid="location-step" /> }));
vi.mock("./components/item-customizer", () => ({ ItemCustomizer: () => null }));
vi.mock("./components/checkout-channel-sheet", () => ({ CheckoutChannelSheet: () => null }));
vi.mock("./components/order-history-drawer", () => ({ OrderHistoryDrawer: () => null }));
vi.mock("./components/cart-sheet", () => ({
  CartSheet: () => null,
  Totals: ({ deliveryFee }: { deliveryFee?: number | null }) => <p data-testid="fee">{String(deliveryFee)}</p>,
  CartPanel: ({ onCheckout }: { onCheckout: () => void }) => (
    <button type="button" onClick={onCheckout}>
      Checkout
    </button>
  ),
}));
const line = { uid: "l-1", item: { id: "i-1" }, size_label: null, base_price: 5000, quantity: 1, addons: [], optionals: [], notes: null } as unknown as CartLine;
vi.mock("./components/menu-step", () => ({
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
const { PublicOrderingPage } = await import("./public-ordering-page");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PublicOrderingPage orgId="org-1" branch="b-1" channel="in_mall" />
    </QueryClientProvider>,
  );

/** Menu → cart → checkout, with name and phone already there. */
const toCheckout = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "Add item" }));
  await userEvent.click(screen.getByRole("button", { name: "Checkout" }));
  await userEvent.type(screen.getByLabelText(/Full name/), "Sara Ali");
};

beforeEach(() => {
  localStorage.clear();
  // A phone this device used before, with OTP off: the phone step passes itself.
  localStorage.setItem("madar_guest_phone:org-1", "201000004567");
  requireLocation = true;
  pastLocations = [];
  quoteCalls.length = 0;
  createOrder.mockReset().mockResolvedValue({ id: "order-1" });
});

describe("in-mall, Require GPS location ON", () => {
  it("asks for the location before the menu", async () => {
    mount();
    expect(await screen.findByTestId("location-step")).toBeInTheDocument();
    expect(screen.queryByTestId("menu-step")).not.toBeInTheDocument();
  });
});

describe("in-mall, Require GPS location OFF", () => {
  beforeEach(() => {
    requireLocation = false;
  });

  it("does not ask: no location step, straight to the menu", async () => {
    mount();
    expect(await screen.findByTestId("menu-step")).toBeInTheDocument();
    expect(screen.queryByTestId("location-step")).not.toBeInTheDocument();
  });

  it("checkout shows the in-mall fee, and the order goes without coordinates", async () => {
    mount();
    await toCheckout();
    expect(screen.getByTestId("fee")).toHaveTextContent("1500");
    expect(quoteCalls.some((c) => c.channel === "in_mall" && c.enabled)).toBe(true);

    await userEvent.type(screen.getByLabelText(/Shop \/ company/), "Test Shop");
    await userEvent.type(screen.getByLabelText(/^Floor/), "2");
    await userEvent.type(screen.getByLabelText(/Unit \/ office/), "14");
    await userEvent.click(screen.getByRole("button", { name: /Place order/i }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    const sent = (createOrder.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(sent).toMatchObject({
      channel: "in_mall",
      place_name: "Test Shop",
      floor: "2",
      unit_number: "14",
      customer_lat: null,
      customer_lng: null,
    });
  });

  it("shop, floor and unit are still required", async () => {
    mount();
    await toCheckout();
    await userEvent.type(screen.getByLabelText(/Shop \/ company/), "Test Shop");
    await userEvent.type(screen.getByLabelText(/^Floor/), "2");
    await userEvent.click(screen.getByRole("button", { name: /Place order/i }));
    expect(await screen.findAllByText("Please enter the unit or office number.")).not.toHaveLength(0);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("a returning customer's saved shop, floor and unit are filled in, with no location taken from them", async () => {
    pastLocations = [
      { branch_id: "b-1", channel: "in_mall", place_name: "Test Shop", floor: "3", unit_number: "21", landmark: null,
        address_line: null, customer_lat: 30.0444, customer_lng: 31.2357, last_used_at: "2026-10-01T10:00:00Z" },
    ];
    mount();
    await toCheckout();
    expect(screen.getByLabelText(/Shop \/ company/)).toHaveValue("Test Shop");
    expect(screen.getByLabelText(/^Floor/)).toHaveValue("3");
    expect(screen.getByLabelText(/Unit \/ office/)).toHaveValue("21");
    await userEvent.click(screen.getByRole("button", { name: /Place order/i }));
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    const sent = (createOrder.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(sent).toMatchObject({ unit_number: "21", customer_lat: null, customer_lng: null });
  });
});
