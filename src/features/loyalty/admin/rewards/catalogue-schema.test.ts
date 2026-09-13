import { describe, expect, it } from "vitest";

import type { MenuItem, RewardItem } from "@/data/api/generated/models";

import {
  catalogueChanged,
  catalogueSchema,
  isBlocking,
  isOfferable,
  rowProblems,
  rowsFromCatalogue,
  rowsToWire,
} from "./catalogue-schema";

const menuItem = (id: string, extra: Partial<MenuItem> = {}): MenuItem =>
  ({
    id,
    name: id,
    base_price: 5000,
    is_active: true,
    deleted_at: null,
    org_id: "o",
    category_id: "c",
    created_at: "",
    updated_at: "",
    ...extra,
  }) as MenuItem;

const saved: RewardItem[] = [
  { menu_item_id: "espresso", name: "Espresso", base_price: 4000, cost_currency: "visits", cost_amount: 5, sort_order: 0 },
  { menu_item_id: "cake", name: "Cake", base_price: 9000, cost_currency: "visits", cost_amount: 10, sort_order: 1 },
];

describe("the reward catalogue rules", () => {
  it("accepts a clean list", () => {
    expect(catalogueSchema.safeParse(rowsFromCatalogue(saved)).success).toBe(true);
    expect(rowProblems(rowsFromCatalogue(saved), [menuItem("espresso"), menuItem("cake")])).toEqual([null, null]);
  });

  it.each([0, -1, 2.5, Number.NaN])("refuses a cost of %s", (cost) => {
    const rows = [{ ...rowsFromCatalogue(saved)[0], cost_amount: cost }];
    expect(catalogueSchema.safeParse(rows).success).toBe(false);
    expect(rowProblems(rows, undefined)).toEqual(["cost"]);
  });

  it("refuses the same item twice, flagging the second", () => {
    const rows = [...rowsFromCatalogue(saved), rowsFromCatalogue(saved)[0]];
    expect(catalogueSchema.safeParse(rows).success).toBe(false);
    expect(rowProblems(rows, undefined)).toEqual([null, null, "duplicate"]);
  });

  it("blocks a deleted item but only warns about a switched-off one", () => {
    const problems = rowProblems(rowsFromCatalogue(saved), [menuItem("espresso", { is_active: false })]);
    expect(problems).toEqual(["inactive", "unavailable"]);
    expect(problems.map(isBlocking)).toEqual([false, true]);
  });

  it("does not flag anything before the menu has loaded", () => {
    expect(rowProblems(rowsFromCatalogue(saved), undefined)).toEqual([null, null]);
  });

  it("only offers live, active items", () => {
    expect(isOfferable(menuItem("a"))).toBe(true);
    expect(isOfferable(menuItem("a", { is_active: false }))).toBe(false);
    expect(isOfferable(menuItem("a", { deleted_at: "2026-01-01" }))).toBe(false);
  });

  it("prices every row in the scope's currency on the wire", () => {
    expect(rowsToWire(rowsFromCatalogue(saved), "points")).toEqual([
      { menu_item_id: "espresso", cost_currency: "points", cost_amount: 5 },
      { menu_item_id: "cake", cost_currency: "points", cost_amount: 10 },
    ]);
  });

  it("knows when the editor differs from what was saved", () => {
    const rows = rowsFromCatalogue(saved);
    expect(catalogueChanged(rows, saved)).toBe(false);
    expect(catalogueChanged([{ ...rows[0], cost_amount: 6 }, rows[1]], saved)).toBe(true);
    expect(catalogueChanged([rows[1], rows[0]], saved)).toBe(true);
    expect(catalogueChanged(rows.slice(1), saved)).toBe(true);
  });
});
