/**
 * A past order's date reads on its own branch's clock, not the guest's
 * phone's; from a backend that sends no zone yet, on Madar's default.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderHistorySummary } from "@/data/api/generated/models/orderHistorySummary";

const i18n = (await import("@/i18n")).default;
const { OrderHistoryDrawer } = await import("./order-history-drawer");

// 21:30Z on 31 December is already 1 January in Dubai; still 31 December in
// Cairo (+02:00) and in New York (the guest's phone).
const order = {
  id: "o1", branch_id: "b-dxb", branch_name: "Jumeirah", channel: "outside", created_at: "2026-12-31T21:30:00Z",
  customer_name: "Mona", delivery_fee: 0, discount_amount: 0, items: [{ name: "Latte", quantity: 1 }], status: "delivered",
  subtotal: 10000, tax_amount: 0, tax_inclusive: true, total: 10000,
} as OrderHistorySummary;

beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.stubEnv("TZ", "America/New_York");
});
afterEach(() => vi.unstubAllEnvs());

describe("OrderHistoryDrawer dates", () => {
  it("reads on the order's branch's clock", () => {
    render(<OrderHistoryDrawer open onOpenChange={vi.fn()} orders={[order]} zoneOf={(id) => (id === "b-dxb" ? "Asia/Dubai" : "Africa/Cairo")} />);
    expect(screen.getByText(/Jan 1, 2027/)).toBeInTheDocument();
  });

  it("reads on Madar's default clock when the branch's zone is not known (an older backend)", () => {
    render(<OrderHistoryDrawer open onOpenChange={vi.fn()} orders={[order]} />);
    expect(screen.getByText(/Dec 31, 2026/)).toBeInTheDocument();
  });
});
