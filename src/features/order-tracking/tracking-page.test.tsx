/**
 * The tracking page's step times read on the shop's clock, not the guest's
 * phone's (a visitor's phone on home time, a phone left on UTC). The tracking
 * payload names no zone yet, so it is Madar's (`APP_TZ`), as on the rest of the
 * ordering pages until the backend sends the branch's.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DeliveryTracking } from "@/data/api/generated/models/deliveryTracking";

const order: DeliveryTracking = {
  id: "d1", org_id: "o1", branch_name: "Zamalek", channel: "outside", customer_name: "Mona", status: "preparing",
  address_line: "12 Nile St", created_at: "2026-11-05T06:00:00Z", confirmed_at: "2026-11-05T06:05:00Z",
  preparing_at: "2026-11-05T06:12:00Z", delivery_fee: 0, discount_amount: 0, estimated_prep_minutes: 20,
  subtotal: 10000, tax_amount: 0, tax_inclusive: true, tax_rate_applied: 0, total: 10000,
};

vi.mock("@/data/api/generated/api", () => ({
  useTrackDeliveryOrder: () => ({ data: order, isLoading: false, isError: false }),
  usePublicOrgBrand: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: unknown }) => <a>{children as never}</a>,
}));

const i18n = (await import("@/i18n")).default;
const { OrderTrackingPage } = await import("./tracking-page");

beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.stubEnv("TZ", "America/New_York"); // the guest's phone
});
afterEach(() => vi.unstubAllEnvs());

describe("OrderTrackingPage times", () => {
  it("reads each step's time on the shop's clock, not the phone's", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OrderTrackingPage id="d1" />
      </QueryClientProvider>,
    );
    // 06:00Z is 08:00 in Cairo (+02:00 in November); New York would say 01:00.
    expect(screen.getByText("08:00 AM")).toBeInTheDocument();
    expect(screen.getByText("08:05 AM")).toBeInTheDocument();
    expect(screen.getByText("08:12 AM")).toBeInTheDocument();
  });
});
