import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { buildSheets, orderSheetNames } from "./build-sheets";
import type { Grain } from "./types";

const t = ((key: string, fallback?: string | { defaultValue?: string }) =>
  typeof fallback === "string" ? fallback : fallback?.defaultValue ?? key) as unknown as TFunction;

describe("the orders export's sheets", () => {
  // The export sheet offers these names for a PDF or CSV and passes the pick's
  // index: they must be the sheets buildSheets makes, in its order.
  it.each<Grain[]>([
    ["order"],
    ["order", "payment"],
    ["deduction"],
    ["payment", "order", "line_item", "deduction"],
  ])("names %j in buildSheets' order", (...grains) => {
    expect(orderSheetNames(grains, t)).toEqual(buildSheets([], grains, t, "en").map((s) => s.name));
  });
});
