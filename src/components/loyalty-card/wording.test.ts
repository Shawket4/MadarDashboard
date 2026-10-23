/**
 * Every figure on a card is said in the programme's own unit, in both
 * languages and every plural form Arabic has.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { stampUnit, stampsOf, toNextReward, unitNoun, type StampUnit } from "./wording";

const i18n = (await import("@/i18n")).default;
const t = i18n.t.bind(i18n) as Parameters<typeof unitNoun>[0];

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("stampUnit", () => {
  it("is points for a points programme, whatever the server says", () => {
    expect(stampUnit("points", "item")).toBe("points");
    expect(stampUnit("points")).toBe("points");
  });

  it("takes the server's word for a stamp card, and an order when it says nothing it knows", () => {
    expect(stampUnit("visits", "item")).toBe("item");
    expect(stampUnit("visits", "stamp")).toBe("stamp");
    expect(stampUnit("visits", "order")).toBe("order");
    expect(stampUnit("visits", null)).toBe("order");
    expect(stampUnit("visits", "litres")).toBe("order");
  });
});

describe("the unit's noun", () => {
  const EN: Record<StampUnit, [string, string]> = {
    order: ["order", "orders"],
    item: ["item", "items"],
    stamp: ["stamp", "stamps"],
    points: ["point", "points"],
  };
  // Arabic counts 1 and 2 with the singular beside a digit, 3–10 with the
  // plural, 11–99 with the accusative singular, 100 and up with the singular.
  const AR: Record<StampUnit, Record<number, string>> = {
    order: { 1: "طلب", 2: "طلب", 3: "طلبات", 10: "طلبات", 11: "طلبًا", 99: "طلبًا", 100: "طلب" },
    item: { 1: "صنف", 2: "صنف", 3: "أصناف", 10: "أصناف", 11: "صنفًا", 99: "صنفًا", 100: "صنف" },
    stamp: { 1: "ختم", 2: "ختم", 3: "أختام", 10: "أختام", 11: "ختمًا", 99: "ختمًا", 100: "ختم" },
    points: { 1: "نقطة", 2: "نقطة", 3: "نقاط", 10: "نقاط", 11: "نقطة", 99: "نقطة", 100: "نقطة" },
  };

  for (const unit of ["order", "item", "stamp", "points"] as const) {
    it(`says ${unit} in English`, () => {
      expect(unitNoun(t, unit, 1)).toBe(EN[unit][0]);
      expect(unitNoun(t, unit, 6)).toBe(EN[unit][1]);
      expect(unitNoun(t, unit, 0)).toBe(EN[unit][1]);
    });

    it(`says ${unit} in Arabic, in every plural form`, async () => {
      await i18n.changeLanguage("ar");
      for (const [count, noun] of Object.entries(AR[unit])) {
        expect(unitNoun(t, unit, Number(count)), `${unit} × ${count}`).toBe(noun);
      }
    });
  }
});

describe("the lines a card prints", () => {
  it("names what the next reward still needs, in the unit", () => {
    expect(toNextReward(t, "order", 4)).toBe("4 more orders to your next reward.");
    expect(toNextReward(t, "item", 1)).toBe("1 more item to your next reward.");
    expect(toNextReward(t, "stamp", 2)).toBe("2 more stamps to your next reward.");
    expect(toNextReward(t, "points", 1500)).toBe("1,500 more points to your next reward.");
  });

  it("says where the card stands", () => {
    expect(stampsOf(t, "order", 3, 6)).toBe("3 of 6 orders");
    expect(stampsOf(t, "item", 0, 10)).toBe("0 of 10 items");
  });

  it("says both in Arabic", async () => {
    await i18n.changeLanguage("ar");
    expect(toNextReward(t, "order", 4)).toBe("بقي 4 طلبات حتى مكافأتك التالية.");
    expect(toNextReward(t, "item", 12)).toBe("بقي 12 صنفًا حتى مكافأتك التالية.");
    expect(toNextReward(t, "stamp", 1)).toBe("بقي 1 ختم حتى مكافأتك التالية.");
    expect(stampsOf(t, "order", 3, 8)).toBe("3 من 8 طلبات");
    expect(stampsOf(t, "stamp", 5, 12)).toBe("5 من 12 ختمًا");
  });
});
