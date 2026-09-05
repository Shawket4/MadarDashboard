import { describe, expect, it } from "vitest";

import { buildCountPayload, countsDue, isVarianceFlagged, missingReasons, needsFirstCount, parseCount } from "./lib";

/**
 * The count editor gates "Review & finalize" on the same rule the backend
 * enforces (409 otherwise), measured against BOOK stock — never the opening
 * snapshot, or a sale during a long count would read as shrinkage.
 */
describe("isVarianceFlagged", () => {
  it("flags a difference at or above the tolerance of book stock", () => {
    expect(isVarianceFlagged(100, 90, 10)).toBe(true);
    expect(isVarianceFlagged(100, 91, 10)).toBe(false);
    expect(isVarianceFlagged(100, 110, 10)).toBe(true);
  });

  it("flags stock that appears from zero and never flags an uncounted row", () => {
    expect(isVarianceFlagged(0, 3, 10)).toBe(true);
    expect(isVarianceFlagged(0, 0, 10)).toBe(false);
    expect(isVarianceFlagged(100, null, 10)).toBe(false);
  });
});

describe("buildCountPayload", () => {
  it("sends only counted rows, with their reason when one was picked", () => {
    const payload = buildCountPayload(["a", "b", "c"], { a: "12", b: "", c: "abc" }, { a: "miscount" });
    expect(payload).toEqual([{ org_ingredient_id: "a", counted_qty: 12, variance_reason: "miscount" }]);
  });

  it("treats a blank reason as none", () => {
    expect(buildCountPayload(["a"], { a: "0" }, { a: "" })[0].variance_reason).toBeNull();
    expect(parseCount(" ")).toBeNull();
  });
});

describe("missingReasons", () => {
  const items = [
    { org_ingredient_id: "milk", ingredient_name: "Milk", book_qty: 100 },
    { org_ingredient_id: "new", ingredient_name: "New item", book_qty: 0 },
  ];

  it("names flagged rows without a reason, ignoring small differences", () => {
    expect(missingReasons(items, { milk: "50", new: "0" }, {}, 10)).toEqual(["Milk"]);
    expect(missingReasons(items, { milk: "95", new: "4" }, {}, 10)).toEqual(["New item"]);
    expect(missingReasons(items, { milk: "50", new: "4" }, { milk: "theft", new: "miscount" }, 10)).toEqual([]);
  });
});

describe("first-run and counts due", () => {
  it("treats a branch with no finalized count as needing its first count", () => {
    expect(needsFirstCount([])).toBe(true);
    expect(needsFirstCount([{ status: "in_progress" }])).toBe(true);
    expect(needsFirstCount([{ status: "finalized" }, { status: "cancelled" }])).toBe(false);
    expect(needsFirstCount(undefined)).toBe(false);
  });

  it("counts never-counted and stale rows across the whole catalog", () => {
    const now = Date.parse("2026-09-05T12:00:00Z");
    const rows = [
      { last_counted_at: null },
      { last_counted_at: "2026-09-01T00:00:00Z" },
      { last_counted_at: "2026-08-01T00:00:00Z" },
    ];
    expect(countsDue(rows, now)).toBe(2);
  });
});
