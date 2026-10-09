/**
 * Menu › Deals, gated by capability: `menu.items.read` lists the deals with
 * no way to author (no "New deal", no row actions, and an opened deal has no
 * Save); `menu.deals.edit` adds all three; without `menu.items.read` the page
 * says it is not this account's to see.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DealRule } from "@/features/combos/types";
import type { MenuOptions } from "@/features/combos/use-menu-options";

Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
let search: { edit?: string } = {};
let rows: DealRule[] = [];
const update = vi.fn();
const useDeals = vi.fn();

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/data/scope/use-page-search", () => ({ usePageSearch: () => [search, update] }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));
vi.mock("@/features/combos/api", () => ({
  useDeals: (...a: unknown[]) => {
    useDeals(...a);
    return { data: rows, isLoading: false, error: null, refetch: vi.fn() };
  },
  deleteDeal: vi.fn(),
  createDeal: vi.fn(),
  updateDeal: vi.fn(),
  putDealBranch: vi.fn(),
  deleteDealBranch: vi.fn(),
}));

const menu: MenuOptions = {
  loading: false,
  items: [{ id: "coffee", name: "Coffee", category_id: "drinks", is_active: true, sizes: [{ label: "one_size", price: 4000 }] }],
  categories: [{ id: "bites", name: "Bites" }],
  branches: [],
  item: (id) => menu.items.find((i) => i.id === id),
  itemName: (id) => menu.items.find((i) => i.id === id)?.name,
  categoryName: (id) => menu.categories.find((c) => c.id === id)?.name,
  branchName: () => undefined,
  itemsOfCategory: () => [],
  categorySizeLabels: () => [],
};
vi.mock("@/features/combos/use-menu-options", async () => {
  const real = await vi.importActual<typeof import("@/features/combos/use-menu-options")>("@/features/combos/use-menu-options");
  return { ...real, useMenuOptions: () => menu };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { DealsPage } = await import("./deals-page");

const deal = (over: Partial<DealRule>): DealRule => ({
  id: "d",
  name: "Deal",
  name_translations: {},
  kind: "n_for_price",
  qty: 2,
  price: 9000,
  get_qty: null,
  get_percent: null,
  max_per_order: null,
  is_active: true,
  sort: 0,
  pool: [{ menu_item_id: null, category_id: "bites", size_label: null }],
  reward_pool: [],
  windows: [],
  branch_overrides: [],
  created_at: "",
  updated_at: "",
  ...over,
});

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DealsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  search = {};
  update.mockReset();
  useDeals.mockReset();
  rows = [
    deal({ id: "d-1", name: "Any 2 bites for 90" }),
    deal({ id: "d-2", name: "Coffee and a cookie", kind: "buy_get", price: null, get_qty: 1, get_percent: 100, pool: [{ menu_item_id: "coffee", category_id: null, size_label: null }], sort: 1 }),
  ];
});

describe("capability gating", () => {
  it("lists the deals read-only with menu.items.read alone", async () => {
    held = ["menu.items.read"];
    mount();
    expect((await screen.findAllByText("Any 2 bites for 90")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("All Bites").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Buy 2, get 1 free").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /New deal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("opens a deal read-only: no Save", async () => {
    held = ["menu.items.read"];
    search = { edit: "d-1" };
    mount();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Name")).toBeDisabled();
    expect(within(dialog).queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("does not open a new deal without menu.deals.edit, even from the URL", () => {
    held = ["menu.items.read"];
    search = { edit: "new" };
    mount();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers New deal and row actions with menu.deals.edit", async () => {
    held = ["menu.items.read", "menu.deals.edit"];
    mount();
    const create = await screen.findByRole("button", { name: /New deal/ });
    expect(screen.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Delete" }).length).toBeGreaterThan(0);
    create.click();
    expect(update).toHaveBeenCalledWith({ edit: "new" });
  });

  it("opens a deal editable with menu.deals.edit", async () => {
    held = ["menu.items.read", "menu.deals.edit"];
    search = { edit: "d-1" };
    mount();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Name")).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("says the page isn't theirs without menu.items.read, and asks for nothing", () => {
    held = ["orders.read"];
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
    expect(useDeals).toHaveBeenCalledWith({}, { enabled: false });
  });
});
