/**
 * "This month" (the birthday preset, a new birthday filter, the log's summary)
 * is the SHOP's month, not the laptop's: at the turn of a month an owner abroad
 * would otherwise pick last month's birthdays.
 */
import i18next from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";

import { audienceSummary } from "../notifications/util";
import { newRule, thisMonth } from "./rules";

const t = i18next.t.bind(i18next);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

beforeEach(() => {
  vi.stubEnv("TZ", "America/New_York"); // the owner's laptop
  useAppStore.getState().setActiveTimezone("Asia/Dubai"); // the shop, +04:00 all year
  vi.useFakeTimers({ toFake: ["Date"] });
  // 00:30 on 1 November in Dubai; still 16:30 on 31 October in New York.
  vi.setSystemTime(new Date("2026-10-31T20:30:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  useAppStore.getState().setActiveTimezone(APP_TZ);
});

describe("this month, on the shop's clock", () => {
  it("is the shop's month", () => {
    expect(new Date().getMonth() + 1).toBe(10); // the laptop's
    expect(thisMonth()).toBe(11);
  });

  it("starts a new birthday filter on it", () => {
    expect(newRule("birthday_month")).toEqual({ type: "birthday_month", month: 11 });
  });

  it("names the birthday preset by it in the log", () => {
    expect(audienceSummary([{ type: "birthday_month", month: 11 }], t, MONTHS, [])).toBe("Birthday this month");
  });
});
