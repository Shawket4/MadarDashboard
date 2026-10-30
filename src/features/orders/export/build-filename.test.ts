/**
 * The export's file name names the period's days on the shop's clock. The
 * period's ends are instants (the scope's day bounds): Cairo's 18 September
 * starts at 21:00Z on the 17th, so cutting the UTC date off the instant named
 * the day before.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";

import { buildFilename } from "./build-filename";

afterEach(() => {
  vi.useRealTimers();
  useAppStore.getState().setActiveTimezone(APP_TZ);
});

describe("buildFilename", () => {
  it("names the period's own days (Cairo, +03:00 in September)", () => {
    useAppStore.getState().setActiveTimezone("Africa/Cairo");
    expect(
      buildFilename({ presetId: "accountant_daily", branchSlug: "zamalek", from: "2026-09-17T21:00:00.000Z", to: "2026-09-18T20:59:59.999Z" }),
    ).toBe("accountant-daily-zamalek-2026-09-18_to_2026-09-18");
  });

  it("without a period, names the shop's today, not UTC's", () => {
    useAppStore.getState().setActiveTimezone("Asia/Dubai");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-31T20:30:00Z")); // 00:30 on 1 November in Dubai
    expect(buildFilename({ presetId: "accountant_daily", branchSlug: "jumeirah", from: null, to: null })).toBe("accountant-daily-jumeirah-2026-11-01");
  });
});
