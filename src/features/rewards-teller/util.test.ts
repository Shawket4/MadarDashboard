import { describe, expect, it } from "vitest";

import { cardDots, clampItems, readyToLookUp } from "./util";

describe("readyToLookUp", () => {
  it("looks a whole card up at once, Enter or not", () => {
    expect(readyToLookUp("MAAAAAAAAAAAAAAAAAAAAAA", false)).toEqual({ token: "MAAAAAAAAAAAAAAAAAAAAAA" });
  });
  it("waits for a half-scanned card", () => {
    expect(readyToLookUp("MAAAAAAAAAAA", true)).toBeNull();
  });
  it("waits for Enter on a phone, then sends it canonical", () => {
    expect(readyToLookUp("01001234567", false)).toBeNull();
    expect(readyToLookUp("01001234567", true)).toEqual({ phone: "201001234567" });
    expect(readyToLookUp("٠١٠٠١٢٣٤٥٦٧", true)).toEqual({ phone: "201001234567" });
  });
  it("never looks junk up", () => {
    expect(readyToLookUp("hello", true)).toBeNull();
  });
});

describe("cardDots", () => {
  it("fills to the size and carries the rest", () => {
    expect(cardDots(3, 5)).toEqual({ filled: 3, size: 5, extra: 0 });
    expect(cardDots(7, 5)).toEqual({ filled: 5, size: 5, extra: 2 });
    expect(cardDots(-1, 5)).toEqual({ filled: 0, size: 5, extra: 0 });
  });
});

describe("clampItems", () => {
  it("keeps a visit between 1 and 50 items", () => {
    expect([clampItems(0), clampItems(3), clampItems(99), clampItems(Number.NaN)]).toEqual([1, 3, 50, 1]);
  });
});
