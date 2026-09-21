import { describe, expect, it } from "vitest";

import { ALL_SIZES, addLabelColumn, fromLabelBlocks, removeLabelColumn, toLabelBlocks } from "./label-model";

const lines = [
  { size_label: null, ingredient_id: "honey", quantity: "10.000", unit: "g" },
  { size_label: "Cup", ingredient_id: "milk", quantity: "90", unit: "g" },
  { size_label: "Can", ingredient_id: "milk", quantity: 110, unit: "g" },
];

describe("label grid model", () => {
  it("round-trips lines through columns", () => {
    const blocks = toLabelBlocks(lines, [], "All sizes");
    expect(blocks.map((b) => b.key)).toEqual([ALL_SIZES, "L:Cup", "L:Can"]);
    expect(blocks[0].lines[0].quantity).toBe("10");
    expect(fromLabelBlocks(blocks)).toEqual([
      { size_label: null, ingredient_id: "honey", quantity: 10, unit: "g" },
      { size_label: "Cup", ingredient_id: "milk", quantity: 90, unit: "g" },
      { size_label: "Can", ingredient_id: "milk", quantity: 110, unit: "g" },
    ]);
  });

  it("adds known size labels as empty columns and drops blank cells", () => {
    const blocks = addLabelColumn(toLabelBlocks(lines.slice(0, 1), ["Cup"], "All"), "Can");
    expect(blocks.map((b) => b.label)).toEqual(["All", "Cup", "Can"]);
    expect(blocks[2].lines).toHaveLength(1);
    expect(fromLabelBlocks(blocks)).toHaveLength(1);
  });

  it("never removes the every-size column", () => {
    const blocks = toLabelBlocks(lines, [], "All");
    expect(removeLabelColumn(blocks, ALL_SIZES)).toHaveLength(3);
    expect(removeLabelColumn(blocks, "L:Cup").map((b) => b.label)).toEqual(["All", "Can"]);
  });
});
