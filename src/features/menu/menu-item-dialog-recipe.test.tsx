/**
 * The item dialog shows and sends a recipe line's amount as typed
 * (`usable_quantity`, before yield loss), never the stored, yield-adjusted
 * `quantity`. 100 g of an 80 %-yield ingredient stores 125 g; showing and
 * sending 125 made every re-save store 156.25 (D3b). An untouched line goes
 * back exactly as received, so the server keeps it.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/recipes/create-ingredient-dialog", () => ({ CreateIngredientDialog: () => null }));
vi.mock("@/features/recipes/util", () => ({ invalidateRecipes: vi.fn() }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));
vi.mock("./util", () => ({
  ONE_SIZE: "one_size",
  arOf: () => "",
  invalidateCatalog: vi.fn(),
}));

const api = vi.hoisted(() => ({
  updateMenuItem: vi.fn(),
  putSizes: vi.fn(),
  putSizeRecipe: vi.fn(),
}));

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
const liveItem = {
  ...item,
  sizes: [],
  all_sizes: [{ id: "s-1", menu_item_id: "m-1", label: "one_size", price_override: 6000, is_active: true }],
  recipes: [],
  allowed_addon_ids: [],
  addon_slots: [],
  optional_fields: [],
  recipe_steps: [],
};
const milkOwn = { id: "l-1", ingredient_id: "ing-milk", ingredient_name: "Milk", quantity: "125", usable_quantity: "100", unit: "g", source: "own" };
const studio = {
  sizes: [
    {
      id: "s-1",
      label: "one_size",
      price: 6000,
      is_active: true,
      sort: 0,
      cost_incomplete: false,
      recipe: [] as Record<string, unknown>[],
    },
  ],
};

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  createMenuItem: vi.fn(),
  putModifierGroups: vi.fn(),
  putSizeRecipe: api.putSizeRecipe,
  putSizes: api.putSizes,
  updateMenuItem: api.updateMenuItem,
  uploadMenuItemImage: vi.fn(),
  useGetMenuItem: () => ({ data: liveItem }),
  useGetStudio: () => ({ data: studio }),
  useListAddonItems: () => ({ data: [] }),
  useListCatalog: () => ({ data: [] }),
  useListGroups: () => ({ data: [] }),
}));
vi.mock("@/data/api/custom-instance", () => ({ customInstance: vi.fn() }));

await import("@/i18n");
const { MenuItemDialog } = await import("./menu-item-dialog");

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MenuItemDialog orgId="org-1" categories={[]} item={item as never} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

describe("the item dialog's recipe quantities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.updateMenuItem.mockResolvedValue({ id: "m-1" });
    api.putSizes.mockResolvedValue({ sizes: [{ id: "s-1", label: "one_size" }] });
    api.putSizeRecipe.mockResolvedValue({});
    studio.sizes[0].recipe = [milkOwn];
  });

  it("shows the typed amount and sends an untouched line back unchanged", async () => {
    wrap();
    expect(await screen.findByDisplayValue("100")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("125")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizeRecipe).toHaveBeenCalled());
    expect(api.putSizeRecipe).toHaveBeenCalledWith("s-1", { lines: [{ ingredient_id: "ing-milk", quantity: 100, unit: "g" }] });
  });

  it("sends an edited line as the amount typed", async () => {
    wrap();
    const input = await screen.findByDisplayValue("100");
    await userEvent.clear(input);
    await userEvent.type(input, "90");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizeRecipe).toHaveBeenCalled());
    expect(api.putSizeRecipe).toHaveBeenCalledWith("s-1", { lines: [{ ingredient_id: "ing-milk", quantity: 90, unit: "g" }] });
  });

  it("sends only the size's own lines, leaving a base line attached", async () => {
    // The size-recipe PUT replaces own lines; a base line sent back as own would detach.
    studio.sizes[0].recipe = [
      { id: "l-2", ingredient_id: "ing-espresso", ingredient_name: "Espresso", quantity: "18", usable_quantity: "18", unit: "g", source: "base" },
      milkOwn,
    ];
    wrap();
    expect(await screen.findByDisplayValue("100")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("18")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizeRecipe).toHaveBeenCalled());
    expect(api.putSizeRecipe).toHaveBeenCalledTimes(1);
    expect(api.putSizeRecipe).toHaveBeenCalledWith("s-1", { lines: [{ ingredient_id: "ing-milk", quantity: 100, unit: "g" }] });
  });

  it("treats a legacy line with no source as own", async () => {
    studio.sizes[0].recipe = [{ ...milkOwn, source: null }];
    wrap();
    await userEvent.click(await screen.findByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putSizeRecipe).toHaveBeenCalled());
    expect(api.putSizeRecipe).toHaveBeenCalledWith("s-1", { lines: [{ ingredient_id: "ing-milk", quantity: 100, unit: "g" }] });
  });
});
