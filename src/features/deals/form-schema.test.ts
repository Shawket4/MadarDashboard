/**
 * The deal form's shape rules (§2.3, the server's own limits: n_for_price N
 * 2–20 with a price; buy_get buy 1–20, get 1–20, percent 1–100), the
 * wire mappings (piastres, AR name, `reward_pool: []` = same as the pool,
 * blank cap = null) and the branch tri-state → PUT/DELETE diff.
 */
import { describe, expect, it } from "vitest";

import { E, emptyWindow } from "@/features/combos/form-schema";
import type { DealRule } from "@/features/combos/types";

import { DE, EMPTY_DEAL, branchChanges, dealFromWire, dealSchema, dealToWire, emptyEntry, type DealFormValues } from "./form-schema";

const bites = "cat-bites";
const coffee = "item-coffee";
const cookie = "item-cookie";

function nFor(over: Partial<DealFormValues> = {}): DealFormValues {
  return {
    ...EMPTY_DEAL,
    name: "Any 2 bites for 90",
    qty: "2",
    price: "90",
    pool: [{ ...emptyEntry("category"), category_id: bites }],
    ...over,
  };
}

function buyGet(over: Partial<DealFormValues> = {}): DealFormValues {
  return {
    ...EMPTY_DEAL,
    name: "Buy 2 coffees, get a cookie",
    kind: "buy_get",
    qty: "2",
    get_qty: "1",
    get_percent: "100",
    pool: [{ ...emptyEntry("item"), menu_item_id: coffee }],
    ...over,
  };
}

/** Every issue as "path: message". */
function issues(v: DealFormValues): string[] {
  const r = dealSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("dealSchema — N for a price", () => {
  it("accepts a valid deal", () => {
    expect(issues(nFor())).toEqual([]);
  });

  it.each(["1", "21", "0", "2.5", "", "abc"])("refuses N = %j", (qty) => {
    expect(issues(nFor({ qty }))).toEqual([`qty: ${DE.qtyN}`]);
  });

  it.each(["2", "20"])("accepts N = %s at the edges", (qty) => {
    expect(issues(nFor({ qty }))).toEqual([]);
  });

  it("needs a price of 0 or more", () => {
    expect(issues(nFor({ price: "" }))).toEqual([`price: ${DE.price}`]);
    expect(issues(nFor({ price: "-1" }))).toEqual([`price: ${DE.price}`]);
    expect(issues(nFor({ price: "abc" }))).toEqual([`price: ${DE.price}`]);
    expect(issues(nFor({ price: "0" }))).toEqual([]);
  });

  it("ignores the buy-get fields", () => {
    expect(issues(nFor({ get_qty: "0", get_percent: "500" }))).toEqual([]);
  });
});

describe("dealSchema — buy X get Y", () => {
  it("accepts a valid deal, with no price", () => {
    expect(issues(buyGet({ price: "" }))).toEqual([]);
  });

  it("allows buy 1 (N for price may not)", () => {
    expect(issues(buyGet({ qty: "1" }))).toEqual([]);
  });

  it.each(["0", "21", ""])("refuses buy = %j", (qty) => {
    expect(issues(buyGet({ qty }))).toEqual([`qty: ${DE.qtyBuy}`]);
  });

  it.each(["0", "21", "1.5"])("refuses get = %j", (get_qty) => {
    expect(issues(buyGet({ get_qty }))).toEqual([`get_qty: ${DE.getQty}`]);
  });

  it.each(["0", "101", ""])("refuses percent = %j", (get_percent) => {
    expect(issues(buyGet({ get_percent }))).toEqual([`get_percent: ${DE.percent}`]);
  });

  it.each(["1", "50", "100"])("accepts percent = %s", (get_percent) => {
    expect(issues(buyGet({ get_percent }))).toEqual([]);
  });

  it("checks the reward list only when it is switched on", () => {
    expect(issues(buyGet({ use_reward_pool: false, reward_pool: [] }))).toEqual([]);
    expect(issues(buyGet({ use_reward_pool: true, reward_pool: [] }))).toEqual([`reward_pool: ${DE.rewardEmpty}`]);
    expect(issues(buyGet({ use_reward_pool: true, reward_pool: [emptyEntry("item")] }))).toEqual([`reward_pool.0.target: ${DE.poolTarget}`]);
    expect(issues(buyGet({ use_reward_pool: true, reward_pool: [{ ...emptyEntry("item"), menu_item_id: cookie }] }))).toEqual([]);
  });

  it("an N-for-price deal ignores a leftover reward list", () => {
    expect(issues(nFor({ use_reward_pool: true, reward_pool: [] }))).toEqual([]);
  });
});

describe("dealSchema — shared rules", () => {
  it("needs a name", () => {
    expect(issues(nFor({ name: "  " }))).toEqual([`name: ${DE.required}`]);
  });

  it("refuses an empty pool", () => {
    expect(issues(nFor({ pool: [] }))).toEqual([`pool: ${DE.poolEmpty}`]);
  });

  it("refuses a pool entry without a target, on that entry", () => {
    const pool = [{ ...emptyEntry("category"), category_id: bites }, emptyEntry("item"), emptyEntry("category")];
    expect(issues(nFor({ pool }))).toEqual([`pool.1.target: ${DE.poolTarget}`, `pool.2.target: ${DE.poolTarget}`]);
  });

  it("reads the target the entry says, not a leftover id of the other kind", () => {
    // Switched from item to category without choosing one: the stale item id doesn't count.
    const pool = [{ ...emptyEntry("category"), menu_item_id: coffee }];
    expect(issues(nFor({ pool }))).toEqual([`pool.0.target: ${DE.poolTarget}`]);
  });

  it("the cap per order is blank or a whole number of 1 or more", () => {
    expect(issues(nFor({ max_per_order: "" }))).toEqual([]);
    expect(issues(nFor({ max_per_order: "3" }))).toEqual([]);
    expect(issues(nFor({ max_per_order: "0" }))).toEqual([`max_per_order: ${DE.maxPerOrder}`]);
    expect(issues(nFor({ max_per_order: "1.5" }))).toEqual([`max_per_order: ${DE.maxPerOrder}`]);
  });

  it("applies the combo editor's window rules", () => {
    const ok = { ...emptyWindow(), starts_at: "08:00", ends_at: "11:00" };
    expect(issues(nFor({ windows: [ok] }))).toEqual([]);
    expect(issues(nFor({ windows: [{ ...ok, weekdays: 0 }] }))).toEqual([`windows.0.weekdays: ${E.noDays}`]);
    expect(issues(nFor({ windows: [{ ...ok, ends_at: "" }] }))).toEqual([`windows.0.ends_at: ${E.hoursPair}`]);
    expect(issues(nFor({ windows: [{ ...ok, ends_at: "08:00" }] }))).toEqual([`windows.0.ends_at: ${E.hoursSame}`]);
    expect(issues(nFor({ windows: [{ ...ok, valid_from: "2026-10-02", valid_to: "2026-10-01" }] }))).toEqual([`windows.0.valid_to: ${E.datesOrder}`]);
  });
});

describe("dealToWire", () => {
  it("writes an N-for-price deal in piastres, with nulls for the buy-get fields", () => {
    const body = dealToWire(nFor({ name: "  Any 2 bites for 90 ", name_ar: " أي قطعتين بـ٩٠ ", price: "90.5" }), 3);
    expect(body).toEqual({
      name: "Any 2 bites for 90",
      name_translations: { ar: "أي قطعتين بـ٩٠" },
      kind: "n_for_price",
      qty: 2,
      price: 9050,
      get_qty: null,
      get_percent: null,
      max_per_order: null,
      sort: 3,
      is_active: true,
      pool: [{ menu_item_id: null, category_id: bites, size_label: null }],
      reward_pool: [],
      windows: [],
    });
  });

  it("writes no translations when the Arabic name is blank", () => {
    expect(dealToWire(nFor({ name_ar: "  " })).name_translations).toEqual({});
  });

  it("writes a buy-get deal with no price", () => {
    const body = dealToWire(buyGet({ qty: "2", get_qty: "1", get_percent: "50", max_per_order: "2", price: "90" }));
    expect(body).toMatchObject({ kind: "buy_get", qty: 2, price: null, get_qty: 1, get_percent: 50, max_per_order: 2 });
  });

  it("sends reward_pool [] (= the same pool) unless a separate list is switched on for buy-get", () => {
    const reward = [{ ...emptyEntry("item"), menu_item_id: cookie, size_label: "large" }];
    expect(dealToWire(buyGet({ use_reward_pool: false, reward_pool: reward })).reward_pool).toEqual([]);
    expect(dealToWire(nFor({ use_reward_pool: true, reward_pool: reward })).reward_pool).toEqual([]);
    expect(dealToWire(buyGet({ use_reward_pool: true, reward_pool: reward })).reward_pool).toEqual([
      { menu_item_id: cookie, category_id: null, size_label: "large" },
    ]);
  });

  it("writes only the id the entry's target names", () => {
    const pool = [
      { ...emptyEntry("item"), menu_item_id: coffee, category_id: bites },
      { ...emptyEntry("category"), menu_item_id: coffee, category_id: bites, size_label: "small" },
    ];
    expect(dealToWire(nFor({ pool })).pool).toEqual([
      { menu_item_id: coffee, category_id: null, size_label: null },
      { menu_item_id: null, category_id: bites, size_label: "small" },
    ]);
  });
});

describe("dealFromWire", () => {
  const wire = (over: Partial<DealRule> = {}): DealRule => ({
    id: "d-1",
    name: "Any 2 bites for 90",
    name_translations: { ar: "أي قطعتين بـ٩٠" },
    kind: "n_for_price",
    qty: 2,
    price: 9000,
    get_qty: null,
    get_percent: null,
    max_per_order: null,
    is_active: true,
    sort: 4,
    pool: [{ menu_item_id: null, category_id: bites, size_label: null }],
    reward_pool: [],
    windows: [{ branch_id: null, weekdays: 31, starts_at: "08:00:00", ends_at: "11:00:00", valid_from: null, valid_to: null }],
    branch_overrides: [
      { branch_id: "b-1", is_active: true },
      { branch_id: "b-2", is_active: false },
    ] as DealRule["branch_overrides"],
    created_at: "",
    updated_at: "",
    ...over,
  });

  it("reads EGP text, the AR name, a blank cap and the branch exceptions", () => {
    const v = dealFromWire(wire());
    expect(v).toMatchObject({
      name: "Any 2 bites for 90",
      name_ar: "أي قطعتين بـ٩٠",
      kind: "n_for_price",
      qty: "2",
      price: "90",
      max_per_order: "",
      use_reward_pool: false,
      branches: { "b-1": "on", "b-2": "off" },
    });
    expect(v.pool).toEqual([expect.objectContaining({ target: "category", category_id: bites, menu_item_id: "", size_label: "" })]);
    expect(v.windows[0]).toMatchObject({ weekdays: 31, starts_at: "08:00", ends_at: "11:00" });
  });

  it("switches the separate reward list on only when the wire has one", () => {
    expect(dealFromWire(wire({ kind: "buy_get", price: null, get_qty: 1, get_percent: 100, reward_pool: [] })).use_reward_pool).toBe(false);
    const v = dealFromWire(wire({ kind: "buy_get", price: null, get_qty: 1, get_percent: 100, reward_pool: [{ menu_item_id: cookie, category_id: null, size_label: null }] }));
    expect(v.use_reward_pool).toBe(true);
    expect(v.reward_pool).toEqual([expect.objectContaining({ target: "item", menu_item_id: cookie })]);
  });

  it("round-trips through the form unchanged", () => {
    for (const d of [
      wire({ max_per_order: 2 }),
      wire({ kind: "buy_get", price: null, get_qty: 1, get_percent: 50, reward_pool: [{ menu_item_id: cookie, category_id: null, size_label: "large" }] }),
      wire({ kind: "buy_get", price: null, get_qty: 2, get_percent: 100, reward_pool: [], name_translations: {} }),
    ]) {
      const v = dealFromWire(d);
      expect(dealSchema.safeParse(v).success).toBe(true);
      expect(dealToWire(v, d.sort)).toEqual({
        name: d.name,
        name_translations: d.name_translations,
        kind: d.kind,
        qty: d.qty,
        price: d.price,
        get_qty: d.get_qty,
        get_percent: d.get_percent,
        max_per_order: d.max_per_order,
        sort: d.sort,
        is_active: d.is_active,
        pool: d.pool,
        reward_pool: d.reward_pool,
        windows: [{ branch_id: null, weekdays: 31, starts_at: "08:00", ends_at: "11:00", valid_from: null, valid_to: null }],
      });
    }
  });
});

describe("branchChanges", () => {
  it("sends nothing when nothing changed", () => {
    expect(branchChanges({ a: "on" }, { a: "on", b: "inherit" })).toEqual({ put: [], clear: [] });
  });

  it("PUTs a branch newly set on or off, and one flipped between them", () => {
    expect(branchChanges({ a: "on" }, { a: "off", b: "on", c: "off" })).toEqual({
      put: [
        { branch_id: "a", is_active: false },
        { branch_id: "b", is_active: true },
        { branch_id: "c", is_active: false },
      ],
      clear: [],
    });
  });

  it("DELETEs a branch that had an exception and now follows the deal", () => {
    expect(branchChanges({ a: "on", b: "off" }, { a: "inherit" })).toEqual({ put: [], clear: ["a", "b"] });
  });
});
