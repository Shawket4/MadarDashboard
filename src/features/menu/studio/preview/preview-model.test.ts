import { describe, expect, it } from "vitest";

import { EMPTY_SELECTION, toPreviewBody, toggleOptional, togglePick, type PreviewGroup } from "./preview-model";

const milk: PreviewGroup = {
  id: "g-milk",
  name: "Milk",
  single: true,
  required: true,
  max: 1,
  options: [
    { id: "full", name: "Full Cream", price: 0 },
    { id: "oat", name: "Oat", price: 5500 },
  ],
};
const extras: PreviewGroup = {
  id: "g-extras",
  name: "Extras",
  single: false,
  required: false,
  max: null,
  options: [
    { id: "shot", name: "Extra Shot", price: 4000 },
    { id: "caramel", name: "Caramel", price: 3000 },
  ],
};
const groups = [milk, extras];
const defaults = { "g-milk": "full" };

describe("preview selection → request body", () => {
  it("applies recipe defaults to untouched groups", () => {
    expect(toPreviewBody(EMPTY_SELECTION, groups, defaults)).toEqual({
      option_ids: ["full"],
      quantity: 1,
      service_mode: "takeaway",
    });
  });

  it("replaces the pick in an exactly-1 group and keeps a required pick", () => {
    let sel = togglePick(EMPTY_SELECTION, milk, "oat", defaults);
    expect(toPreviewBody(sel, groups, defaults).option_ids).toEqual(["oat"]);
    sel = togglePick(sel, milk, "oat", defaults);
    expect(toPreviewBody(sel, groups, defaults).option_ids).toEqual(["oat"]);
  });

  it("toggles multi groups and includes item-private optional ids", () => {
    let sel = togglePick(EMPTY_SELECTION, extras, "shot", defaults);
    sel = togglePick(sel, extras, "caramel", defaults);
    sel = togglePick(sel, extras, "shot", defaults);
    sel = toggleOptional(sel, "brown-bread");
    sel = { ...sel, size: "Can", service: "dine_in", quantity: 2 };
    expect(toPreviewBody(sel, groups, defaults)).toEqual({
      size_label: "Can",
      option_ids: ["full", "caramel", "brown-bread"],
      quantity: 2,
      service_mode: "dine_in",
    });
  });

  it("respects max on multi groups", () => {
    const capped = { ...extras, max: 1 };
    let sel = togglePick(EMPTY_SELECTION, capped, "shot", {});
    sel = togglePick(sel, capped, "caramel", {});
    expect(toPreviewBody(sel, [capped], {}).option_ids).toEqual(["shot"]);
  });
});
