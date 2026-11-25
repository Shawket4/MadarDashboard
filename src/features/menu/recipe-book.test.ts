import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import type { RecipeBook, RecipeCard } from "@/data/api/generated/models";
import { isBlockSheet, type ExcelBlockSheet, type ExcelSheet } from "@/lib/excel";
import { recipeBlock, recipeBookMeta, recipeBookSheets, recipeLinesSheet } from "./recipe-book";

/** English defaults with {{x}} filled, as i18next does with no resources. */
const t = ((key: string, a?: unknown, b?: unknown) => {
  const opts = (typeof a === "object" && a ? a : typeof b === "object" && b ? b : {}) as Record<string, unknown>;
  const def = typeof a === "string" ? a : (opts.defaultValue as string | undefined) ?? key;
  return def.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(opts[k] ?? ""));
}) as unknown as TFunction;

const COFFEE = "c-coffee";

const latte: RecipeCard = {
  menu_item_id: "i-latte",
  name: "Latte",
  name_translations: { ar: "لاتيه" },
  category_id: COFFEE,
  is_active: true,
  follows_item_name: null,
  sizes: [
    { size_id: "s1", label: "Small", price: 4000, is_active: true, base_name: null, cost_piastres: 205, cost_incomplete: false, food_cost_pct: 0.05125, margin_pct: 0.94875 },
    { size_id: "s2", label: "Large", price: 5000, is_active: false, base_name: null, cost_piastres: 285, cost_incomplete: true, food_cost_pct: null, margin_pct: null },
  ],
  rows: [
    { ingredient_id: "g1", ingredient_name: "Espresso beans", unit: "g", source: "own", cells: [{ quantity: 18, line_cost_piastres: 45 }, { quantity: 18, line_cost_piastres: 45 }] },
    { ingredient_id: "g2", ingredient_name: "Vanilla syrup", unit: "ml", source: "own", cells: [{ quantity: null, line_cost_piastres: null }, { quantity: 20, line_cost_piastres: null }] },
    { ingredient_id: "g3", ingredient_name: "Cup", unit: "pcs", source: "rule", cells: [{ quantity: 1, line_cost_piastres: 150 }, { quantity: 1, line_cost_piastres: 150 }] },
  ],
  steps: [
    { position: 1, name: "Pull a double shot", name_ar: "استخلص جرعتين", note: null, note_ar: null },
    { position: 2, name: "Steam the milk", name_ar: "بخّر الحليب", note: "To 60 °C", note_ar: "حتى 60 °م" },
  ],
};

const water: RecipeCard = {
  menu_item_id: "i-water",
  name: "Water",
  name_translations: {},
  category_id: null,
  is_active: true,
  follows_item_name: null,
  sizes: [{ size_id: "s3", label: "one_size", price: 1000, is_active: true, base_name: null, cost_piastres: null, cost_incomplete: false, food_cost_pct: null, margin_pct: null }],
  rows: [],
  steps: [],
};

const book: RecipeBook = {
  categories: [{ id: COFFEE, name: "Coffee", name_translations: { ar: "قهوة" } }],
  items: [latte, water],
};

const opts = { costs: true, lang: "en", t };

describe("a drink's table", () => {
  it("has a column per size, a row per ingredient, the steps under it", () => {
    const b = recipeBlock(latte, opts);
    expect(b.title).toBe("Latte");
    expect(b.header).toEqual(["Ingredient", "Unit", "Small", "Large (off)"]);
    expect(b.rows[0]).toEqual(["Espresso beans", "g", { value: 18, type: "quantity" }, { value: 18, type: "quantity" }]);
    expect(b.rows[1][2]).toBeNull(); // no vanilla in the small one
    expect(b.rows[2][0]).toBe("Cup (Packaging rule)");
    expect(b.caption).toBe("How it's made\n1. Pull a double shot\n2. Steam the milk — To 60 °C");
  });

  it("puts cost, price and food cost under it, and never grades a partial cost", () => {
    const [cost, price, food] = recipeBlock(latte, opts).footer!;
    expect(cost).toEqual(["Cost", null, { value: 205, type: "money" }, { value: 285, type: "money" }]);
    expect(price).toEqual(["Price", null, { value: 4000, type: "money" }, { value: 5000, type: "money" }]);
    expect(food).toEqual(["Food cost", null, { value: 0.05125, type: "percent" }, "Missing costs"]);
  });

  it("carries no money at all on a recipe card", () => {
    expect(recipeBlock(latte, { ...opts, costs: false }).footer).toBeUndefined();
    const lines = recipeLinesSheet(book, { ...opts, costs: false });
    expect(lines.columns.map((c) => c.header)).not.toContain("Line cost");
  });

  it("reads in Arabic when the dashboard does", () => {
    const b = recipeBlock(latte, { ...opts, lang: "ar" });
    expect(b.title).toBe("لاتيه");
    expect(b.caption).toBe("How it's made\n1. استخلص جرعتين\n2. بخّر الحليب — حتى 60 °م");
  });

  it("says whose recipe a linked copy follows, and that an item is off the menu", () => {
    const b = recipeBlock({ ...latte, follows_item_name: "Flat white", is_active: false }, opts);
    expect(b.note).toBe("Follows Flat white  ·  Inactive");
  });
});

describe("the recipe workbook", () => {
  it("groups the tables by category, and lists the items with no recipe at the end", () => {
    const [tables, lines] = recipeBookSheets(book, opts);
    expect(isBlockSheet(tables)).toBe(true);
    const sheet = tables as ExcelBlockSheet;
    expect(sheet.groups.map((g) => g.group)).toEqual(["Coffee", "No recipe yet"]);
    expect(sheet.groups[0].blocks.map((b) => b.title)).toEqual(["Latte"]);
    expect(sheet.groups[1].blocks[0].rows).toEqual([["Water"]]);
    expect(sheet.widths).toEqual([34, 9, 15, 15]); // label, unit, then the widest item's sizes
    expect(sheet.stats?.map((s) => s.value)).toEqual([2, 1, 1, 1]);
    expect((lines as ExcelSheet<Record<string, unknown>>).rows).toHaveLength(5); // 2 small + 3 large lines
  });

  it("files an uncategorised drink under Uncategorised, after the categories", () => {
    const loose = { ...latte, menu_item_id: "i-2", name: "Cold brew", category_id: null };
    const [tables] = recipeBookSheets({ ...book, items: [latte, loose] }, opts);
    expect((tables as ExcelBlockSheet).groups.map((g) => g.group)).toEqual(["Coffee", "Uncategorised"]);
  });

  it("names the one-size column", () => {
    const tea = { ...water, rows: [{ ingredient_id: "t", ingredient_name: "Tea", unit: "g", source: "own", cells: [{ quantity: 3, line_cost_piastres: 30 }] }] };
    expect(recipeBlock(tea, opts).header).toEqual(["Ingredient", "Unit", "One size"]);
  });
});

describe("the flat lines", () => {
  it("is one row per item, size and ingredient a size actually has", () => {
    const sheet = recipeLinesSheet(book, opts);
    const read = (r: Record<string, unknown>) => sheet.columns.map((c) => c.accessor(r as never));
    expect(sheet.rows.map((r) => read(r as never))).toEqual([
      ["Coffee", "Latte", "Small", "Espresso beans", "This item", 18, "g", 45],
      ["Coffee", "Latte", "Small", "Cup", "Packaging rule", 1, "pcs", 150],
      ["Coffee", "Latte", "Large", "Espresso beans", "This item", 18, "g", 45],
      ["Coffee", "Latte", "Large", "Vanilla syrup", "This item", 20, "ml", null],
      ["Coffee", "Latte", "Large", "Cup", "Packaging rule", 1, "pcs", 150],
    ]);
  });
});

describe("the subtitle", () => {
  it("says what the Items page was filtered to", () => {
    expect(recipeBookMeta({ category: "Coffee", search: "iced", recipe: "has" }, t)).toBe("Coffee  ·  “iced”  ·  Has a recipe");
    expect(recipeBookMeta({ recipe: "all" }, t)).toBeUndefined();
  });
});
