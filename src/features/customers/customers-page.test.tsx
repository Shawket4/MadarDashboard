/**
 * The list: rows from the server, and the add button only for creators.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Customer } from "@/data/api/generated/models";

const rows: Customer[] = [
  { id: "c-1", name: "Sara Ali", phone: "01000000001", orders_count: 4, total_spent: 125050, last_order_at: "2026-09-10T10:00:00Z", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "c-2", name: "Omar", phone: null, orders_count: 0, total_spent: 0, last_order_at: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
];
let held: string[] = ["customers.view"];

vi.mock("@/data/api/generated/api", () => ({
  useListCustomers: () => ({ data: rows, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("./customer-detail-sheet", () => ({ CustomerDetailSheet: () => null }));
vi.mock("./customer-dialog", () => ({ CustomerDialog: () => null }));
vi.mock("@/features/orders/order-detail-sheet", () => ({ OrderDetailSheet: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CustomersPage } = await import("./customers-page");

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CustomersPage />
    </QueryClientProvider>,
  );

describe("CustomersPage", () => {
  it("renders a row per customer with phone, orders and money", () => {
    held = ["customers.view"];
    renderPage();
    const names = screen.getAllByTestId("customer-row").map((r) => r.textContent);
    expect(names).toContain("Sara Ali");
    expect(names).toContain("Omar");
    expect(screen.getAllByText("01000000001").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,250\.50/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Add customer/ })).not.toBeInTheDocument();
  });

  it("offers Add customer with customers.create", () => {
    held = ["customers.view", "customers.create"];
    renderPage();
    expect(screen.getByRole("button", { name: /Add customer/ })).toBeInTheDocument();
  });

  it("shows the restricted page without customers.view", () => {
    held = [];
    renderPage();
    expect(screen.queryByTestId("customer-row")).not.toBeInTheDocument();
    expect(screen.getByText(/Only people who can see customers/)).toBeInTheDocument();
  });
});
