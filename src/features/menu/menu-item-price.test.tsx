/**
 * Price lives in SIZES, and the dashboard must not offer any other way to
 * change it.
 *
 * An item has no price of its own. The editor shows a single "Price" box for a
 * simple item — which is really that item's one `one_size` row — and a price
 * per size once it has real sizes. There is no item-level price field, and the
 * list's price cell is a read-only display of the item's "from" price (the
 * lowest of its sizes).
 *
 * Every test here fails before the change: the dialog used to carry a
 * "Base price (EGP)" field, and the list cell used to be inline-editable.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/recipes/recipe-builder", () => ({ RecipeBuilder: () => null }));
vi.mock("@/features/recipes/util", () => ({ invalidateRecipes: vi.fn() }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));
vi.mock("./util", () => ({
  ONE_SIZE: "one_size",
  arOf: () => "",
  invalidateCatalog: vi.fn(),
}));

const createMenuItem = vi.fn().mockResolvedValue({ id: "m-new" });
const updateMenuItem = vi.fn().mockResolvedValue({ id: "m-1" });
const putSizes = vi.fn().mockResolvedValue({ sizes: [] });

/** The full item the editor loads. `all_sizes` carries the sentinel row. */
let liveItem: unknown = undefined;

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  createMenuItem: (...a: unknown[]) => createMenuItem(...a),
  putModifierGroups: vi.fn().mockResolvedValue({}),
  putSizeRecipe: vi.fn().mockResolvedValue({}),
  putSizes: (...a: unknown[]) => putSizes(...a),
  updateMenuItem: (...a: unknown[]) => updateMenuItem(...a),
  uploadMenuItemImage: vi.fn(),
  useGetMenuItem: () => ({ data: liveItem }),
  useListAddonItems: () => ({ data: [] }),
  useListCatalog: () => ({ data: [] }),
  useListGroups: () => ({ data: [] }),
}));
vi.mock("@/data/api/custom-instance", () => ({ customInstance: vi.fn() }));

await import("@/i18n");
const { MenuItemDialog } = await import("./menu-item-dialog");

const categories = [{ id: "c-1", org_id: "org-1", name: "Coffee", is_active: true }];

function wrap(item: unknown) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MenuItemDialog
        orgId="org-1"
        categories={categories as never}
        item={item as never}
        defaultCategoryId="c-1"
        open
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  );
}

const item = {
  id: "m-1",
  name: "Americano",
  name_translations: null,
  description: null,
  description_translations: null,
  base_price: 11500,
  category_id: "c-1",
  is_active: true,
  image_url: null,
  image: null,
};

const size = (label: string, price: number) => ({
  id: `s-${label}`,
  menu_item_id: "m-1",
  label,
  price_override: price,
  is_active: true,
});

describe("the item editor is the only place a price is entered", () => {
  it("has no item-level price field at all", () => {
    liveItem = undefined;
    wrap(null);
    expect(screen.queryByLabelText(/base price/i)).not.toBeInTheDocument();
    // …and nothing else offers an item price either.
    expect(screen.queryByText(/base price/i)).not.toBeInTheDocument();
  });

  it("a new item is created with one price, which becomes its one size", async () => {
    liveItem = undefined;
    createMenuItem.mockClear();
    putSizes.mockClear();
    wrap(null);

    await userEvent.type(screen.getByLabelText("Name"), "Espresso");
    // The single "Price" box IS the item's one size — there is no other input.
    const price = screen.getByLabelText(/^Price \(EGP\)$/i);
    await userEvent.clear(price);
    await userEvent.type(price, "95");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(createMenuItem).toHaveBeenCalled());
    // The price the API is given is the item's "from" price…
    expect(createMenuItem.mock.calls[0][0]).toMatchObject({ base_price: 9500 });
    // …and the size set that actually establishes it carries the same number
    // under the sentinel label.
    await waitFor(() => expect(putSizes).toHaveBeenCalled());
    expect(putSizes.mock.calls[0][1]).toEqual({
      sizes: [{ label: "one_size", price: 9500, sort: 0, is_active: true }],
    });
  });

  it("editing a simple item shows its one_size row as a plain Price box", async () => {
    // The sentinel is hidden from `sizes` (old tills) but present in `all_sizes`.
    liveItem = {
      ...item,
      sizes: [],
      all_sizes: [size("one_size", 11500)],
      recipes: [],
      allowed_addon_ids: [],
      addon_slots: [],
      optional_fields: [],
      recipe_steps: [],
    };
    wrap(item);

    // The price is loaded from the size row, in EGP…
    await waitFor(() =>
      expect(screen.getByLabelText(/^Price \(EGP\)$/i)).toHaveValue(115),
    );
    // …and its label is never shown or editable: the sentinel is not a size.
    expect(screen.queryByDisplayValue("one_size")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Large")).not.toBeInTheDocument();
  });

  it("a size edit is what changes the charged price, and base_price is never sent", async () => {
    liveItem = {
      ...item,
      sizes: [],
      all_sizes: [size("one_size", 11500)],
      recipes: [],
      allowed_addon_ids: [],
      addon_slots: [],
      optional_fields: [],
      recipe_steps: [],
    };
    updateMenuItem.mockClear();
    putSizes.mockClear();
    wrap(item);

    const price = await screen.findByLabelText(/^Price \(EGP\)$/i);
    await userEvent.clear(price);
    await userEvent.type(price, "130");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(putSizes).toHaveBeenCalled());
    // The size carries the new price…
    expect(putSizes.mock.calls[0][1]).toEqual({
      sizes: [{ label: "one_size", price: 13000, sort: 0, is_active: true }],
    });
    // …and the item PATCH never mentions a price.
    expect(updateMenuItem).toHaveBeenCalled();
    expect(updateMenuItem.mock.calls[0][1]).not.toHaveProperty("base_price");
  });

  it("a multi-size item prices every size, and the last one cannot be removed", async () => {
    liveItem = {
      ...item,
      name: "Soft Serve",
      sizes: [size("small", 15000), size("large", 17000)],
      all_sizes: [size("small", 15000), size("large", 17000)],
      recipes: [],
      allowed_addon_ids: [],
      addon_slots: [],
      optional_fields: [],
      recipe_steps: [],
    };
    wrap({ ...item, name: "Soft Serve" });

    await waitFor(() => expect(screen.getAllByPlaceholderText("Large")).toHaveLength(2));
    expect(screen.getByDisplayValue("small")).toBeInTheDocument();
    expect(screen.getByDisplayValue("large")).toBeInTheDocument();

    // Both removes are live while there are two…
    const removes = screen.getAllByRole("button", { name: /remove size/i });
    expect(removes.every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);

    // …and once one is gone, the last size — which holds the price — is pinned.
    await userEvent.click(removes[1]);
    await waitFor(() => expect(screen.getAllByPlaceholderText("Large")).toHaveLength(1));
    expect(screen.getByRole("button", { name: /remove size/i })).toBeDisabled();
  });

  it("adding a size to a simple item renames the sentinel rather than keeping it", async () => {
    liveItem = {
      ...item,
      sizes: [],
      all_sizes: [size("one_size", 11500)],
      recipes: [],
      allowed_addon_ids: [],
      addon_slots: [],
      optional_fields: [],
      recipe_steps: [],
    };
    wrap(item);

    await screen.findByLabelText(/^Price \(EGP\)$/i);
    await userEvent.click(screen.getByRole("button", { name: /add size/i }));

    // Two labelled rows now, and neither is still called `one_size` — a
    // sentinel left behind would be offered to a till as a real size.
    await waitFor(() => expect(screen.getAllByPlaceholderText("Large")).toHaveLength(2));
    expect(screen.queryByDisplayValue("one_size")).not.toBeInTheDocument();
  });
});

describe("the menu list shows the price but does not let anyone edit it", () => {
  it("the price cell is read-only", async () => {
    const { EditableCardGrid } = await import("@/components/app/editable-cards");
    const commit = vi.fn();
    type Row = { id: string; name: string; base_price: number };
    render(
      <EditableCardGrid<Row>
        rows={[{ id: "m-1", name: "Americano", base_price: 11500 }]}
        getRowId={(r) => r.id}
        titleField={{ key: "name", label: "Name", type: "text", getValue: (r) => r.name }}
        fields={[
          // Exactly how the menu list declares it now.
          {
            key: "base_price",
            label: "Price",
            type: "money",
            getValue: (r) => r.base_price,
            editable: false,
          },
        ]}
        onCommitRow={commit}
      />,
    );

    const cell = screen.getByText((txt) => txt.includes("115.00"));
    await userEvent.click(cell);
    // …but clicking does not open an editor, so nothing can be committed.
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(commit).not.toHaveBeenCalled();
  });
});
