/**
 * The studio's basics section must show a picture for an asset-pipeline item
 * (`image` set, `image_url` null) exactly as for a legacy-only item, since
 * `imageUrl`/`hasRemovableImage` used to be derived from `studio.image_url`
 * alone.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: true, platform: false, role_kinds: [], capabilities: [], ask_manager: [], limits: {} }) };
});
vi.mock("@tanstack/react-router", () => ({
  Link: (p: { children: React.ReactNode }) => <a>{p.children}</a>,
  useNavigate: () => vi.fn(),
  getRouteApi: () => ({
    useParams: () => ({ itemId: "m-1" }),
    useSearch: () => ({ tab: undefined }),
  }),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));
vi.mock("../util", () => ({ invalidateCatalog: vi.fn() }));

// Only the "Item details" section (the image) is under test — the rest of
// the studio pulls in its own large hook surface (recipes, modifiers…).
vi.mock("../recipe/recipe-grid", () => ({ RecipeGrid: () => null }));
vi.mock("../recipe/modeling-api", () => ({
  asStudioExt: (s: unknown) => s,
  recipeLinkKey: (id: string) => ["link", id],
  useRecipeBases: () => ({ data: [] }),
  useRecipeLink: () => ({ data: undefined }),
}));
vi.mock("./section-steps", () => ({ SectionSteps: () => null }));
vi.mock("./section-modifiers", () => ({ SectionModifiers: () => null }));
vi.mock("./section-options", () => ({ SectionOptions: () => null }));

vi.mock("@/data/api/generated/api", () => ({
  useGetStudio: () => useGetStudio(),
  useListCatalog: () => ({ data: [] }),
  useListCategories: () => ({ data: [] }),
  duplicateItem: vi.fn(),
  getGetMenuItemQueryOptions: (id: string) => ({ queryKey: ["item", id], queryFn: vi.fn() }),
  putItemOptions: vi.fn(),
  putModifierGroups: vi.fn(),
  putRecipeSteps: vi.fn(),
  putSizeRecipe: vi.fn(),
  putSizes: vi.fn(),
  updateMenuItem: vi.fn(),
  uploadMenuItemImage: vi.fn(),
}));

let useGetStudio = () => ({ data: undefined as unknown, isLoading: false, isError: false });

await import("@/i18n");
const { MenuStudioPage } = await import("./menu-studio-page");

function wrap(studio: Record<string, unknown>) {
  useGetStudio = () => ({ data: studio, isLoading: false, isError: false });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MenuStudioPage /></QueryClientProvider>);
}

const baseStudio = {
  id: "m-1",
  org_id: "org-1",
  name: "Latte",
  name_translations: null,
  description: null,
  category_id: null,
  is_active: true,
  availability: {},
  catalog_revision: 1,
  modifier_groups: [],
  options: [],
  recipe_steps: [],
  sizes: [],
  used_in_bundles: [],
};

describe("MenuStudioPage item image", () => {
  it("shows an asset-pipeline image (image set, image_url null)", () => {
    wrap({
      ...baseStudio,
      image_url: null,
      image: { group_id: "g", variants: { thumb: null, tile: { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" }, full: null, original: null } },
    });
    expect(document.querySelector("img")).toHaveAttribute("src", "https://a/tile.webp");
  });

  it("still shows a legacy-only image", () => {
    wrap({ ...baseStudio, image_url: "https://old/legacy.jpg", image: null });
    expect(document.querySelector("img")).toHaveAttribute("src", "https://old/legacy.jpg");
  });

  it("offers no removal when there is neither an asset nor a legacy url", () => {
    wrap({ ...baseStudio, image_url: null, image: null });
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });
});
