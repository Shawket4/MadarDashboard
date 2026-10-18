import { describe, expect, it } from "vitest";

import type { BranchSalesReport, CombinedItemSalesRow, MenuItem } from "@/data/api/generated/models";
import { itemRows, menuImageUrl } from "./items-rows";

const item = (item_id: string, item_name: string, total_qty: number, ar?: string): CombinedItemSalesRow => ({
  item_id,
  item_name,
  item_name_translations: ar ? { ar } : {},
  standalone_qty: total_qty,
  total_qty,
});

const sold = (menu_item_id: string, quantity_sold: number, revenue: number) => ({
  menu_item_id,
  item_name: menu_item_id,
  item_name_translations: {},
  quantity_sold,
  revenue,
});

const SALES = {
  by_category: [
    {
      category_id: "hot", category_name: "Hot Drinks", category_name_translations: { ar: "مشروبات ساخنة" },
      item_count: 2, quantity_sold: 0, revenue: 0,
      items: [sold("latte", 10, 60_000), sold("mocha", 4, 30_000)],
    },
    {
      category_id: "food", category_name: "Food", category_name_translations: {},
      item_count: 1, quantity_sold: 0, revenue: 0,
      items: [sold("cake", 5, 10_000)],
    },
  ],
} as unknown as BranchSalesReport;

const menuItem = (id: string, category_id: string | null, extra: Partial<MenuItem> = {}) =>
  ({ id, category_id, image_url: null, ...extra }) as MenuItem;

const MENU = [
  menuItem("latte", "hot", { image_url: "https://img.test/latte.jpg" }),
  menuItem("croissant", "food"),
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

  it("shares revenue against the table's known revenue, and averages over the report's units", () => {
    expect(byId.latte.share).toBeCloseTo(0.6);
    expect(byId.mocha.share).toBeCloseTo(0.3);
    // 60,000 over the report's 10 units, not the items read's 12.
    expect(byId.latte.avgPrice).toBe(6_000);
  });

  it("leaves revenue, share and price empty (never 0) for an item the report does not list, its category from the menu", () => {
    expect(byId.croissant).toMatchObject({ revenue: null, share: null, avgPrice: null, category: "Food" });
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
      by_category: [{ ...SALES.by_category[0], items: [sold("latte", 10, 60_000), sold("latte", 2, 12_000)] }],
    } as unknown as BranchSalesReport;
    const merged = itemRows({ items: [item("latte", "Latte", 10), item("latte", "Café Latte", 2)], sales, menu: [], lang: "en" });
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ units: 12, revenue: 72_000, avgPrice: 6_000, share: 1 });
    expect(merged[0].names).toContain("Café Latte");
  });

  it("works before the report or the menu arrives", () => {
    const bare = itemRows({ items: [item("latte", "Latte", 12)], sales: undefined, menu: undefined, lang: "en" });
    expect(bare[0]).toMatchObject({ revenue: null, category: null, image: null, units: 12 });
  });
});
