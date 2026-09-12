// A table's takings come from a join nobody was reading. The one thing this
// panel must never do is print a zero where it has no answer: "this table
// earns nothing" and "nobody could fetch it" are different facts and a
// manager acts differently on each.
import { describe, expect, it } from "vitest";

import { formatStay } from "./table-history";

describe("formatStay", () => {
  it("reads a stay, not a timestamp", () => {
    expect(formatStay(45)).toBe("45m");
    expect(formatStay(60)).toBe("1h");
    expect(formatStay(62)).toBe("1h 02m");
    expect(formatStay(185)).toBe("3h 05m");
  });

  it("says nothing rather than 0m for a sitting with no measurable time", () => {
    // A bill opened and settled inside the same minute is a mis-ring, not a
    // zero-minute stay — printing "0m" would put it into a manager's average
    // as a real, very fast table.
    expect(formatStay(0)).toBe("—");
  });
});
