/**
 * The owner's case, end to end through a real router: filter the menu by
 * category, open an item, come back (Back button, a save that returns, the
 * browser's Back) — the list is still filtered. A deleted category drops out.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type AnyRoute,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAllListSearches, keepScope } from "@/data/scope/list-search";
import { useAuthStore } from "@/data/stores/auth.store";
import { menuItemsSearch } from "./search";
import { MenuItemsPage } from "./menu-items-page";

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: true, platform: false, role_kinds: ["org_admin"], capabilities: ["recipes.read", "menu.items.read", "menu.items.edit"], ask_manager: [], limits: {} }) };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));

let categories = [
  { id: "c-drinks", name: "Drinks", is_active: true, image_url: null },
  { id: "c-food", name: "Food", is_active: true, image_url: null },
];
const ITEMS = [
  { id: "m-latte", name: "Latte", base_price: 1000, is_active: true, category_id: "c-drinks", sku_costs: [], image_url: null, image: null },
  { id: "m-toast", name: "Toast", base_price: 500, is_active: true, category_id: "c-food", sku_costs: [], image_url: null, image: null },
];
const catalogCalls: { category_id?: string; page: number }[] = [];

vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  useListCategories: () => ({ data: categories }),
  useListAddonItems: () => ({ data: [] }),
  useListMenuCatalog: (p: { category_id?: string; page: number }) => {
    catalogCalls.push(p);
    const rows = p.category_id ? ITEMS.filter((i) => i.category_id === p.category_id) : ITEMS;
    return { data: { data: rows, total: rows.length, total_pages: 1 }, isLoading: false, isFetching: false };
  },
  useListAddonCosts: () => ({ data: [] }),
  useListBranchMenuOverrides: () => ({ data: [] }),
  useListBranchAddonOverrides: () => ({ data: [] }),
  useDeleteMenuItem: () => ({ mutate: vi.fn() }),
  useDeleteOption: () => ({ mutate: vi.fn() }),
  useDeleteCategory: () => ({ mutate: vi.fn() }),
  useReorderCategories: () => ({ mutate: vi.fn(), isPending: false }),
  getGetMenuItemQueryOptions: () => ({ queryKey: ["x"], queryFn: () => null }),
  getGetStudioQueryOptions: () => ({ queryKey: ["y"], queryFn: () => null }),
  getListAddonItemsQueryOptions: () => ({ queryKey: ["z"], queryFn: () => [] }),
  getListAddonCostsQueryOptions: () => ({ queryKey: ["w"], queryFn: () => [] }),
  getListMenuCatalogQueryOptions: () => ({ queryKey: ["v"], queryFn: () => null }),
  listMenuCatalog: vi.fn(),
  createMenuItem: vi.fn(),
  duplicateItem: vi.fn(),
  patchOption: vi.fn(),
  updateCategory: vi.fn(),
  updateMenuItem: vi.fn(),
}));


vi.mock("./menu-item-dialog", () => ({ MenuItemDialog: () => null }));
vi.mock("./addon-dialog", () => ({ AddonDialog: () => null }));
vi.mock("./addon-recipe-dialog", () => ({ AddonRecipeDialog: () => null }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");

/** Stands in for the studio: the same "Back" and "save → list" navigation it uses. */
function FakeStudio() {
  const navigate = useNavigate();
  const toList = () => void navigate({ to: "/menu/items", search: keepScope as never });
  return (
    <div>
      <h1>Studio</h1>
      <button onClick={toList}>Back</button>
      <button onClick={toList}>Save and close</button>
    </div>
  );
}

function setup(initial = "/menu/items?branchId=b-1&preset=today") {
  const root = createRootRoute({ component: () => <Outlet /> });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/menu/items",
    validateSearch: (s: Record<string, unknown>) => ({
      branchId: typeof s.branchId === "string" ? s.branchId : undefined,
      preset: typeof s.preset === "string" ? s.preset : undefined,
      ...menuItemsSearch.validateSearch(s),
    }),
    beforeLoad: menuItemsSearch.beforeLoad as never,
    component: MenuItemsPage,
  });
  const studio = createRoute({ getParentRoute: () => root, path: "/menu/items/$itemId", component: FakeStudio });
  const history = createMemoryHistory({ initialEntries: [initial] });
  const routeTree = root.addChildren([list, studio] as never) as unknown as AnyRoute;
  const router = createRouter({ routeTree, history });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

async function pickCategory(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(await screen.findByRole("combobox", { name: "Category" }));
  await user.click(await screen.findByRole("option", { name }));
}

async function openItem(user: ReturnType<typeof userEvent.setup>, name: string) {
  const card = (await screen.findByText(name)).closest("div[class]")?.parentElement?.parentElement as HTMLElement;
  const trigger = Array.from(card.querySelectorAll("button")).find((b) => b.getAttribute("aria-haspopup") === "menu") as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole("menuitem", { name: /full editor/i }));
  await screen.findByRole("heading", { name: "Studio" });
}

const search = (router: ReturnType<typeof setup>) => router.state.location.search as Record<string, unknown>;

beforeEach(() => {
  forgetAllListSearches();
  useAuthStore.setState({ user: { id: "u-1", org_id: "org-1", role: "org_admin" } as never, token: "t" });
  categories = [
    { id: "c-drinks", name: "Drinks", is_active: true, image_url: null },
    { id: "c-food", name: "Food", is_active: true, image_url: null },
  ];
  catalogCalls.length = 0;
});

describe("menu: category filter survives opening an item", () => {
  it("filter → edit → Back lands on the same filtered list", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Drinks");
    await waitFor(() => expect(search(router).cat).toBe("c-drinks"));
    expect(screen.queryByText("Toast")).not.toBeInTheDocument();

    await openItem(user, "Latte");
    // The detail page carries only the scope, not the list's filters.
    expect(search(router)).toEqual({ branchId: "b-1", preset: "today" });

    await user.click(screen.getByRole("button", { name: "Back" }));
    await screen.findByText("Latte");
    expect(search(router)).toMatchObject({ branchId: "b-1", preset: "today", cat: "c-drinks" });
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent("Drinks");
    expect(screen.queryByText("Toast")).not.toBeInTheDocument();
    expect(catalogCalls.at(-1)?.category_id).toBe("c-drinks");
  });

  it("filter → edit → save returns to the filtered list", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Food");
    await openItem(user, "Toast");
    await user.click(screen.getByRole("button", { name: "Save and close" }));
    await screen.findByText("Toast");
    expect(search(router).cat).toBe("c-food");
    expect(screen.queryByText("Latte")).not.toBeInTheDocument();
  });

  it("browser Back restores it from the URL", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Drinks");
    await openItem(user, "Latte");
    await act(async () => router.history.back());
    await screen.findByText("Latte");
    expect(search(router).cat).toBe("c-drinks");
  });

  it("clearing the filter is remembered too (no stale restore)", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Drinks");
    await pickCategory(user, "All categories");
    await waitFor(() => expect(search(router).cat).toBeUndefined());
    await openItem(user, "Toast");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await screen.findByText("Latte");
    expect(search(router).cat).toBeUndefined();
  });

  it("a remembered category that was deleted meanwhile is dropped", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Food");
    await openItem(user, "Toast");
    categories = categories.filter((c) => c.id !== "c-food");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(search(router).cat).toBeUndefined());
    expect(await screen.findByText("Latte")).toBeInTheDocument();
  });

  it("an explicit link wins over the memory, and defaults stay out of the URL", async () => {
    const user = userEvent.setup();
    const router = setup();
    await pickCategory(user, "Drinks");
    await act(async () => {
      await router.navigate({ to: "/menu/items", search: { recipe: "missing" } as never });
    });
    await waitFor(() => expect(search(router)).toEqual({ recipe: "missing" }));
    expect(router.state.location.href).not.toContain("page=");
    expect(router.state.location.href).not.toContain("tab=");
  });
});
