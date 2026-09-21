import { describe, expect, it } from "vitest";

import { addDays, dayTotals, dayWindow, hourTicks, isHeld, isLate, localHHMM, localInstant, serviceToday, timelineSpan, weekdayOf } from "./util";
import type { BookingSettings } from "@/data/api/generated/models/bookingSettings";
import type { BookingView } from "@/data/api/generated/models/bookingView";

const TZ = "Africa/Cairo"; // UTC+3 in September (Egypt observes summer time)

const settings = (hours: BookingSettings["hours"]): BookingSettings => ({
  branch_id: "b", enabled: true, hours, slot_minutes: 30, default_duration_minutes: 90,
  min_party: 1, max_party: 12, lead_time_minutes: 60, horizon_days: 30, hold_minutes: 15,
  require_otp: true, blackout_dates: [],
});

describe("booking day", () => {
  it("puts 00:30 on its own calendar date and rolls over at midnight", () => {
    // 2026-09-10 21:30Z = 00:30 Cairo on the 11th.
    expect(serviceToday(new Date("2026-09-10T21:30:00Z"), TZ)).toBe("2026-09-11");
    // 23:59 Cairo on the 10th → still the 10th.
    expect(serviceToday(new Date("2026-09-10T20:59:00Z"), TZ)).toBe("2026-09-10");
  });
  it("follows DST in the branch zone", () => {
    // London springs forward 2026-03-29: 23:30Z on the 28th is 23:30 GMT; 00:30Z on the 29th is 00:30 GMT.
    expect(serviceToday(new Date("2026-03-28T23:30:00Z"), "Europe/London")).toBe("2026-03-28");
    expect(serviceToday(new Date("2026-03-29T00:30:00Z"), "Europe/London")).toBe("2026-03-29");
    // Summer: 23:30Z is already 00:30 BST the next day.
    expect(serviceToday(new Date("2026-07-01T23:30:00Z"), "Europe/London")).toBe("2026-07-02");
  });
  it("adds days and knows weekdays", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(weekdayOf("2026-09-10")).toBe(4); // Thursday
  });
});

describe("local time", () => {
  it("round-trips a wall clock through the branch zone", () => {
    const iso = localInstant("2026-09-10", "19:30", TZ);
    expect(iso).toBe("2026-09-10T16:30:00.000Z");
    expect(localHHMM(iso, TZ)).toBe("19:30");
  });
});

describe("timeline", () => {
  const win = dayWindow(settings([{ dow: 4, open: "18:00", close: "23:00" }]), "2026-09-10");
  it("uses the day's hours, the whole day when they cross midnight, and falls back when closed", () => {
    expect(win).toEqual({ open: 18 * 60, close: 23 * 60 });
    expect(dayWindow(settings([{ dow: 4, open: "18:00", close: "02:00" }]), "2026-09-10")).toEqual({ open: 0, close: 24 * 60 });
    expect(dayWindow(settings([]), "2026-09-10")).toEqual({ open: 12 * 60, close: 24 * 60 });
  });
  it("places a 19:30–21:00 booking inside an 18:00–23:00 window", () => {
    const b = { starts_at: "2026-09-10T16:30:00Z", ends_at: "2026-09-10T18:00:00Z" };
    const { left, width } = timelineSpan(b, "2026-09-10", win, TZ);
    expect(left).toBeCloseTo((90 / 300) * 100, 5);
    expect(width).toBeCloseTo((90 / 300) * 100, 5);
    // 00:30 on the 11th sits at the start of the 11th's full-day window.
    const late = { starts_at: "2026-09-10T21:30:00Z", ends_at: "2026-09-10T23:00:00Z" };
    expect(timelineSpan(late, "2026-09-11", { open: 0, close: 1440 }, TZ).left).toBeCloseTo((30 / 1440) * 100, 5);
  });
  it("draws hour ticks across the window", () => {
    const ticks = hourTicks(win);
    expect(ticks[0]).toEqual({ label: "06:00 PM", left: 0 });
    expect(ticks.at(-1)).toEqual({ label: "11:00 PM", left: 100 });
  });
});

describe("tallies and state", () => {
  const b = (over: Partial<BookingView>): BookingView => ({
    id: "1", branch_id: "b", status: "confirmed", party_size: 2, starts_at: "2026-09-10T16:30:00Z",
    ends_at: "2026-09-10T18:00:00Z", held_from: "2026-09-10T16:15:00Z", guest_name: "A", guest_phone: "2",
    phone_verified: false, source: "host", locale: "en", table_ids: [], table_labels: [], needs_table: false,
    created_at: "", updated_at: "", ...over,
  });
  it("counts covers for seated/completed only, and flags parties with no table", () => {
    const t = dayTotals([b({ status: "seated", party_size: 4 }), b({ status: "completed", party_size: 3 }), b({ status: "no_show" }), b({ needs_table: true })]);
    expect(t).toEqual({ total: 4, covers: 7, seated: 1, noShow: 1, needsTable: 1 });
  });
  it("derives held and late from the clock", () => {
    const x = b({});
    expect(isHeld(x, new Date("2026-09-10T16:20:00Z"))).toBe(true);
    expect(isHeld(x, new Date("2026-09-10T16:00:00Z"))).toBe(false);
    expect(isLate(x, new Date("2026-09-10T16:40:00Z"))).toBe(true);
    expect(isHeld(b({ status: "seated" }), new Date("2026-09-10T17:00:00Z"))).toBe(false);
  });
});
