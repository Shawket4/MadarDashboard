/**
 * The item dialog writes the item's group set only when its add-on picks
 * changed. An explicit empty set now detaches every group (the item then
 * offers no add-ons), so an untouched picker must not send one: creating an
 * item or re-saving its name leaves its groups alone. Removing every add-on
 * does send the explicit `{ groups: [] }`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/recipes/recipe-builder", () => ({ RecipeBuilder: () => null }));
vi.mock("@/features/recipes/util", () => ({ invalidateRecipes: vi.fn() }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));
vi.mock("./util", () => ({
  ONE_SIZE: "one_size",
  arOf: () => "",
  invalidateCatalog: vi.fn(),
}));

const api = vi.hoisted(() => ({
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  putSizes: vi.fn(),
  putModifierGroups: vi.fn(),
}));

/** The full item the editor loads. */
let liveItem: unknown = undefined;

const addons = [
  { id: "a-shot", org_id: "org-1", name: "Extra shot", addon_type: "extra", default_price: 700, is_active: true },
  { id: "a-cream", org_id: "org-1", name: "Cream", addon_type: "extra", default_price: 500, is_active: true },
];
const groups = [
  { id: "g-extras", org_id: "org-1", name: "Extras", legacy_addon_type: "extra", options: [], is_item_options: false },
];

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  createMenuItem: api.createMenuItem,
  putModifierGroups: api.putModifierGroups,
  putSizeRecipe: vi.fn().mockResolvedValue({}),
  putSizes: api.putSizes,
  updateMenuItem: api.updateMenuItem,
  uploadMenuItemImage: vi.fn(),
  useGetMenuItem: () => ({ data: liveItem }),
  useListAddonItems: () => ({ data: addons }),
  useListCatalog: () => ({ data: [] }),
  useListGroups: () => ({ data: groups }),
}));
vi.mock("@/data/api/custom-instance", () => ({ customInstance: vi.fn() }));

await import("@/i18n");
const { MenuItemDialog } = await import("./menu-item-dialog");

const categories = [{ id: "c-1", org_id: "org-1", name: "Coffee", is_active: true }];

const item = {
  id: "m-1",
  name: "Latte",
  name_translations: null,
  description: null,
  description_translations: null,
  base_price: 6000,
  category_id: "c-1",
  is_active: true,
  image_url: null,
  image: null,
};

const full = (allowed: string[]) => ({
  ...item,
  sizes: [],
  all_sizes: [{ id: "s-1", menu_item_id: "m-1", label: "one_size", price_override: 6000, is_active: true }],
  recipes: [],
  allowed_addon_ids: allowed,
  addon_slots: [],
  optional_fields: [],
  recipe_steps: [],
});

function wrap(it: unknown) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MenuItemDialog
        orgId="org-1"
        categories={categories as never}
        item={it as never}
        defaultCategoryId="c-1"
        open
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe("the item dialog's add-on picks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.createMenuItem.mockResolvedValue({ id: "m-new" });
    api.updateMenuItem.mockResolvedValue({ id: "m-1" });
    api.putSizes.mockResolvedValue({ sizes: [] });
    api.putModifierGroups.mockResolvedValue({});
  });

  it("a new item with no add-ons picked sends no group set", async () => {
    liveItem = undefined;
    wrap(null);
    await userEvent.type(screen.getByLabelText("Name"), "Espresso");
    const price = screen.getByLabelText(/^Price \(EGP\)$/i);
    await userEvent.clear(price);
    await userEvent.type(price, "95");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizes).toHaveBeenCalled());
    expect(api.putModifierGroups).not.toHaveBeenCalled();
  });

  it("re-saving an item with its add-ons untouched sends no group set", async () => {
    liveItem = full(["a-shot"]);
    wrap(item);
    await screen.findByText("Extra shot", { selector: "span" });
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizes).toHaveBeenCalled());
    expect(api.putModifierGroups).not.toHaveBeenCalled();
  });

  it("removing every add-on sends an explicit empty set", async () => {
    liveItem = full(["a-shot", "a-cream"]);
    wrap(item);
    await userEvent.click(await screen.findByRole("button", { name: "Deselect all" }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putModifierGroups).toHaveBeenCalled());
    expect(api.putModifierGroups).toHaveBeenCalledWith("m-1", { groups: [] });
  });
});
