/**
 * The deal dialog end to end over a mocked client: an N-for-price deal is
 * created with the body the contract names (§2.3: piastres, kind, qty, a
 * category pool entry); a buy-get rule out of range stops Save on the field;
 * editing sends PUT /deals/{id} and then one branch call per changed toggle.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DealRule } from "@/features/combos/types";
import type { MenuOptions } from "@/features/combos/use-menu-options";

// Radix Select and cmdk reach for layout APIs jsdom doesn't have.
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

const createDeal = vi.fn();
const updateDeal = vi.fn();
const putDealBranch = vi.fn();
const deleteDealBranch = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
const onOpenChange = vi.fn();

vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) } }));
vi.mock("@/features/combos/api", () => ({
  createDeal: (...a: unknown[]) => createDeal(...a),
  updateDeal: (...a: unknown[]) => updateDeal(...a),
  putDealBranch: (...a: unknown[]) => putDealBranch(...a),
  deleteDealBranch: (...a: unknown[]) => deleteDealBranch(...a),
}));

const menu: MenuOptions = {
  loading: false,
  items: [
    { id: "coffee", name: "Coffee", category_id: "drinks", is_active: true, sizes: [{ label: "one_size", price: 4000 }] },
    { id: "cookie", name: "Cookie", category_id: "bites", is_active: true, sizes: [{ label: "one_size", price: 3000 }] },
  ],
  categories: [
    { id: "bites", name: "Bites" },
    { id: "drinks", name: "Drinks" },
  ],
  branches: [
    { id: "b-1", name: "Zamalek" },
    { id: "b-2", name: "Maadi" },
    { id: "b-3", name: "Dokki" },
  ],
  item: (id) => menu.items.find((i) => i.id === id),
  itemName: (id) => menu.items.find((i) => i.id === id)?.name,
  categoryName: (id) => menu.categories.find((c) => c.id === id)?.name,
  branchName: (id) => menu.branches.find((b) => b.id === id)?.name,
  itemsOfCategory: (id) => menu.items.filter((i) => i.category_id === id),
  categorySizeLabels: () => ["one_size"],
};

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { DealDialog } = await import("./deal-dialog");

const existing = (): DealRule => ({
  id: "d-1",
  name: "Coffee and a cookie",
  name_translations: {},
  kind: "buy_get",
  qty: 2,
  price: null,
  get_qty: 1,
  get_percent: 100,
  max_per_order: null,
  is_active: true,
  sort: 5,
  pool: [{ menu_item_id: "coffee", category_id: null, size_label: null }],
  reward_pool: [],
  windows: [],
  branch_overrides: [
    { branch_id: "b-1", is_active: true },
    { branch_id: "b-2", is_active: false },
  ] as DealRule["branch_overrides"],
  created_at: "",
  updated_at: "",
});

const mount = (deal: DealRule | null, canEdit = true) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DealDialog deal={deal} open onOpenChange={onOpenChange} menu={menu} canEdit={canEdit} nextSort={7} />
    </QueryClientProvider>,
  );

/** Pick an option from the Radix Select whose trigger is labelled `name`. */
async function pick(user: ReturnType<typeof userEvent.setup>, name: string, option: string) {
  await user.click(screen.getByRole("combobox", { name }));
  await user.click(await screen.findByRole("option", { name: option }));
}

beforeEach(() => {
  for (const f of [createDeal, updateDeal, putDealBranch, deleteDealBranch, toastError, toastSuccess, onOpenChange]) f.mockReset();
  putDealBranch.mockResolvedValue(undefined);
  deleteDealBranch.mockResolvedValue(undefined);
});

describe("creating a deal", () => {
  it("sends an N-for-price deal over a category, in piastres", async () => {
    const user = userEvent.setup();
    createDeal.mockResolvedValue({ ...existing(), id: "d-new" });
    mount(null);

    await user.type(screen.getByLabelText("Name"), "Any 2 bites for 90");
    expect(screen.getByLabelText("How many")).toHaveValue(2);
    await user.type(screen.getByLabelText("Price"), "90");
    const pool = screen.getByRole("list", { name: "Items that count" });
    await user.click(within(pool).getByRole("radio", { name: "Category" }));
    await pick(user, "Choose a category", "Bites");
    expect(screen.getByText("Any 2 for EGP 90.00", { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create deal" }));

    expect(createDeal).toHaveBeenCalledTimes(1);
    expect(createDeal.mock.calls[0][0]).toEqual({
      name: "Any 2 bites for 90",
      name_translations: {},
      kind: "n_for_price",
      qty: 2,
      price: 9000,
      get_qty: null,
      get_percent: null,
      max_per_order: null,
      sort: 7,
      is_active: true,
      pool: [{ category_id: "bites", menu_item_id: null, size_label: null }],
      reward_pool: [],
      windows: [],
    });
    // No branch set on or off: nothing else to send.
    expect(putDealBranch).not.toHaveBeenCalled();
    expect(deleteDealBranch).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Deal created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("refuses a buy-get percent out of range on the field and never calls the server", async () => {
    const user = userEvent.setup();
    mount(null);

    await user.type(screen.getByLabelText("Name"), "Coffee deal");
    await user.click(screen.getByRole("radio", { name: "Buy X get Y" }));
    expect(screen.getByLabelText("Buy")).toBeInTheDocument();
    const pct = screen.getByLabelText("Percent off");
    await user.clear(pct);
    await user.type(pct, "150");
    await user.click(screen.getByText("Choose an item").closest("button") as HTMLElement);
    await user.click(await screen.findByRole("option", { name: /Coffee/ }));

    await user.click(screen.getByRole("button", { name: "Create deal" }));

    expect(await screen.findByText("Use a percentage from 1 to 100.")).toBeInTheDocument();
    expect(screen.getByLabelText("Percent off")).toHaveAttribute("aria-invalid", "true");
    expect(createDeal).not.toHaveBeenCalled();
  });

  it("refuses a pool entry with nothing chosen, on the entry", async () => {
    const user = userEvent.setup();
    mount(null);
    await user.type(screen.getByLabelText("Name"), "Any 2 bites for 90");
    await user.type(screen.getByLabelText("Price"), "90");
    await user.click(screen.getByRole("button", { name: "Create deal" }));

    const pool = screen.getByRole("list", { name: "Items that count" });
    expect(await within(pool).findByText("Choose an item or a category.")).toBeInTheDocument();
    expect(createDeal).not.toHaveBeenCalled();
  });
});

describe("editing a deal", () => {
  it("PUTs the deal by id, then one branch call per changed toggle", async () => {
    const user = userEvent.setup();
    updateDeal.mockResolvedValue(existing());
    mount(existing());

    expect(screen.getByRole("heading", { name: "Edit deal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Coffee and a cookie");
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Coffee and a free cookie");

    // Zamalek on → follow (DELETE); Maadi stays off; Dokki follow → on (PUT).
    await pick(user, "Zamalek", "Follow the deal");
    await pick(user, "Dokki", "On here");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateDeal).toHaveBeenCalledTimes(1);
    expect(updateDeal).toHaveBeenCalledWith(
      "d-1",
      expect.objectContaining({
        name: "Coffee and a free cookie",
        kind: "buy_get",
        qty: 2,
        get_qty: 1,
        get_percent: 100,
        price: null,
        sort: 5,
        pool: [{ menu_item_id: "coffee", category_id: null, size_label: null }],
        reward_pool: [],
      }),
    );
    expect(createDeal).not.toHaveBeenCalled();
    expect(putDealBranch).toHaveBeenCalledTimes(1);
    expect(putDealBranch).toHaveBeenCalledWith("d-1", "b-3", true);
    expect(deleteDealBranch).toHaveBeenCalledTimes(1);
    expect(deleteDealBranch).toHaveBeenCalledWith("d-1", "b-1");
    expect(toastSuccess).toHaveBeenCalledWith("Changes saved");
  });

  it("surfaces a failed save as a toast and keeps the dialog open", async () => {
    const user = userEvent.setup();
    updateDeal.mockRejectedValue(new Error("boom"));
    mount(existing());
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(putDealBranch).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("is read-only without edit rights: fields disabled, no Save", () => {
    mount(existing(), false);
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove from the list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add an item" })).not.toBeInTheDocument();
  });
});
