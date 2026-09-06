import { describe, expect, it } from "vitest";

import { invalidationsFor } from "./use-branch-realtime";

describe("invalidationsFor", () => {
  it("maps booking events to the bookings list AND the floor (next_booking)", () => {
    expect(invalidationsFor("booking.created")).toEqual(["/bookings", "/floor"]);
    expect(invalidationsFor("booking.arriving")).toEqual(["/bookings", "/floor"]);
  });
  it("keeps floor events on the floor and tickets on both", () => {
    expect(invalidationsFor("table.status_changed")).toEqual(["/floor"]);
    expect(invalidationsFor("ticket.fired")).toEqual(["/open-tickets", "/floor"]);
  });
  it("treats a resync as everything stale and ignores the unknown", () => {
    expect(invalidationsFor("resync")).toEqual(["/"]);
    expect(invalidationsFor("something.else")).toEqual([]);
  });
});
