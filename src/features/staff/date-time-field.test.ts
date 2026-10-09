import { describe, expect, it } from "vitest";

import { joinDateTime, splitDateTime } from "./date-time-field";

describe("a punch's day and time", () => {
  it("splits what the forms speak into the kit's day and time", () => {
    expect(splitDateTime("2026-09-22T09:02")).toEqual({ date: "2026-09-22", time: "09:02" });
    expect(splitDateTime("2026-09-22T09:02:30")).toEqual({ date: "2026-09-22", time: "09:02" });
    expect(splitDateTime("")).toEqual({ date: "", time: "" });
    expect(splitDateTime(null)).toEqual({ date: "", time: "" });
  });

  it("joins only a whole pair: half of one is nothing to save yet", () => {
    expect(joinDateTime("2026-09-22", "21:30")).toBe("2026-09-22T21:30");
    expect(joinDateTime("2026-09-22", "")).toBe("");
    expect(joinDateTime("", "21:30")).toBe("");
  });
});
