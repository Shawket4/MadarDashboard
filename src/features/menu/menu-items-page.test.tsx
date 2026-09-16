/**
 * The grid must show a picture for items and categories on the asset
 * pipeline (`image`, `image_url` null) exactly as it does for legacy rows
 * (`image_url` only, `image` null) — a paginated list that only forwarded
 * `image_url` silently blanked every asset-pipeline row.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: true, platform: false, role_kinds: ["org_admin"], capabilities: ["recipes.read", "recipes.edit", "menu.items.read", "menu.items.edit"], ask_manager: [], limits: {} }) };
});
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));

const CATEGORIES = [{ id: "c-1", name: "Drinks", is_active: true, image_url: null }];
const ADDONS: unknown[] = [];
const ITEMS = [
  {
    id: "m-1",
    name: "Asset item",
    base_price: 1000,
    is_active: true,
    category_id: "c-1",
    sku_costs: [],
    image_url: null,
    image: { group_id: "g-1", variants: { thumb: null, tile: { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" }, full: null, original: null } },
  },
  {
    id: "m-2",
    name: "Legacy item",
    base_price: 500,
    is_active: true,
    category_id: "c-1",
    sku_costs: [],
    image_url: "https://old/legacy.jpg",
    image: null,
  },
  {
    id: "m-3",
    name: "No image item",
    base_price: 200,
    is_active: true,
    category_id: "c-1",
    sku_costs: [],
    image_url: null,
    image: null,
  },
];

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  useListCategories: () => ({ data: CATEGORIES }),
  useListAddonItems: () => ({ data: ADDONS }),
  useListMenuCatalog: () => ({ data: { data: ITEMS, total: ITEMS.length, total_pages: 1 }, isLoading: false, isFetching: false }),
  useListAddonCosts: () => ({ data: [] }),
  useListBranchMenuOverrides: () => ({ data: [] }),
  useListBranchAddonOverrides: () => ({ data: [] }),
  useDeleteMenuItem: () => ({ mutate: vi.fn() }),
  useDeleteOption: () => ({ mutate: vi.fn() }),
  useDeleteCategory: () => ({ mutate: vi.fn() }),
  getGetMenuItemQueryOptions: () => ({ queryKey: ["get-item"], queryFn: () => Promise.resolve(null) }),
  getGetStudioQueryOptions: () => ({ queryKey: ["get-studio"], queryFn: () => Promise.resolve(null) }),
  getListMenuCatalogQueryOptions: () => ({ queryKey: ["list-catalog"], queryFn: () => Promise.resolve(null) }),
  getListAddonItemsQueryOptions: () => ({ queryKey: ["list-addons"], queryFn: () => Promise.resolve(null) }),
  getListAddonCostsQueryOptions: () => ({ queryKey: ["list-addon-costs"], queryFn: () => Promise.resolve(null) }),
  listMenuCatalog: vi.fn(),
  createMenuItem: vi.fn(),
  duplicateItem: vi.fn(),
  patchOption: vi.fn(),
  updateCategory: vi.fn(),
  updateMenuItem: vi.fn(),
}));

// The item dialog and its siblings pull in a much larger hook surface
// (recipes, modifier groups, catalog…) irrelevant to the grid itself.
vi.mock("./menu-item-dialog", () => ({ MenuItemDialog: () => null }));
vi.mock("./addon-dialog", () => ({ AddonDialog: () => null }));
vi.mock("./addon-recipe-dialog", () => ({ AddonRecipeDialog: () => null }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));

await import("@/i18n");
const { MenuItemsPage } = await import("./menu-items-page");

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MenuItemsPage /></QueryClientProvider>);
}

describe("MenuItemsPage grid images", () => {
  it("renders an asset-pipeline item (image set, image_url null)", () => {
    wrap();
    const cell = screen.getByText("Asset item").closest("div[class]");
    const img = cell?.parentElement?.querySelector("img");
    expect(img).toHaveAttribute("src", "https://a/tile.webp");
  });

  it("still renders a legacy-only item (image_url only)", () => {
    wrap();
    const cell = screen.getByText("Legacy item").closest("div[class]");
    const img = cell?.parentElement?.querySelector("img");
    expect(img).toHaveAttribute("src", "https://old/legacy.jpg");
  });

  it("falls back to the icon placeholder when neither is set", () => {
    wrap();
    const cell = screen.getByText("No image item").closest("div[class]");
    expect(cell?.parentElement?.querySelector("img")).toBeNull();
  });
});
