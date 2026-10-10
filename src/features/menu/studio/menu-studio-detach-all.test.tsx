/**
 * Removing EVERY group from an item and saving must send an explicit empty
 * set (`{ groups: [] }`): the server reads an omitted set as "no change", and
 * only `[]` detaches them all. Custom (untyped) groups are in the list too.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useCan: () => true,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u",
        epoch: 0,
        spec_version: 0,
        owner: true,
        platform: false,
        role_kinds: ["org_admin"],
        capabilities: ["recipes.read", "recipes.edit", "menu.items.read", "menu.items.edit"],
        ask_manager: [],
        limits: {},
      }),
  };
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

// The Modifiers section is real; everything else is out of the way.
vi.mock("../recipe/recipe-grid", () => ({ RecipeGrid: () => null }));
vi.mock("./section-steps", () => ({ SectionSteps: () => null }));
vi.mock("./section-options", () => ({ SectionOptions: () => null }));
vi.mock("./preview/preview-panel", () => ({ PreviewPanel: () => null }));
vi.mock("./section-meal", () => ({ SectionMeal: () => null }));
vi.mock("@/features/menu/groups/group-editor-dialog", () => ({ GroupEditorDialog: () => null }));

const api = vi.hoisted(() => ({
  putModifierGroups: vi.fn(),
  putItemOptions: vi.fn(),
  updateMenuItem: vi.fn(),
  putSizes: vi.fn(),
}));

vi.mock("@/data/api/generated/api", () => ({
  getGetRecipeLinkQueryKey: (id: string) => ["link", id],
  getGetStudioQueryKey: (id: string) => ["studio", id],
  getGetItemCostQueryKey: (id: string) => ["cost", id],
  getListCatalogQueryKey: (id: string) => ["catalog", id],
  useListBases: () => ({ data: [] }),
  useGetRecipeLink: () => ({ data: undefined }),
  useGetStudio: () => useGetStudio(),
  useListCatalog: () => ({ data: [] }),
  useListStepPresets: () => ({ data: undefined }),
  useListCategories: () => ({ data: [] }),
  useListGroups: () => ({ data: [] }),
  duplicateItem: vi.fn(),
  getGetMenuItemQueryOptions: (id: string) => ({ queryKey: ["item", id], queryFn: vi.fn() }),
  putItemOptions: api.putItemOptions,
  putModifierGroups: api.putModifierGroups,
  putRecipeSteps: vi.fn(),
  putSizeRecipe: vi.fn(),
  putSizes: api.putSizes,
  updateMenuItem: api.updateMenuItem,
  uploadMenuItemImage: vi.fn(),
}));

let useGetStudio = () => ({ data: undefined as unknown, isLoading: false, isError: false });

await import("@/i18n");
const { MenuStudioPage } = await import("./menu-studio-page");

const option = (id: string, name: string, price: number) => ({
  id,
  name,
  price,
  is_default: false,
  is_active: true,
  included: true,
  replaces_ingredient_id: null,
  recipe: [],
  cost_piastres: null,
  cost_incomplete: false,
});

const group = (id: string, name: string, legacyType: string | null, sort: number, opt: ReturnType<typeof option>) => ({
  attachment_id: `att-${id}`,
  group_id: id,
  name,
  name_translations: {},
  selection_type: "multi",
  legacy_addon_type: legacyType,
  min: 0,
  max: null,
  is_required: false,
  sort,
  options: [opt],
});

const studio = {
  id: "m-1",
  org_id: "org-1",
  name: "Latte",
  name_translations: null,
  description: null,
  image_url: null,
  image: null,
  category_id: null,
  is_active: true,
  availability: {},
  catalog_revision: 1,
  modifier_groups: [
    group("g-extras", "Extras", "extra", 0, option("o-shot", "Extra shot", 700)),
    // A custom group: no legacy type.
    group("g-toppings", "Toppings", null, 1, option("o-drizzle", "Caramel drizzle", 500)),
  ],
  options: [],
  recipe_steps: [],
  sizes: [],
};

function renderStudio() {
  useGetStudio = () => ({ data: studio, isLoading: false, isError: false });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MenuStudioPage />
    </QueryClientProvider>,
  );
}

describe("MenuStudioPage: removing every modifier group", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.putModifierGroups.mockResolvedValue({ ...studio, modifier_groups: [] });
  });

  it("saves an explicit empty set, and touches nothing else", async () => {
    renderStudio();
    expect(screen.getByText("Extras")).toBeInTheDocument();
    expect(screen.getByText("Toppings")).toBeInTheDocument();

    for (const button of screen.getAllByRole("button", { name: "Detach" })) fireEvent.click(button);
    expect(screen.queryByText("Toppings")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(api.putModifierGroups).toHaveBeenCalledTimes(1));
    expect(api.putModifierGroups).toHaveBeenCalledWith("m-1", { groups: [] });
    expect(api.putItemOptions).not.toHaveBeenCalled();
    expect(api.updateMenuItem).not.toHaveBeenCalled();
    expect(api.putSizes).not.toHaveBeenCalled();
  });

  it("keeps the remaining groups when only one is removed", async () => {
    renderStudio();
    fireEvent.click(screen.getAllByRole("button", { name: "Detach" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(api.putModifierGroups).toHaveBeenCalledTimes(1));
    const [, body] = api.putModifierGroups.mock.calls[0];
    expect(body.groups.map((g: { group_id: string }) => g.group_id)).toEqual(["g-toppings"]);
  });
});
