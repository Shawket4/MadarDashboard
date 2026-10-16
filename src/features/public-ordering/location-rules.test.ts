import { describe, expect, it } from "vitest";

import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";

import { locationStepRequired, savedPointFor } from "./location-rules";

const on = { in_mall_require_location: true };
const off = { in_mall_require_location: false };

describe("locationStepRequired", () => {
  it("in-mall follows the branch's Require GPS location toggle", () => {
    expect(locationStepRequired("in_mall", on)).toBe(true);
    expect(locationStepRequired("in_mall", off)).toBe(false);
  });

  it("in-mall on a branch not loaded yet counts as on, the server's default", () => {
    expect(locationStepRequired("in_mall", null)).toBe(true);
  });

  it("outside always needs its delivery pin, whatever the in-mall toggle says", () => {
    expect(locationStepRequired("outside", off)).toBe(true);
    expect(locationStepRequired("outside", on)).toBe(true);
  });

  it("umbrella, pickup and no channel never ask", () => {
    expect(locationStepRequired("umbrella", on)).toBe(false);
    expect(locationStepRequired("pickup", on)).toBe(false);
    expect(locationStepRequired(null, on)).toBe(false);
  });
});

describe("savedPointFor", () => {
  const loc = { customer_lat: 30.1, customer_lng: 31.2 } as GuestSavedLocation;

  it("an outside address's pin is the point", () => {
    expect(savedPointFor("outside", loc)).toEqual({ lat: 30.1, lng: 31.2 });
  });

  it("an in-mall address never stands in for the device's location", () => {
    expect(savedPointFor("in_mall", loc)).toBeNull();
  });

  it("an address with no coordinates has no point", () => {
    expect(savedPointFor("outside", { customer_lat: null, customer_lng: null } as GuestSavedLocation)).toBeNull();
  });
});
