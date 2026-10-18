import { describe, expect, it } from "vitest";

import type { BranchSalesReport, CombinedItemSalesRow, MenuItem } from "@/data/api/generated/models";
import { itemRows, menuImageUrl, menuPriceRange, perUnit } from "./items-rows";

const item = (item_id: string, item_name: string, total_qty: number, ar?: string): CombinedItemSalesRow => ({
  item_id,
  item_name,
  item_name_translations: ar ? { ar } : {},
  standalone_qty: total_qty,
  total_qty,
});

const sold = (menu_item_id: string, quantity_sold: number, revenue: number, extras_total?: number) => ({
  menu_item_id,
  item_name: menu_item_id,
  item_name_translations: {},
  quantity_sold,
  revenue,
  ...(extras_total === undefined ? {} : { extras_total, menu_total: revenue, avg_extra: Math.round(extras_total / quantity_sold) }),
});

const SALES = {
  by_category: [
    {
      category_id: "hot", category_name: "Hot Drinks", category_name_translations: { ar: "مشروبات ساخنة" },
      item_count: 2, quantity_sold: 0, revenue: 0,
      // The mocha comes from a server before the extras fields.
      items: [sold("latte", 10, 60_000, 12_500), sold("mocha", 4, 30_000)],
    },
    {
      category_id: "food", category_name: "Food", category_name_translations: {},
      item_count: 1, quantity_sold: 0, revenue: 0,
      items: [sold("cake", 5, 10_000, 0)],
    },
  ],
} as unknown as BranchSalesReport;

type Sized = Partial<MenuItem> & { sizes?: { label: string; price_override: number; is_active: boolean }[] };
const menuItem = (id: string, category_id: string | null, extra: Sized = {}) =>
  ({ id, category_id, image_url: null, base_price: 1_000, ...extra }) as MenuItem;

const MENU = [
  menuItem("latte", "hot", {
    image_url: "https://img.test/latte.jpg",
    base_price: 5_500,
    sizes: [
      { label: "Small", price_override: 5_500, is_active: true },
      { label: "Large", price_override: 7_500, is_active: true },
      { label: "Jumbo", price_override: 9_900, is_active: false },
    ],
  }),
  menuItem("croissant", "food", { base_price: 4_500 }),
  menuItem("cake", "food", {
    image: { group_id: "g", variants: { thumb: { url: "https://img.test/cake-128.jpg" }, tile: { url: "https://img.test/cake-512.jpg" } } } as never,
    image_url: "https://img.test/cake-legacy.jpg",
  }),
];

describe("itemRows", () => {
  const rows = itemRows({
    items: [item("latte", "Latte", 12, "لاتيه"), item("mocha", "Mocha", 4), item("cake", "Cake", 5), item("croissant", "Croissant", 3)],
    sales: SALES,
    menu: MENU,
    lang: "en",
  });
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  it("joins revenue and category from the sales report on the menu item id", () => {
    expect(byId.latte).toMatchObject({ revenue: 60_000, category: "Hot Drinks", units: 12 });
    expect(byId.cake).toMatchObject({ revenue: 10_000, category: "Food" });
  });

  it("shares revenue against the table's known revenue, and averages the extras over the report's units", () => {
    expect(byId.latte.share).toBeCloseTo(0.6);
    expect(byId.mocha.share).toBeCloseTo(0.3);
    // 12,500 over the report's 10 units, not the items read's 12.
    expect(byId.latte.avgExtra).toBe(1_250);
    expect(byId.cake.avgExtra).toBe(0);
  });

  it("prices from the menu: the active sizes' range, else the base price, else nothing", () => {
    expect(byId.latte.price).toEqual({ min: 5_500, max: 7_500 });
    expect(byId.croissant.price).toEqual({ min: 4_500, max: 4_500 });
    expect(byId.mocha.price).toBeNull();
    expect(menuPriceRange(undefined)).toBeNull();
  });

  it("has no avg extra from a server without the extras fields (never 0, never from revenue)", () => {
    expect(byId.mocha).toMatchObject({ revenue: 30_000, avgExtra: null });
  });

  it("leaves revenue, share and avg extra empty (never 0) for an item the report does not list, its category and price from the menu", () => {
    expect(byId.croissant).toMatchObject({ revenue: null, share: null, avgExtra: null, category: "Food", price: { min: 4_500, max: 4_500 } });
  });

  it("rounds per unit to the piastre, half away from zero, like the server", () => {
    expect(perUnit(2_200, 4)).toBe(550);
    expect(perUnit(1_000, 3)).toBe(333);
    expect(perUnit(2_000, 3)).toBe(667);
    expect(perUnit(5, 2)).toBe(3);
    expect(perUnit(-5, 2)).toBe(-3);
    expect(perUnit(10, 0)).toBeNull();
  });

  it("takes the menu's smallest ready picture, else its address, else nothing", () => {
    expect(byId.cake.image).toBe("https://img.test/cake-128.jpg");
    expect(byId.latte.image).toBe("https://img.test/latte.jpg");
    expect(byId.mocha.image).toBeNull();
    expect(menuImageUrl({ image: { group_id: null, status: "processing", job_id: "j" } as never, image_url: "https://x/y.jpg" })).toBe("https://x/y.jpg");
  });

  it("names items and categories in the reader's language and keeps every name for search", () => {
    const ar = itemRows({ items: [item("latte", "Latte", 12, "لاتيه")], sales: SALES, menu: MENU, lang: "ar" });
    expect(ar[0]).toMatchObject({ name: "لاتيه", category: "مشروبات ساخنة" });
    expect(ar[0].names).toEqual(["Latte", "لاتيه"]);
  });

  it("merges an item listed twice (renamed mid-window) in both reads", () => {
    const sales = {
      by_category: [{ ...SALES.by_category[0], items: [sold("latte", 10, 60_000, 1_000), sold("latte", 2, 12_000, 1_000)] }],
    } as unknown as BranchSalesReport;
    const merged = itemRows({ items: [item("latte", "Latte", 10), item("latte", "Café Latte", 2)], sales, menu: [], lang: "en" });
    expect(merged).toHaveLength(1);
    // 2,000 of extras over 12 units (167, not the mean of the rows' 100 and 500).
    expect(merged[0]).toMatchObject({ units: 12, revenue: 72_000, avgExtra: 167, share: 1 });
    expect(merged[0].names).toContain("Café Latte");
    // One of the names' rows without the field: no figure at all.
    const partial = {
      by_category: [{ ...SALES.by_category[0], items: [sold("latte", 10, 60_000, 1_000), sold("latte", 2, 12_000)] }],
    } as unknown as BranchSalesReport;
    expect(itemRows({ items: [item("latte", "Latte", 12)], sales: partial, menu: [], lang: "en" })[0].avgExtra).toBeNull();
  });

  it("works before the report or the menu arrives", () => {
    const bare = itemRows({ items: [item("latte", "Latte", 12)], sales: undefined, menu: undefined, lang: "en" });
    expect(bare[0]).toMatchObject({ revenue: null, category: null, image: null, units: 12, price: null, avgExtra: null });
  });
});
