/**
 * The combo editor at the three points the contract names (§8 Dashboard):
 * the form's own errors (min above max, a slot with no choices) stop a Save
 * and say why; the economics warnings show and never block Save (C11); and
 * without `menu.combos.edit` the page is read-only with no Save at all.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Combo, ComboEconomics } from "./contract";
import type { MenuOptions } from "./use-menu-options";

// cmdk scrolls the active option into view; jsdom has no layout to scroll.
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
let comboId = "new";
let combo: Combo | undefined;
let econ: ComboEconomics | undefined;
const createCombo = vi.fn();
const updateCombo = vi.fn();
const navigate = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: (p: { children: ReactNode }) => <a>{p.children}</a>,
  useNavigate: () => navigate,
  getRouteApi: () => ({ useParams: () => ({ comboId }) }),
}));
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) } }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));
vi.mock("@/components/app/image-uploader", () => ({ ImageUploader: () => null }));
vi.mock("./api", () => ({
  useCombo: () => ({ data: combo, isLoading: false, isError: false, isFetching: false, error: null, refetch: vi.fn() }),
  useComboEconomics: (body: unknown) => ({ data: body ? econ : undefined, isLoading: false, isError: false, isFetching: false, error: null }),
  createCombo: (...a: unknown[]) => createCombo(...a),
  updateCombo: (...a: unknown[]) => updateCombo(...a),
  uploadComboImage: vi.fn(),
  deleteCombo: vi.fn(),
}));

const menu: MenuOptions = {
  loading: false,
  items: [
    { id: "burger", name: "Burger", category_id: "mains", is_active: true, sizes: [{ label: "one_size", price: 12000 }] },
    { id: "fries", name: "Fries", category_id: "sides", is_active: true, sizes: [{ label: "one_size", price: 4000 }] },
  ],
  categories: [{ id: "drinks", name: "Drinks" }],
  branches: [{ id: "b-1", name: "Zamalek" }],
  item: (id) => menu.items.find((i) => i.id === id),
  itemName: (id) => menu.items.find((i) => i.id === id)?.name,
  categoryName: (id) => menu.categories.find((c) => c.id === id)?.name,
  branchName: (id) => menu.branches.find((b) => b.id === id)?.name,
  itemsOfCategory: () => [],
  categorySizeLabels: () => [],
};
vi.mock("./use-menu-options", async () => {
  const real = await vi.importActual<typeof import("./use-menu-options")>("./use-menu-options");
  return { ...real, useMenuOptions: () => menu };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ComboEditorPage } = await import("./combo-editor-page");

const saved = (): Combo => ({
  id: "c-1",
  kind: "combo",
  name: "Lunch deal",
  name_translations: { ar: "وجبة الغداء" },
  category_id: null,
  description: null,
  is_active: true,
  price: 15000,
  image_url: null,
  is_fixed: false,
  created_at: "",
  updated_at: "",
  windows: [],
  slots: [
    {
      id: "s-main",
      name: "Main",
      name_translations: {},
      sort: 0,
      min: 1,
      max: 1,
      default_item_id: "burger",
      default_size_label: null,
      choices: [{ id: "ch-1", menu_item_id: "burger", category_id: null, surcharge: 0, included_size_label: null, size_surcharges: [], sort: 0 }],
    },
    {
      id: "s-side",
      name: "Side",
      name_translations: {},
      sort: 1,
      min: 1,
      max: 1,
      default_item_id: null,
      default_size_label: null,
      choices: [{ id: "ch-2", menu_item_id: "fries", category_id: null, surcharge: 0, included_size_label: null, size_surcharges: [], sort: 0 }],
    },
  ],
  economics: {} as ComboEconomics,
});

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ComboEditorPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  held = ["menu.items.read", "menu.combos.edit"];
  comboId = "new";
  combo = undefined;
  econ = undefined;
  createCombo.mockReset();
  updateCombo.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
});

describe("the combo editor's form", () => {
  it("refuses min above max and a slot with no choices, on the fields, without calling the server", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByLabelText("Name"), "Lunch deal");
    await user.type(screen.getByLabelText("Combo price"), "150");
    await user.type(screen.getByLabelText("Slot name"), "Main");
    const min = screen.getByLabelText("At least");
    await user.clear(min);
    await user.type(min, "3");
    const max = screen.getByLabelText("At most");
    await user.clear(max);
    await user.type(max, "2");
    await user.click(screen.getByRole("button", { name: "Remove this choice" }));

    await user.click(screen.getByRole("button", { name: "Create combo" }));

    expect(await screen.findByText("\"At least\" can't be more than \"At most\".")).toBeInTheDocument();
    expect(screen.getByText("Add at least one choice to this slot.")).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith("Some fields need attention before saving.");
    expect(createCombo).not.toHaveBeenCalled();
  });

  it("creates a valid combo in piastres and opens it", async () => {
    const user = userEvent.setup();
    createCombo.mockResolvedValue({ ...saved(), id: "c-new" });
    mount();
    await user.type(screen.getByLabelText("Name"), "Burger meal");
    await user.type(screen.getByLabelText("Combo price"), "150");
    await user.type(screen.getByLabelText("Slot name"), "Main");
    // A combobox takes no name from its content; the trigger reads its placeholder.
    await user.click(screen.getByText("Choose an item").closest("button") as HTMLElement);
    await user.click(await screen.findByRole("option", { name: /Burger/ }));
    await user.click(screen.getByRole("button", { name: "Create combo" }));

    expect(createCombo).toHaveBeenCalledTimes(1);
    const body = createCombo.mock.calls[0][0];
    expect(body).toMatchObject({ name: "Burger meal", price: 15000, windows: [] });
    expect(body.slots).toEqual([
      expect.objectContaining({ name: "Main", min: 1, max: 1, choices: [expect.objectContaining({ menu_item_id: "burger", category_id: null, surcharge: 0 })] }),
    ]);
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/menu/combos/$comboId", params: { comboId: "c-new" } }));
  });
});

describe("the price check (C11)", () => {
  it("shows the warnings and still saves", async () => {
    const user = userEvent.setup();
    comboId = "c-1";
    combo = saved();
    econ = {
      branch_id: null,
      price: 15000,
      list_default: 16000,
      list_min: 16000,
      list_max: 16000,
      cost_default: 9000,
      cost_max: 9000,
      margin_default: "0.4000",
      margin_worst: "0.4000",
      min_margin: "0.5500",
      saving_default: 1000,
      warnings: [
        { code: "MARGIN_BELOW_MIN", vars: { margin: "0.4000", min: "0.5500" } },
        { code: "COST_UNKNOWN", vars: { menu_item_id: "fries" } },
      ],
    };
    updateCombo.mockResolvedValue({ ...saved(), price: 16000 });
    mount();

    const panel = await screen.findByRole("region", { name: "Price check" });
    expect(await within(panel).findByText("Margin 40% is below your minimum 55%.")).toBeInTheDocument();
    expect(within(panel).getByText("Fries has no known cost, so the margin is incomplete.")).toBeInTheDocument();

    const price = screen.getByLabelText("Combo price");
    await user.clear(price);
    await user.type(price, "160");
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeEnabled();
    await user.click(save);

    expect(updateCombo).toHaveBeenCalledWith("c-1", expect.objectContaining({ price: 16000 }));
    // The ids ride along, so the server diffs the slots in place.
    expect(updateCombo.mock.calls[0][1].slots.map((s: { id?: string }) => s.id)).toEqual(["s-main", "s-side"]);
    expect(toastSuccess).toHaveBeenCalledWith("Changes saved");
  });
});

describe("capability gating", () => {
  it("is read-only without menu.combos.edit: fields disabled, no Save", () => {
    held = ["menu.items.read"];
    comboId = "c-1";
    combo = saved();
    mount();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getAllByLabelText("Slot name")[0]).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
  });

  it("says the page isn't theirs without menu.items.read", () => {
    held = ["orders.read"];
    comboId = "c-1";
    combo = saved();
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
  });
});
