/**
 * Every count on a card is said in the programme's unit, in English and in
 * the Arabic grammar of each count: one written out, two as a dual (nominative
 * after بقي, genitive after من), 3 to 10 with the plural, 11 to 99 with the
 * accusative singular, 100 to 102 with the singular.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { stampUnit, stampsOf, toNextReward, unitNoun, type StampUnit } from "./wording";

const i18n = (await import("@/i18n")).default;
const t = i18n.t.bind(i18n) as Parameters<typeof unitNoun>[0];

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

const UNITS = ["order", "item", "stamp", "points"] as const;
const COUNTS = [0, 1, 2, 3, 10, 11, 12, 100, 101, 102];

/** Arabic's forms of each unit's noun (طلب masculine, نقطة feminine). */
const AR: Record<StampUnit, { one: string; dual: string; dualGen: string; plural: string; acc: string; sing: string; fem: boolean }> = {
  order: { one: "طلب واحد", dual: "طلبان", dualGen: "طلبين", plural: "طلبات", acc: "طلبًا", sing: "طلب", fem: false },
  item: { one: "صنف واحد", dual: "صنفان", dualGen: "صنفين", plural: "أصناف", acc: "صنفًا", sing: "صنف", fem: false },
  stamp: { one: "ختم واحد", dual: "ختمان", dualGen: "ختمين", plural: "أختام", acc: "ختمًا", sing: "ختم", fem: false },
  points: { one: "نقطة واحدة", dual: "نقطتان", dualGen: "نقطتين", plural: "نقاط", acc: "نقطة", sing: "نقطة", fem: true },
};

/** "N … to your next reward" as an Arabic reader should read it. */
function toNextAr(unit: StampUnit, n: number): string {
  const a = AR[unit];
  const verb = a.fem ? "بقيت" : "بقي";
  const tail = " لمكافأتك التالية.";
  if (n === 0) return "لم يبقَ شيء" + tail;
  if (n === 1) return `${verb} ${a.one}${tail}`;
  if (n === 2) return `${verb} ${a.dual}${tail}`;
  if (n % 100 >= 3 && n % 100 <= 10) return `بقيت ${n} ${a.plural}${tail}`;
  if (n % 100 >= 11) return `${verb} ${n} ${a.acc}${tail}`;
  return `${verb} ${n} ${a.sing}${tail}`;
}

/** "3 of N …", the noun after من. */
function stampsOfAr(unit: StampUnit, filled: number, n: number): string {
  const a = AR[unit];
  if (n === 1) return `${filled} من ${a.one}`;
  if (n === 2) return `${filled} من ${a.dualGen}`;
  if (n % 100 >= 3 && n % 100 <= 10) return `${filled} من ${n} ${a.plural}`;
  if (n % 100 >= 11) return `${filled} من ${n} ${a.acc}`;
  return `${filled} من ${n} ${a.sing}`;
}

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

describe("what is left to the next reward", () => {
  it("says it in English", () => {
    expect(toNextReward(t, "order", 1)).toBe("1 more order to your next reward.");
    expect(toNextReward(t, "order", 4)).toBe("4 more orders to your next reward.");
    expect(toNextReward(t, "item", 1)).toBe("1 more item to your next reward.");
    expect(toNextReward(t, "stamp", 2)).toBe("2 more stamps to your next reward.");
    expect(toNextReward(t, "points", 1500)).toBe("1,500 more points to your next reward.");
  });

  for (const unit of UNITS) {
    it(`says it in Arabic for ${unit}, at every count`, async () => {
      await i18n.changeLanguage("ar");
      for (const n of COUNTS) expect(toNextReward(t, unit, n), `${unit} × ${n}`).toBe(toNextAr(unit, n));
    });
  }

  it("reads as the owner wrote it", async () => {
    await i18n.changeLanguage("ar");
    expect(toNextReward(t, "order", 1)).toBe("بقي طلب واحد لمكافأتك التالية.");
    expect(toNextReward(t, "order", 2)).toBe("بقي طلبان لمكافأتك التالية.");
    expect(toNextReward(t, "order", 3)).toBe("بقيت 3 طلبات لمكافأتك التالية.");
    expect(toNextReward(t, "item", 12)).toBe("بقي 12 صنفًا لمكافأتك التالية.");
    expect(toNextReward(t, "stamp", 20)).toBe("بقي 20 ختمًا لمكافأتك التالية.");
    expect(toNextReward(t, "points", 2)).toBe("بقيت نقطتان لمكافأتك التالية.");
  });
});

describe("where a card stands (the stamp row's label)", () => {
  it("says it in English", () => {
    expect(stampsOf(t, "order", 3, 6)).toBe("3 of 6 orders");
    expect(stampsOf(t, "item", 0, 1)).toBe("0 of 1 item");
  });

  for (const unit of UNITS) {
    it(`says it in Arabic for ${unit}, at every card size`, async () => {
      await i18n.changeLanguage("ar");
      for (const n of COUNTS.filter((c) => c > 0)) expect(stampsOf(t, unit, 1, n), `${unit} of ${n}`).toBe(stampsOfAr(unit, 1, n));
    });
  }
});

describe("a reward's price (the rewards list)", () => {
  // `Trans` turns <n>…</n> into the mono figure; here the tags are what is checked.
  const cost = (unit: StampUnit, n: number) => String(t(`loyalty.cost.${unit}`, { count: n, n: String(n) }));

  it("says it in English", () => {
    expect(cost("order", 1)).toBe("<n>1</n> order");
    expect(cost("item", 12)).toBe("<n>12</n> items");
  });

  for (const unit of UNITS) {
    it(`says it in Arabic for ${unit}: one and two in words, the rest with the figure`, async () => {
      await i18n.changeLanguage("ar");
      const a = AR[unit];
      expect(cost(unit, 1)).toBe(a.one);
      expect(cost(unit, 2)).toBe(a.dual);
      for (const n of [3, 10]) expect(cost(unit, n)).toBe(`<n>${n}</n> ${a.plural}`);
      for (const n of [11, 12]) expect(cost(unit, n)).toBe(`<n>${n}</n> ${a.acc}`);
      for (const n of [100, 101, 102]) expect(cost(unit, n)).toBe(`<n>${n}</n> ${a.sing}`);
    });
  }
});

describe("the programme's rule (collect N for a reward)", () => {
  const rule = (key: string, n: number) => String(t(key, { count: n, n: String(n), amount: "EGP 10.00" }));
  /** What is collected: stamps on every stamp card, points on a points one (accusative, after اجمع). */
  const collected = (points: boolean, n: number) => {
    const [one, two, plural, acc, sing] = points
      ? ["نقطة واحدة", "نقطتين", "نقاط", "نقطة", "نقطة"]
      : ["ختمًا واحدًا", "ختمين", "أختام", "ختمًا", "ختم"];
    if (n === 1) return one;
    if (n === 2) return two;
    if (n % 100 >= 3 && n % 100 <= 10) return `${n} ${plural}`;
    if (n % 100 >= 11) return `${n} ${acc}`;
    return `${n} ${sing}`;
  };

  for (const [key, opening, points] of [
    ["loyalty.ruleStamps", "ختم لكل طلب.", false],
    ["loyalty.ruleItems", "ختم لكل صنف تشتريه.", false],
    ["loyalty.ruleCounter", "تُختم بطاقتك عند الكاشير.", false],
    ["loyalty.rulePoints", "نقطة عن كل EGP 10.00 تنفقها.", true],
  ] as const) {
    it(`${key} counts what is collected in Arabic grammar`, async () => {
      await i18n.changeLanguage("ar");
      for (const n of COUNTS.filter((c) => c > 0)) {
        expect(rule(key, n), `${key} × ${n}`).toBe(`${opening} اجمع ${collected(points, n)} لتحصل على مكافأة.`);
      }
    });
  }

  it("keeps the English short", () => {
    expect(rule("loyalty.ruleStamps", 6)).toBe("A stamp for every order. Collect 6 for a reward.");
    expect(rule("loyalty.rulePoints", 1)).toBe("A point for every EGP 10.00 you spend. Collect 1 for a reward.");
  });
});
