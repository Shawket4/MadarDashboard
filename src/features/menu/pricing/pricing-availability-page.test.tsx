/**
 * The mobile item card's collapsed chip must show a picture for an
 * asset-pipeline item (`image` set, `image_url` null) exactly as it does for
 * a legacy-only item — it used to gate on `image_url` alone.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b-1", isAllBranches: false }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
vi.mock("./util", () => ({ invalidatePricingOverrides: vi.fn() }));

const EMPTY_LIST = { data: [], total: 0, total_pages: 0 };
let items: unknown[] = [];
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: () => ({ data: [{ id: "b-1", name: "Main" }], isLoading: false }),
  useListMenuCatalog: () => ({ data: { data: items, total: items.length, total_pages: 1 }, isLoading: false, isError: false, isFetching: false }),
  useListAddonCatalog: () => ({ data: EMPTY_LIST, isLoading: false, isError: false }),
  useListBranchAddonOverrides: () => ({ data: [], isLoading: false, isError: false }),
  useListChannelAddonOverrides: () => ({ data: [] }),
  useGetStudio: () => ({ data: undefined, isLoading: false, isError: false }),
  putPriceOverride: vi.fn(),
  deletePriceOverride: vi.fn(),
}));

await import("@/i18n");
const { PricingAvailabilityPage } = await import("./pricing-availability-page");

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><PricingAvailabilityPage /></QueryClientProvider>);
}

const baseItem = {
  id: "m-1",
  name: "Latte",
  name_translations: null,
  base_price: 1000,
  category_id: null,
  is_active: true,
  sku_costs: [],
};

describe("PricingAvailabilityPage item card image", () => {
  it("shows an asset-pipeline image (image set, image_url null)", () => {
    items = [{
      ...baseItem,
      image_url: null,
      image: { group_id: "g", variants: { thumb: null, tile: { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" }, full: null, original: null } },
    }];
    wrap();
    expect(document.querySelector("img")).toHaveAttribute("src", "https://a/tile.webp");
  });

  it("still shows a legacy-only image", () => {
    items = [{ ...baseItem, image_url: "https://old/legacy.jpg", image: null }];
    wrap();
    expect(document.querySelector("img")).toHaveAttribute("src", "https://old/legacy.jpg");
  });

  it("falls back to the icon placeholder when neither is set", () => {
    items = [{ ...baseItem, image_url: null, image: null }];
    wrap();
    expect(screen.getByText("Latte")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });
});
