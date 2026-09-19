import { describe, expect, it } from "vitest";

import type { EarningItem, MenuItem } from "@/data/api/generated/models";

import { isPickable, listChanged, rowsFromList, rowsToWire } from "./earning-schema";

const item = (id: string, name: string): EarningItem =>
  ({ menu_item_id: id, name, image_url: null, base_price: 5_000, sort_order: 0 }) as EarningItem;

describe("the list of items that collect a stamp", () => {
  it("round trips what the server sent", () => {
    const rows = rowsFromList([item("a", "Latte"), item("b", "Cake")]);
    expect(rows).toEqual([
      { menu_item_id: "a", name: "Latte" },
      { menu_item_id: "b", name: "Cake" },
    ]);
    expect(rowsToWire(rows)).toEqual(["a", "b"]);
  });

  it("sends each item once, however it got onto the list twice", () => {
    // The list's LENGTH is read by people ("three items collect"), and its
    // emptiness is load-bearing, so a duplicate is never harmless here.
    expect(
      rowsToWire([
        { menu_item_id: "a", name: "Latte" },
        { menu_item_id: "a", name: "Latte" },
        { menu_item_id: "b", name: "Cake" },
      ]),
    ).toEqual(["a", "b"]);
  });

  it("treats an empty list as a saveable state, not a missing one", () => {
    // Clearing the list is a real edit: it puts the programme back to "every
    // item collects". A Save button that stayed grey here would make that
    // unreachable.
    expect(listChanged([], [item("a", "Latte")])).toBe(true);
    expect(rowsToWire([])).toEqual([]);
  });

  it("notices an addition or a removal and ignores a reorder", () => {
    const saved = [item("a", "Latte"), item("b", "Cake")];
    expect(listChanged(rowsFromList(saved), saved)).toBe(false);
    expect(
      listChanged(
        [
          { menu_item_id: "b", name: "Cake" },
          { menu_item_id: "a", name: "Latte" },
        ],
        saved,
      ),
      // Only membership changes what a customer earns.
    ).toBe(false);
    expect(listChanged([{ menu_item_id: "a", name: "Latte" }], saved)).toBe(true);
    expect(
      listChanged(
        [...rowsFromList(saved), { menu_item_id: "c", name: "Water" }],
        saved,
      ),
    ).toBe(true);
  });

  it("offers only items the till could actually sell", () => {
    expect(isPickable({ is_active: true, deleted_at: null } as MenuItem)).toBe(true);
    expect(isPickable({ is_active: false, deleted_at: null } as MenuItem)).toBe(false);
    expect(isPickable({ is_active: true, deleted_at: "2026-01-01" } as MenuItem)).toBe(false);
  });
});
