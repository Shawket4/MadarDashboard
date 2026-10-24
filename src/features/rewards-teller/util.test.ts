import { describe, expect, it } from "vitest";

import { cardDots, clampItems, readyToLookUp } from "./util";

describe("readyToLookUp", () => {
  it("looks a whole card up at once, Enter or not", () => {
    expect(readyToLookUp("MAAAAAAAAAAAAAAAAAAAAAA", false)).toEqual({ token: "MAAAAAAAAAAAAAAAAAAAAAA" });
  });
  it("waits for a half-scanned card", () => {
    expect(readyToLookUp("MAAAAAAAAAAA", true)).toBeNull();
  });
  it("waits for Enter on a phone, then sends it canonical", () => {
    expect(readyToLookUp("01001234567", false)).toBeNull();
    expect(readyToLookUp("01001234567", true)).toEqual({ phone: "201001234567" });
    expect(readyToLookUp("٠١٠٠١٢٣٤٥٦٧", true)).toEqual({ phone: "201001234567" });
  });
  it("never looks junk up", () => {
    expect(readyToLookUp("hello", true)).toBeNull();
  });
});

describe("cardDots", () => {
  it("fills to the size and carries the rest", () => {
    expect(cardDots(3, 5)).toEqual({ filled: 3, size: 5, extra: 0 });
    expect(cardDots(7, 5)).toEqual({ filled: 5, size: 5, extra: 2 });
    expect(cardDots(-1, 5)).toEqual({ filled: 0, size: 5, extra: 0 });
  });
});

describe("clampItems", () => {
  it("keeps a visit between 1 and 50 items", () => {
    expect([clampItems(0), clampItems(3), clampItems(99), clampItems(Number.NaN)]).toEqual([1, 3, 50, 1]);
  });
});

import { AxiosError, AxiosHeaders } from "axios";

import type { MemberView } from "@/data/api/generated/models";

import { WEDGE_GAP_MS, cardColors, failureOf, feedWedge, giftState, tracksOf, type Wedge } from "./util";
import { getErrorMessage } from "@/data/api/errors";
import i18n from "@/i18n";

const TOKEN = "MAAAAAAAAAAAAAAAAAAAAAA";

/** Feed a string as keystrokes `gap` ms apart; return the last lookup. */
function type(text: string, gap: number, start: Wedge = { buf: "", at: 0 }) {
  let w = start;
  let at = 1000;
  let found = null;
  for (const k of text) {
    const r = feedWedge(w, k, (at += gap));
    w = r.wedge;
    found = r.lookup ?? found;
  }
  return { w, found, at };
}

describe("feedWedge", () => {
  it("looks a card up as soon as a reader has typed the whole token", () => {
    expect(type(TOKEN, 5).found).toEqual({ token: TOKEN });
  });
  it("ignores the same keys typed at a person's pace", () => {
    expect(type(TOKEN, WEDGE_GAP_MS + 40).found).toBeNull();
  });
  it("looks a phone up on the reader's Enter, never before", () => {
    const { w, found, at } = type("01001234567", 5);
    expect(found).toBeNull();
    expect(feedWedge(w, "Enter", at + 5).lookup).toEqual({ phone: "201001234567" });
  });
  it("ignores keys that are not characters", () => {
    expect(feedWedge({ buf: "MA", at: 1 }, "Shift", 2)).toEqual({ wedge: { buf: "MA", at: 1 }, lookup: null });
  });
});

const err = (status: number | null, data?: unknown) => {
  const e = new AxiosError("x");
  if (status !== null)
    e.response = { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
  return e;
};

describe("failureOf", () => {
  it("names each refusal the counter shows differently", () => {
    expect(failureOf(err(null))).toEqual({ kind: "offline" });
    expect(failureOf(err(401))).toEqual({ kind: "expired" });
    expect(failureOf(err(404, { error: "Not found: No member for that card" }))).toEqual({ kind: "notMember" });
    expect(failureOf(err(403, { code: "plan_feature", feature: "loyalty" }))).toEqual({ kind: "notAllowed", plan: true });
    expect(failureOf(err(409, { code: "LOYALTY_PROGRAM_OFF" }))).toEqual({ kind: "notAllowed", plan: false });
    expect(failureOf(err(409, { code: "LOYALTY_CARD_AT_CAP" }))).toEqual({ kind: "other" });
    expect(failureOf(new Error("boom"))).toEqual({ kind: "other" });
  });
});

describe("tracksOf", () => {
  it("draws today's card as one track, with the carry-over", () => {
    const m = { balance: 11, next_reward_cost: 10, can_redeem: true } as MemberView;
    expect(tracksOf(m)).toEqual([{ id: "card", position: 1, name: null, filled: 10, size: 10, extra: 1, canRedeem: true }]);
  });
});

describe("cardColors", () => {
  it("uses the shop's wallet colours, else the Rewards ink card", () => {
    expect(cardColors({ background_color: "#F4E9D8", foreground_color: "#14181E", accent_color: "#AA3311" })).toMatchObject({
      bg: "#F4E9D8",
      dark: false,
    });
    expect(cardColors(null)).toEqual({ bg: "#14181E", fg: "#EFF3F4", accent: "#EFF3F4", dark: true });
    expect(cardColors({ background_color: "red", foreground_color: "#fff" }).bg).toBe("#14181E");
  });
});

describe("giftState", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  it("is open until valid_until, and shows the day before it as the last day", () => {
    const g = giftState({ status: "open", valid_until: "2026-11-21T22:00:00Z" }, now);
    expect(g?.status).toBe("open");
    expect(g?.lastDay.toISOString()).toBe("2026-11-21T21:59:59.999Z");
  });
  it("reads an open gift past its time as expired, and keeps claimed as claimed", () => {
    expect(giftState({ status: "open", valid_until: "2026-11-01T22:00:00Z" }, now)?.status).toBe("expired");
    expect(giftState({ status: "claimed", valid_until: "2026-11-01T22:00:00Z" }, now)?.status).toBe("claimed");
    expect(giftState(null, now)).toBeNull();
  });
});

describe("the birthday gift's refusals", () => {
  it("map to their own kind and read in both languages", async () => {
    const none = err(409, { code: "LOYALTY_GIFT_NONE", error: "Conflict: no gift" });
    expect(failureOf(none)).toEqual({ kind: "giftNone" });
    expect(getErrorMessage(none)).toBe("There's no birthday gift to give: it has expired or was already handed over.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(none)).toBe("لا توجد هدية عيد ميلاد لتسليمها: انتهت صلاحيتها أو سُلّمت من قبل.");
    expect(getErrorMessage(err(409, { code: "LOYALTY_KEY_REUSED", error: "Conflict: x" }))).not.toMatch(/[A-Za-z]{4}/);
    await i18n.changeLanguage("en");
  });
});
