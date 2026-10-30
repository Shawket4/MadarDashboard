/**
 * The schedule is typed on the SHOP's clock (the scope's zone), not the
 * laptop's: an owner in New York scheduling for a shop in Dubai types Dubai's
 * time, and the window is measured from that instant (the composer's own test,
 * notifications-page.test.tsx, covers the field and the request).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { minutesAhead } from "./util";

// Dubai is +04:00 all year (no summer time), so the expected instants are plain.
const SHOP = "Asia/Dubai";
const NOW = Date.parse("2026-11-05T06:00:00Z"); // 10:00 in Dubai, 01:00 in New York

beforeEach(() => vi.stubEnv("TZ", "America/New_York")); // the owner's laptop
afterEach(() => vi.unstubAllEnvs());

describe("the broadcast schedule, on the shop's clock", () => {
  it("the laptop really is elsewhere (the test pins the device zone)", () => {
    expect(new Date(NOW).getHours()).toBe(1);
  });

  it("reads a typed time on the shop's clock", () => {
    // 12:30 in Dubai is 08:30Z: 150 minutes after 06:00Z.
    expect(minutesAhead("2026-11-05T12:30", SHOP, NOW)).toBe(150);
  });

  it("is null for a time that is not a date", () => {
    expect(minutesAhead("", SHOP, NOW)).toBeNull();
    expect(minutesAhead("2026-02-30T10:00", SHOP, NOW)).toBeNull();
  });
});
