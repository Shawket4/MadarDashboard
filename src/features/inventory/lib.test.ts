import { describe, expect, it } from "vitest";

import {
  buildCountPayload,
  countsDue,
  isVarianceFlagged,
  missingReasons,
  needsFirstCount,
  parseCount,
  isBelowZero,
  wasteReceivedLate,
  wasteSource,
  wasteWhen,
} from "./lib";

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

describe("waste log source", () => {
  it("reads the server's source, and falls back for an older backend", () => {
    expect(wasteSource({ waste_source: "pos" })).toBe("pos");
    expect(wasteSource({ waste_source: null, source_type: "order" })).toBe("order");
    expect(wasteSource({ source_type: "waste" })).toBe("dashboard");
    expect(wasteSource({ waste_source: "refund" })).toBe("refund");
    expect(wasteSource({ waste_source: null, source_type: "refund" })).toBe("refund");
  });

  it("dates a queued till waste by when it happened on the device", () => {
    expect(wasteWhen({ occurred_at: "2026-09-17T08:00:00Z", created_at: "2026-09-17T10:00:00Z" })).toBe(
      "2026-09-17T08:00:00Z",
    );
    expect(wasteWhen({ occurred_at: null, created_at: "2026-09-17T10:00:00Z" })).toBe("2026-09-17T10:00:00Z");
  });
});

describe("waste log receive time", () => {
  it("shows when the server received it only past five minutes", () => {
    const occurred = "2026-09-17T08:00:00Z";
    expect(wasteReceivedLate({ occurred_at: occurred, received_at: "2026-09-17T08:04:59Z", created_at: "x" })).toBeNull();
    expect(wasteReceivedLate({ occurred_at: occurred, received_at: "2026-09-17T08:05:01Z", created_at: "x" })).toBe(
      "2026-09-17T08:05:01Z",
    );
    expect(wasteReceivedLate({ occurred_at: occurred, created_at: "2026-09-17T11:00:00Z" })).toBe("2026-09-17T11:00:00Z");
    expect(wasteReceivedLate({ occurred_at: null, created_at: "2026-09-17T11:00:00Z" })).toBeNull();
  });
});

describe("below zero", () => {
  it("marks only a negative figure", () => {
    expect(isBelowZero(-0.5)).toBe(true);
    expect(isBelowZero(0)).toBe(false);
    expect(isBelowZero(3)).toBe(false);
    expect(isBelowZero(null)).toBe(false);
  });
});
