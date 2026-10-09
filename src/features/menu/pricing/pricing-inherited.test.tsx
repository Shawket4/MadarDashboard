/**
 * An inactive size's cells inherit what the till charges for it: the server's
 * `unit_price` falls back to the item's lowest active size (unit-price.ts), not
 * the size's own catalogue price.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b-1", isAllBranches: false }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
vi.mock("./util", () => ({ invalidatePricingOverrides: vi.fn() }));

const EMPTY_LIST = { data: [], total: 0, total_pages: 0 };
const latte = { id: "m-1", name: "Latte", name_translations: null, base_price: 3000, category_id: null, is_active: true, sku_costs: [], image_url: null, image: null };
const studio = {
  sizes: [
    { id: "s-small", label: "Small", price: 3000, is_active: true, sort: 0 },
    { id: "s-medium", label: "Medium", price: 3400, is_active: false, sort: 1 },
  ],
  availability: { branches: [{ branch_id: "b-1", sizes: [], channels: [] }] },
};
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: () => ({ data: [{ id: "b-1", name: "Main" }], isLoading: false }),
  useListMenuCatalog: () => ({ data: { data: [latte], total: 1, total_pages: 1 }, isLoading: false, isError: false, isFetching: false }),
  useListAddonCatalog: () => ({ data: EMPTY_LIST, isLoading: false, isError: false }),
  useListBranchAddonOverrides: () => ({ data: [], isLoading: false, isError: false }),
  useListChannelAddonOverrides: () => ({ data: [] }),
  useGetStudio: () => ({ data: studio, isLoading: false, isError: false }),
  putPriceOverride: vi.fn(),
  deletePriceOverride: vi.fn(),
}));

await import("@/i18n");
const { PricingAvailabilityPage } = await import("./pricing-availability-page");

it("an inactive size with no branch price shows the lowest active size's price in every cell", () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}><PricingAvailabilityPage /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { expanded: false, name: /Latte/ }));
  const placeholders = screen.getAllByRole("spinbutton").map((i) => i.getAttribute("placeholder"));
  // Small (30) and the inactive Medium (30, not its own 34) × in-store + 4 channels.
  expect(placeholders).toEqual(Array(10).fill("30"));
});
