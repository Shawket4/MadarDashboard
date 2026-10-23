import { describe, expect, it } from "vitest";

import { detailsReady, joinPayload, ruleKind } from "./join-form";

const ready = { name: "Salma", phone: "201001234567", birthday: { month: null, day: null } };

describe("detailsReady", () => {
  it("needs a name and a whole phone; the birthday is optional", () => {
    expect(detailsReady(ready)).toBe(true);
    expect(detailsReady({ ...ready, name: "   " })).toBe(false);
    expect(detailsReady({ ...ready, phone: null })).toBe(false);
    expect(detailsReady({ ...ready, name: "x".repeat(81) })).toBe(false);
  });

  it("takes a birthday only as a real pair", () => {
    expect(detailsReady({ ...ready, birthday: { month: 3, day: 17 } })).toBe(true);
    expect(detailsReady({ ...ready, birthday: { month: 2, day: 29 } })).toBe(true);
    expect(detailsReady({ ...ready, birthday: { month: 3, day: null } })).toBe(false);
    expect(detailsReady({ ...ready, birthday: { month: null, day: 17 } })).toBe(false);
    expect(detailsReady({ ...ready, birthday: { month: 2, day: 30 } })).toBe(false);
  });
});

describe("joinPayload", () => {
  const base = {
    info: { birthday_enabled: true },
    details: { ...ready, name: "  Salma Adel ", birthday: { month: 3, day: 17, year: 1990 } },
    phone: "201001234567",
    deviceToken: null,
    locale: "ar" as const,
  };

  it("names the branch for a counter code, and the shop for an org-wide one", () => {
    expect(joinPayload({ ...base, branchId: "b1", orgId: "o1" })).toMatchObject({ branch_id: "b1", org_id: undefined });
    expect(joinPayload({ ...base, orgId: "o1" })).toMatchObject({ branch_id: undefined, org_id: "o1" });
  });

  it("sends the name trimmed, the canonical phone, the language and the proof", () => {
    expect(joinPayload({ ...base, branchId: "b1", deviceToken: "dt" })).toEqual({
      branch_id: "b1",
      org_id: undefined,
      name: "Salma Adel",
      phone: "201001234567",
      device_token: "dt",
      locale: "ar",
      birth_month: 3,
      birth_day: 17,
    });
  });

  it("never sends a year: the programme stores a month and a day", () => {
    expect(Object.keys(joinPayload({ ...base, branchId: "b1" }))).not.toContain("birth_year");
  });

  it("drops the birthday where the shop asked for none, or where it is half given", () => {
    const off = joinPayload({ ...base, branchId: "b1", info: { birthday_enabled: false } });
    expect(off.birth_month).toBeUndefined();
    expect(off.birth_day).toBeUndefined();
    const half = joinPayload({ ...base, branchId: "b1", details: { ...base.details, birthday: { month: 3, day: null } } });
    expect(half.birth_month).toBeUndefined();
    expect(half.birth_day).toBeUndefined();
  });
});

describe("ruleKind", () => {
  it("prints only figures the shop configured", () => {
    expect(ruleKind({ mode: "visits", next_reward_cost: 6, earn_piastres_per_point: 0 })).toBe("stampsWithTarget");
    expect(ruleKind({ mode: "visits", next_reward_cost: 0, earn_piastres_per_point: 0 })).toBe("stamps");
    expect(ruleKind({ mode: "points", next_reward_cost: 100, earn_piastres_per_point: 1000 })).toBe("pointsWithTarget");
    expect(ruleKind({ mode: "points", next_reward_cost: 0, earn_piastres_per_point: 1000 })).toBe("pointsRate");
    expect(ruleKind({ mode: "points", next_reward_cost: 100, earn_piastres_per_point: 0 })).toBe("points");
  });
});
