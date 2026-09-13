import { describe, expect, it } from "vitest";

import { normalizePresetId, orderDisplayNumber, readTillSearch } from "./till-filter";

describe("orders till vocabulary", () => {
  it("reads the old shift_handoff preset as till_handoff", () => {
    expect(normalizePresetId("shift_handoff")).toBe("till_handoff");
    expect(normalizePresetId("till_handoff")).toBe("till_handoff");
    expect(normalizePresetId("nope")).toBe("accountant_daily");
  });

  it("accepts ?shift_id as an alias of the till filter", () => {
    expect(readTillSearch({ shift_id: "a" })).toBe("a");
    expect(readTillSearch({ till: "b", shift_id: "a" })).toBe("b");
    expect(readTillSearch({})).toBeUndefined();
  });

  it("builds the display number from the device code", () => {
    expect(orderDisplayNumber({ device_code: "36B", order_number: 12 })).toBe("36B-12");
    expect(orderDisplayNumber({ order_number: 7 })).toBe("7");
    expect(orderDisplayNumber({ display_number: "X-1", order_number: 1 })).toBe("X-1");
  });
});
