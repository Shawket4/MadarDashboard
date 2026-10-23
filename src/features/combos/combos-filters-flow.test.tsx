/**
 * Combos keep their filters across a trip to the editor: filter by status and
 * search, open a combo, press the editor's Back — same list, same filters.
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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAllListSearches, keepScope } from "@/data/scope/list-search";
import { useAuthStore } from "@/data/stores/auth.store";
import type { ComboSummary } from "./types";
import { combosSearch } from "./search";

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

const useCombos = vi.fn();
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: ["menu.items.read"] as never, ask_manager: [], limits: {} }) };
});
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));
vi.mock("@/data/api/generated/api", async () => {
  const real = await vi.importActual<typeof import("@/data/api/generated/api")>("@/data/api/generated/api");
  return { ...real, useListCategories: () => ({ data: [], isLoading: false }) };
});
const ROWS: Partial<ComboSummary>[] = [
  { id: "c-1", name: "Lunch deal", is_active: true },
  { id: "c-2", name: "Old breakfast", is_active: false },
];
vi.mock("./api", () => ({
  useCombos: (p: { is_active?: boolean; q?: string }) => {
    useCombos(p);
    const data = ROWS.filter((r) => p.is_active === undefined || r.is_active === p.is_active).map((r) => ({
      name_translations: {}, available_now: true, category_id: null, image_url: null, is_fixed: false,
      margin_default: "0.6", price: 10000, slot_count: 2, warning_count: 0, window_count: 0, ...r,
    }));
    return { data: { data, total_pages: 1 }, isLoading: false, error: null, refetch: vi.fn() };
  },
  deleteCombo: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CombosPage } = await import("./combos-page");

function FakeEditor() {
  const navigate = useNavigate();
  return <button onClick={() => void navigate({ to: "/menu/combos", search: keepScope as never })}>Back</button>;
}

function setup() {
  const root = createRootRoute({ component: () => <Outlet /> });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/menu/combos",
    validateSearch: (s: Record<string, unknown>) => ({ branchId: typeof s.branchId === "string" ? s.branchId : undefined, ...combosSearch.validateSearch(s) }),
    beforeLoad: combosSearch.beforeLoad as never,
    component: CombosPage,
  });
  const editor = createRoute({ getParentRoute: () => root, path: "/menu/combos/$comboId", component: FakeEditor });
  const routeTree = root.addChildren([list, editor] as never) as unknown as AnyRoute;
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/menu/combos?branchId=b-1"] }) });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  forgetAllListSearches();
  useAuthStore.setState({ user: { id: "u-1", org_id: "org-1", role: "org_admin" } as never, token: "t" });
  useCombos.mockReset();
});

describe("combos: filters survive opening a combo", () => {
  it("status + search → editor → Back keeps both", async () => {
    const user = userEvent.setup();
    const router = setup();
    await user.click(await screen.findByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Inactive" }));
    await user.type(screen.getByRole("textbox", { name: "Search combos" }), "break");
    await waitFor(() => expect(router.state.location.search).toMatchObject({ status: "inactive", q: "break" }));

    await user.click(await screen.findByText("Old breakfast"));
    await screen.findByRole("button", { name: "Back" });
    expect(router.state.location.search).toEqual({ branchId: "b-1" });

    await user.click(screen.getByRole("button", { name: "Back" }));
    await screen.findByText("Old breakfast");
    expect(router.state.location.search).toMatchObject({ branchId: "b-1", status: "inactive", q: "break" });
    expect(screen.getByRole("textbox", { name: "Search combos" })).toHaveValue("break");
    expect(screen.queryByText("Lunch deal")).not.toBeInTheDocument();
    expect(useCombos).toHaveBeenLastCalledWith(expect.objectContaining({ is_active: false, q: "break" }));
  });
});
