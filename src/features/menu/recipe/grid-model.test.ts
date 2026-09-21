import { describe, expect, it } from "vitest";

import {
  addRow,
  buildGridRows,
  changedSizeKeys,
  copyColumn,
  ownPayload,
  ownRecipeSig,
  removeRow,
  scaleColumn,
  setCell,
  swapGroupFor,
  type GridBlock,
} from "./grid-model";

const cup = (): GridBlock => ({
  key: "cup",
  id: "cup",
  label: "Cup",
  lines: [
    { ingredient_id: "milk", quantity: "180", unit: "g" },
    { ingredient_id: "beans", quantity: "18", unit: "g", source: "own" },
    { ingredient_id: "honey", quantity: "10", unit: "g", source: "base" },
    { ingredient_id: "cup16", quantity: "1", unit: "pcs", source: "rule" },
  ],
});
const can = (): GridBlock => ({
  key: "can",
  id: "can",
  label: "Can",
  lines: [
    { ingredient_id: "milk", quantity: "250", unit: "g" },
    { ingredient_id: "honey", quantity: "12", unit: "g", source: "base" },
  ],
});

const pristineOf = (blocks: GridBlock[]) => Object.fromEntries(blocks.map((b) => [b.key, ownRecipeSig(b.lines)]));

describe("save diffing", () => {
  it("excludes base/rule/linked lines from the payload", () => {
    expect(ownPayload(cup().lines)).toEqual([
      { ingredient_id: "milk", quantity: 180, unit: "g" },
      { ingredient_id: "beans", quantity: 18, unit: "g" },
    ]);
    expect(ownPayload([{ ingredient_id: "x", quantity: "5", unit: "g", source: "linked" }])).toEqual([]);
  });

  it("drops blank cells from the payload", () => {
    expect(ownPayload([{ ingredient_id: "x", quantity: "", unit: "g" }])).toEqual([]);
  });

  it("reports only sizes whose own lines changed", () => {
    const blocks = [cup(), can()];
    const pristine = pristineOf(blocks);
    expect(changedSizeKeys(blocks, pristine).size).toBe(0);

    const edited = setCell(blocks, "can", "milk", "260", "g");
    expect([...changedSizeKeys(edited, pristine)]).toEqual(["can"]);
  });

  it("ignores changes to non-own lines", () => {
    const blocks = [cup(), can()];
    const pristine = pristineOf(blocks);
    const refreshed = blocks.map((b) => ({
      ...b,
      lines: b.lines.map((l) => (l.source === "base" ? { ...l, quantity: "99" } : l)),
    }));
    expect(changedSizeKeys(refreshed, pristine).size).toBe(0);
  });

  it("treats an added empty row as no change, and new sizes as changed", () => {
    const blocks = [cup(), can()];
    const pristine = pristineOf(blocks);
    expect(changedSizeKeys(addRow(blocks, "sugar", "g"), pristine).size).toBe(0);
    const withNew = [...blocks, { key: "new-1", label: "Big", lines: [] }];
    expect([...changedSizeKeys(withNew, pristine)]).toEqual(["new-1"]);
  });
});

describe("grid pivot + edits", () => {
  it("pivots rows own first, then base, then rule", () => {
    const rows = buildGridRows([cup(), can()]);
    expect(rows.map((r) => r.key)).toEqual(["own:milk", "own:beans", "base:honey", "rule:cup16"]);
    expect(rows[0].cells).toEqual({ cup: "180", can: "250" });
    expect(rows[1].cells.can).toBeUndefined();
  });

  it("setCell adds a missing own line without touching a same-ingredient base line", () => {
    const next = setCell([cup(), can()], "can", "honey", "5", "g");
    const canLines = next[1].lines;
    expect(canLines.filter((l) => l.ingredient_id === "honey")).toHaveLength(2);
    expect(ownPayload(canLines)).toContainEqual({ ingredient_id: "honey", quantity: 5, unit: "g" });
  });

  it("removeRow removes only own lines", () => {
    const next = removeRow([cup()], "honey");
    expect(next[0].lines.some((l) => l.ingredient_id === "honey")).toBe(true);
    const next2 = removeRow([cup()], "milk");
    expect(next2[0].lines.some((l) => l.ingredient_id === "milk")).toBe(false);
  });
});

describe("copy / scale helpers", () => {
  it("copies own lines from another size, keeping the target's sourced lines", () => {
    const next = copyColumn([cup(), can()], "cup", "can");
    const canLines = next[1].lines;
    expect(ownPayload(canLines)).toEqual([
      { ingredient_id: "milk", quantity: 180, unit: "g" },
      { ingredient_id: "beans", quantity: 18, unit: "g" },
    ]);
    expect(canLines.find((l) => l.source === "base")?.quantity).toBe("12");
    expect(canLines.some((l) => l.source === "rule")).toBe(false);
  });

  it("copies scaled", () => {
    const next = copyColumn([cup(), can()], "cup", "can", 2);
    expect(ownPayload(next[1].lines).map((l) => l.quantity)).toEqual([360, 36]);
  });

  it("scales own quantities in place and rounds to 3 decimals", () => {
    const next = scaleColumn([cup()], "cup", 1 / 3);
    expect(next[0].lines.map((l) => l.quantity)).toEqual(["60", "6", "10", "1"]);
    const blank = scaleColumn([{ key: "k", label: "K", lines: [{ ingredient_id: "a", quantity: "", unit: "g" }] }], "k", 2);
    expect(blank[0].lines[0].quantity).toBe("");
    expect(scaleColumn([{ key: "k", label: "K", lines: [{ ingredient_id: "a", quantity: "1", unit: "g" }] }], "k", 0.3333)[0].lines[0].quantity).toBe("0.333");
  });

  it("copy onto itself with a factor scales", () => {
    const next = copyColumn([cup()], "cup", "cup", 2);
    expect(next[0].lines[0].quantity).toBe("360");
  });
});

describe("swappable badge", () => {
  const slugs: Record<string, string> = { milk: "milk", oat: "milk", beans: "coffee_bean", syrup: "syrup" };
  const slugOf = (id: string) => slugs[id];
  const groups = [
    { name: "Extras", ingredientIds: ["syrup"] },
    { name: "Milk", ingredientIds: ["oat", "milk"] },
  ];
  it("matches a group offering the same family", () => {
    expect(swapGroupFor("milk", groups, slugOf)).toBe("Milk");
    expect(swapGroupFor("coffee_bean", groups, slugOf)).toBeNull();
    expect(swapGroupFor("syrup", groups, slugOf)).toBeNull();
  });
});
