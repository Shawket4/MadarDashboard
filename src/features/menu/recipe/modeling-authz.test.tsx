/**
 * Read-only users see the recipe grid and packaging rules without edit controls.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let held: string[] = [];

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/data/api/generated/api", () => ({
  useListCategories: () => ({ data: [] }),
  useListMenuCatalog: () => ({ data: { data: [] } }),
  useListCatalog: () => ({ data: [] }),
}));
vi.mock("./modeling-api", async () => {
  const real = await vi.importActual<typeof import("./modeling-api")>("./modeling-api");
  return {
    ...real,
    usePackagingRules: () => ({
      data: [{ id: "r1", org_id: "o", name: "Iced cup", match_category_id: null, match_size_label: "Cup", match_item_id: null, sort: 0, is_active: true, lines: [], created_at: "", updated_at: "" }],
      isLoading: false,
      isError: false,
    }),
  };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { PackagingRulesPage } = await import("./packaging-rules-page");
const { RecipeGrid } = await import("./recipe-grid");

const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const EDIT = "menu.items.edit";

describe("packaging rules page authz", () => {
  it("hides create/edit/delete/apply without the caps", () => {
    held = ["menu.items.read"];
    wrap(<PackagingRulesPage />);
    expect(screen.getByText("Iced cup")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New rule/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Apply rules/ })).toBeNull();
  });

  it("shows them with the caps", () => {
    held = [EDIT, "menu.packaging_rules.apply"];
    wrap(<PackagingRulesPage />);
    expect(screen.getByRole("button", { name: /New rule/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply rules/ })).toBeInTheDocument();
  });
});

describe("recipe grid authz", () => {
  const blocks = [
    { key: "s1", id: "s1", label: "Cup", price: "10", seededLabel: "Cup", seededPrice: "10", serverCost: null, baseId: null, lines: [{ ingredient_id: "milk", quantity: "180", unit: "g" }] },
  ];
  const catalogById = new Map([["milk", { id: "milk", name: "Milk", unit: "g", category_slug: "milk", category_id: "c", category_name: "Milk", cost_per_unit: 1, is_active: true } as never]]);
  const renderGrid = () =>
    wrap(
      <RecipeGrid
        blocks={blocks}
        setBlocks={vi.fn()}
        recipeDirtyKeys={new Set()}
        catalogById={catalogById}
        ingredientOptions={[]}
        orgId="org-1"
        onCostFixed={vi.fn()}
        swapGroups={[]}
        baseNames={new Map()}
        followsName={null}
      />,
    );

  it("renders read-only without menu.items.edit", () => {
    held = ["menu.items.read"];
    renderGrid();
    expect(screen.queryByLabelText("Milk in Cup")).toBeNull();
    expect(screen.getByText("180 g")).toBeInTheDocument();
    expect(screen.getByLabelText("Price of Cup")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Size actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove ingredient" })).toBeNull();
  });

  it("is editable with menu.items.edit", () => {
    held = [EDIT];
    renderGrid();
    expect(screen.getByLabelText("Milk in Cup")).toBeInTheDocument();
    expect(screen.getByLabelText("Price of Cup")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Size actions" })).toBeInTheDocument();
  });
});
