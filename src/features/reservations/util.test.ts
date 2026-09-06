import { describe, expect, it } from "vitest";

import { addDays, fmtSlot, fmtWhen, pickableDates } from "./util";

describe("reservations util", () => {
  it("lists today through the horizon", () => {
    expect(pickableDates("2026-09-29", 2)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("renders slots in the branch zone, not the device zone", () => {
    // 16:30Z is 19:30 in Cairo summer time.
    expect(fmtSlot("2026-09-10T16:30:00Z", "Africa/Cairo", "en")).toMatch(/7:30/);
    expect(fmtWhen("2026-09-10T16:30:00Z", "Africa/Cairo", "en")).toMatch(/Thu.*10 Sep.*7:30/);
  });
});
