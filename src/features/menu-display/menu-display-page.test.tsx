/**
 * The menu without prices: the ordering flow's own pieces, no figure on the
 * page anywhere — the cards, the customizer, the basket, the staff list — and
 * nothing sent anywhere at the end.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMenuDisplay } from "@/data/api/generated/models/publicMenuDisplay";

const publicMenuDisplay = vi.fn();
const anyOrderCall = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  usePublicMenuDisplay: (params: unknown, opts?: unknown) => publicMenuDisplay(params, opts),
  // The priced menu must never be asked for: MenuStep is handed its menu.
  usePublicMenu: (branch: string, params: unknown, opts?: { query?: { enabled?: boolean } }) => {
    if (opts?.query?.enabled !== false) anyOrderCall("usePublicMenu", branch, params);
    return { data: undefined, isLoading: false, isError: false };
  },
  usePublicOrgBrand: () => ({ data: undefined, isPending: false }),
  publicBranchCartQuote: (...args: unknown[]) => anyOrderCall("cartQuote", args),
  publicTableCartQuote: (...args: unknown[]) => anyOrderCall("cartQuote", args),
}));

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

const i18n = (await import("@/i18n")).default;
const { MenuDisplayPage } = await import("./menu-display-page");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const PAGE: PublicMenuDisplay = {
  brand: {
    org_id: "o-1",
    name: "Drops",
    slug: "drops",
    custom_branding: true,
    logo_url: null,
    logo_is_mark: false,
    card_image_url: null,
    background_color: "#0D6273",
    foreground_color: "#EFF3F4",
    accent_color: "#2E94A6",
  },
  title_en: "Our menu",
  title_ar: "قائمتنا",
  branch: { id: "b-1", name: "Zamalek" },
  menu: {
    categories: [
      { id: "c-hot", name: "Hot drinks", name_translations: { ar: "مشروبات ساخنة" }, image_url: null, display_order: 0 },
      { id: "c-bake", name: "Bakery", name_translations: { ar: "مخبوزات" }, image_url: null, display_order: 1 },
    ],
    items: [
      {
        id: "latte",
        category_id: "c-hot",
        name: "Latte",
        name_translations: { ar: "لاتيه" },
        description: "Double shot, steamed milk",
        image_url: null,
        sizes: [{ label: "Regular" }, { label: "Large" }],
        optionals: [{ id: "hot", name: "Extra hot", name_translations: {}, size_label: null }],
        default_milk_addon_id: null,
        allowed_addon_ids: ["oat"],
        modifier_groups: [],
        kind: "item",
        combo: null,
      },
      {
        id: "croissant",
        category_id: "c-bake",
        name: "Croissant",
        name_translations: { ar: "كرواسون" },
        description: null,
        image_url: null,
        sizes: [],
        optionals: [],
        default_milk_addon_id: null,
        allowed_addon_ids: [],
        modifier_groups: [],
        kind: "item",
        combo: null,
      },
    ],
    addons: [
      { addon_item_id: "oat", name: "Oat milk", name_translations: { ar: "حليب الشوفان" }, type: "milk_type", is_available: true },
    ],
  },
};

/** Anything that reads as a price: a currency, or a figure with decimals. */
const PRICE = /EGP|ج\.م|جنيه|\d+[.,]\d{2}\b|\+\s?\d/;
const noPriceOnScreen = () => {
  // The page and every portal (sheets, dialogs) live under <body>.
  expect(document.body.textContent ?? "").not.toMatch(PRICE);
};

beforeEach(() => {
  sessionStorage.clear();
  publicMenuDisplay.mockReturnValue({ data: PAGE, isPending: false, isError: false });
  anyOrderCall.mockReset();
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("MenuDisplayPage", () => {
  it("asks for the shop by org id or by slug", () => {
    wrap(<MenuDisplayPage orgId="o-1" />);
    expect(publicMenuDisplay).toHaveBeenLastCalledWith({ org_id: "o-1" }, expect.anything());
    wrap(<MenuDisplayPage slug="drops" />);
    expect(publicMenuDisplay).toHaveBeenLastCalledWith({ slug: "drops" }, expect.anything());
  });

  it("shows the menu by category, with names and descriptions and no price", () => {
    wrap(<MenuDisplayPage orgId="o-1" />);
    expect(screen.getAllByText("Our menu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Zamalek").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hot drinks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bakery").length).toBeGreaterThan(0);
    expect(screen.getByText("Latte")).toBeInTheDocument();
    expect(screen.getByText("Double shot, steamed milk")).toBeInTheDocument();
    noPriceOnScreen();
    expect(anyOrderCall).not.toHaveBeenCalled();
  });

  it("configures an item, keeps a list and shows it to staff — no price anywhere, nothing sent", async () => {
    wrap(<MenuDisplayPage orgId="o-1" />);
    fireEvent.click(screen.getByText("Latte"));

    // The real customizer: sizes and options by name.
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Regular")).toBeInTheDocument();
    expect(within(sheet).getByText("Large")).toBeInTheDocument();
    expect(within(sheet).getByText("Oat milk")).toBeInTheDocument();
    expect(within(sheet).getByText("Extra hot")).toBeInTheDocument();
    expect(within(sheet).queryByText("No charge")).toBeNull();
    noPriceOnScreen();

    fireEvent.click(within(sheet).getByText("Large"));
    fireEvent.click(within(sheet).getByText("Oat milk"));
    fireEvent.click(within(sheet).getByRole("button", { name: "Add to cart" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // The basket bar: a count, no total.
    fireEvent.click(screen.getByRole("button", { name: /View cart/ }));
    const cart = await screen.findByRole("dialog");
    expect(within(cart).getByText("Latte")).toBeInTheDocument();
    expect(within(cart).getByText(/Large · Oat milk/)).toBeInTheDocument();
    expect(within(cart).queryByText("Subtotal")).toBeNull();
    expect(within(cart).queryByText("Total")).toBeNull();
    noPriceOnScreen();

    fireEvent.click(within(cart).getByRole("button", { name: "Show to staff" }));
    const list = await screen.findByTestId("staff-list");
    expect(within(list).getByText("Latte")).toBeInTheDocument();
    expect(within(list).getByText("1×")).toBeInTheDocument();
    expect(within(list).getByText(/Large · Oat milk/)).toBeInTheDocument();
    expect(screen.getByText("Show this to a member of staff.")).toBeInTheDocument();
    noPriceOnScreen();

    // Nothing was priced or submitted on the way.
    expect(anyOrderCall).not.toHaveBeenCalled();
  });

  it("keeps the list for the visit, under its own key", () => {
    const { unmount } = wrap(<MenuDisplayPage orgId="o-1" />);
    fireEvent.click(screen.getByText("Croissant"));
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    unmount();
    expect(JSON.parse(sessionStorage.getItem("madar_menu_list:o-1:b-1") ?? "[]")).toHaveLength(1);
    expect(localStorage.getItem("madar_order_cart:o-1:b-1")).toBeNull();
    wrap(<MenuDisplayPage orgId="o-1" />);
    expect(screen.getByRole("button", { name: /View cart/ })).toBeInTheDocument();
  });

  it("reads in Arabic, right to left, with the shop's Arabic title", async () => {
    await act(() => i18n.changeLanguage("ar"));
    wrap(<MenuDisplayPage orgId="o-1" />);
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getAllByText("قائمتنا").length).toBeGreaterThan(0);
    expect(screen.getByText("لاتيه")).toBeInTheDocument();
    expect(screen.getAllByText("مخبوزات").length).toBeGreaterThan(0);
    noPriceOnScreen();
  });

  it("says the menu is unavailable when the shop has it off", () => {
    publicMenuDisplay.mockReturnValue({ data: undefined, isPending: false, isError: true });
    wrap(<MenuDisplayPage orgId="o-1" />);
    expect(screen.getByText("This menu isn't available")).toBeInTheDocument();
  });
});
