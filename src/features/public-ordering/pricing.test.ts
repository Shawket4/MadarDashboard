/**
 * The storefront's price estimates against madar-shared's vectors (src/lib,
 * pinned to their tag by shared_vectors.test.ts): the cases the server's Rust
 * is tested against. Where a case asks for something the public menu cannot
 * express, it is skipped with the reason.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { DeliveryAddonOption } from "@/data/api/generated/models/deliveryAddonOption";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryOptionPricing } from "@/data/api/generated/models/deliveryOptionPricing";
import type { PublicCombo } from "@/data/api/generated/models/publicCombo";
import type { PublicComboChoice } from "@/data/api/generated/models/publicComboChoice";
import catalog from "@/lib/catalog_vectors.json";
import combos from "@/lib/combo_vectors.json";

import { buildPicks, firstUnmetSlot, type ComboSelection } from "./combo";
import { type CatalogView, channelPrices, type ItemView, optionCharge, priceOptions, storefrontView, unitPrice } from "./pricing";
import { calcDiscount, itemBasePrice, lineTotal, lineUnitPrice } from "./utils";

/* ── madar-catalog price_line: catalog_vectors.json ── */

interface PricedLine {
  unit_price: number;
  options: { id: string; quantity: number; unit_price: number }[];
  optionals: { id: string; price: number }[];
  option_total: number;
  optional_total: number;
}

const viewOf = (key: string): CatalogView => ({
  item: catalog.items.find((i) => i.key === key)!.view,
  options: catalog.options,
});

// The money of a priced line; the ingredient fields are the server's stock deduction.
const money = (l: PricedLine): PricedLine => ({
  unit_price: l.unit_price,
  options: l.options.map(({ id, quantity, unit_price }) => ({ id, quantity, unit_price })),
  optionals: l.optionals,
  option_total: l.option_total,
  optional_total: l.optional_total,
});

describe("a line is priced as madar-catalog's vectors say", () => {
  it.each(catalog.cases)("$name", (c) => {
    const view = viewOf(c.item);
    const unit = unitPrice(view.item, c.selection.size_label);
    const priced = priceOptions(view, c.selection);
    const got =
      unit == null
        ? { error: { error: "no_priced_size" } }
        : "error" in priced
          ? { error: priced }
          : { line: money({ unit_price: unit, ...priced }) };
    const expected = c.expected as { line?: PricedLine; error?: unknown };
    expect(got).toEqual(expected.line ? { line: money(expected.line) } : expected);
  });
});

/** An item as the public menu lists it: its active sizes at the branch's price; its price the branch's, else the lowest active size's. */
const menuItem = (v: ItemView): DeliveryMenuItem => {
  const active = v.sizes.filter((s) => s.is_active && s.price != null);
  return {
    id: v.id,
    price: v.branch_price ?? Math.min(...active.map((s) => s.price!)),
    sizes: active.map((s) => ({ label: s.label, price: s.branch_price ?? s.price! })),
  } as DeliveryMenuItem;
};

describe("the menu's prices give the server's unit price (and 'from' price)", () => {
  for (const c of catalog.cases) {
    const item = viewOf(c.item).item;
    const size = c.selection.size_label;
    const why = !("line" in c.expected)
      ? "a refused line (no active size, or an option off the menu): only the server refuses it"
      : item.sizes.some((s) => s.label === size && !s.is_active && s.branch_price != null)
        ? "a size only the branch prices: the menu never offers it"
        : null;
    (why ? it.skip : it)(why ? `${c.name} — ${why}` : c.name, () => {
      expect(itemBasePrice(menuItem(item), size)).toBe((c.expected as { line: PricedLine }).line.unit_price);
    });
  }
});

describe("what the public menu can say of an item's swaps", () => {
  const addon = (id: string, type: string, price: number): DeliveryAddonOption => ({
    addon_item_id: id,
    type,
    price,
    name: id,
    name_translations: {},
    is_available: true,
  });
  const addons = [
    addon("whole", "milk_type", 100),
    addon("oat", "milk_type", 800),
    addon("skim", "milk_type", 50),
    addon("decaf", "coffee_type", 500),
    addon("colombian", "coffee_type", 200),
    addon("shot", "extra", 150),
  ];
  const latte = { ...menuItem(viewOf("latte").item), default_milk_addon_id: "whole", optionals: [] } as DeliveryMenuItem;
  const price = (...options: { id: string; quantity?: number }[]) =>
    priceOptions(storefrontView(latte, addons, "Small"), { size_label: "Small", options });

  it("the recipe's milk is free, another milk costs its difference over it, floored at 0", () => {
    expect(price({ id: "whole" })).toMatchObject({ option_total: 0 });
    expect(price({ id: "oat" })).toMatchObject({ option_total: 700 });
    expect(price({ id: "skim" })).toMatchObject({ option_total: 0 });
  });

  it("keeps one of each swap family — the last pick, once — and charges add-ons per unit", () => {
    expect(price({ id: "decaf", quantity: 2 }, { id: "colombian" }, { id: "shot", quantity: 2 })).toMatchObject({
      options: [
        { id: "colombian", quantity: 1, unit_price: 200 },
        { id: "shot", quantity: 2, unit_price: 150 },
      ],
      option_total: 500,
    });
  });
});

/* ── madar-catalog combo::quote: combo_vectors.json ── */

type ComboView = (typeof combos.combos)[keyof typeof combos.combos];
type Choice = ComboView["slots"][number]["choices"][number];
type Pick = (typeof combos.cases)[number]["picks"][number] & { category_id?: string };
const items = combos.items as Record<string, CatalogView>;

/** A choice as the public menu lists it: the server's `PublicComboChoice` (sizes at the branch's price, each with its extra). */
const publicChoice = (choice: Choice, key: string): PublicComboChoice => {
  const v = items[key].item;
  const own = v.sizes.flatMap((s) => (s.is_active && s.price != null ? [{ label: s.label, price: s.branch_price ?? s.price }] : []));
  const included = choice.included_size_label ?? own.reduce((a, b) => (b.price < a.price ? b : a)).label;
  const base = own.find((s) => s.label === included)!.price;
  return {
    menu_item_id: v.id,
    name: v.id,
    name_translations: {},
    base_price: base,
    included_size_label: included,
    surcharge: choice.surcharge,
    sizes: own.map((s) => ({
      label: s.label,
      price: s.price,
      extra:
        s.label === included
          ? 0
          : (choice.size_surcharges.find((z) => z.size_label === s.label)?.surcharge ?? Math.max(s.price - base, 0)),
    })),
  };
};

/** The combo with, in each slot, the choice each pick is admitted by (its own item first, else its category). */
const publicCombo = (combo: ComboView, picks: Pick[]): PublicCombo => ({
  is_fixed: false,
  slots: combo.slots.map((s) => ({
    ...s,
    name_translations: {},
    choices: picks
      .filter((p) => p.slot_id === s.id)
      .flatMap((p) => {
        const id = items[p.item].item.id;
        const choice =
          s.choices.find((c) => c.menu_item_id === id) ??
          s.choices.find((c) => c.menu_item_id == null && c.category_id === p.category_id);
        return choice ? [publicChoice(choice, p.item)] : [];
      }),
  })),
});

const selectionOf = (combo: PublicCombo, picks: Pick[]): ComboSelection => {
  const sel: ComboSelection = {};
  for (const p of picks) {
    const choice = combo.slots.find((s) => s.id === p.slot_id)!.choices.find((c) => c.menu_item_id === items[p.item].item.id)!;
    (sel[p.slot_id] ??= {})[choice.menu_item_id] = { qty: p.quantity, size: p.selection.size_label ?? choice.included_size_label };
  }
  return sel;
};

const comboSkip = (c: (typeof combos.cases)[number]): string | null => {
  const refusal = (c.expected as { refusal?: { refusal: string; slot_id: string } }).refusal?.refusal;
  if (c.picks.some((p) => p.selection.options.length > 0)) return "add-ons inside a slot: the storefront sends none (v1)";
  if (new Set(c.picks.map((p) => `${p.slot_id}/${items[p.item].item.id}`)).size < c.picks.length)
    return "one item picked twice in a slot: the picker holds one entry per item";
  if (refusal === "price") return "an item with no active size: the menu still lists it, only the server refuses";
  if (refusal && refusal !== "too_few" && refusal !== "too_many") return "a pick the picker cannot build";
  return null;
};

describe("a combo's estimate is madar-catalog's quote (unit total, and the slot counts it refuses)", () => {
  for (const c of combos.cases) {
    const why = comboSkip(c);
    (why ? it.skip : it)(why ? `${c.name} — ${why}` : c.name, () => {
      const combo = combos.combos[c.combo as keyof typeof combos.combos];
      const pub = publicCombo(combo, c.picks);
      const sel = selectionOf(pub, c.picks);
      const expected = c.expected as { quote?: { unit_total: number }; refusal?: { slot_id: string } };
      if (expected.refusal) {
        expect(firstUnmetSlot(pub, sel)?.id).toBe(expected.refusal.slot_id);
        return;
      }
      const line = {
        uid: c.name,
        item: { id: combo.id, price: combo.price } as DeliveryMenuItem,
        size_label: null,
        base_price: combo.price,
        quantity: c.n,
        addons: [],
        optionals: [],
        notes: null,
        combo: { picks: buildPicks(pub, sel) },
      };
      expect(firstUnmetSlot(pub, sel)).toBeNull();
      expect(lineUnitPrice(line)).toBe(expected.quote!.unit_total);
      expect(lineTotal(line)).toBe(c.n * expected.quote!.unit_total);
    });
  }
  // availability / sell / is_fixed: which combos the menu lists, and how, is the server's to decide.
});

/* ── madar-money bill::rule_of + discount_on: bill_vectors.json ── */

interface BillVector {
  subtotal: number;
  discount: { kind: string; value: string };
  discount_amount: number;
}

// Read, not imported: a megabyte of JSON is not worth a type.
const bill = JSON.parse(readFileSync(resolve(__dirname, "../../lib/bill_vectors.json"), "utf8")) as {
  bills: BillVector[];
  open_bills: BillVector[];
};

// A stated amount is a person's figure at the till, and tenders are the till's; the storefront previews a rule.
const discountCases = [
  ...new Map(
    [...bill.bills, ...bill.open_bills]
      .filter((b) => b.discount.kind !== "stated")
      .map((b) => [`${b.subtotal} ${b.discount.kind} ${b.discount.value}`, b] as const),
  ).values(),
];

describe("the discount preview takes off what madar-money does", () => {
  it.each(discountCases)("$subtotal, $discount.kind $discount.value", (b) => {
    const discount = { dtype: b.discount.kind, value: 0, value_rate: Number(b.discount.value) } as DeliveryMenuDiscount;
    expect(calcDiscount(b.subtotal, discount)).toBe(b.discount_amount);
  });
});

// The menu's own pricing views (MadarRust: items[].pricing, option_pricing):
// a swap over the drink's own beans, as the order is charged.
describe("the menu's pricing views", () => {
  const v60 = {
    id: "v60", price: 6000, sizes: [], optionals: [], default_milk_addon_id: null,
    pricing: {
      id: "v60", branch_price: 6000, sizes: [{ label: "one_size", price: 6000, is_active: true }],
      recipe: [{ size_label: "one_size", category: "coffee_bean", ingredient_id: "eth-beans" }],
      bases: [{ ingredient_id: "eth-beans", candidates: [{ option_id: "eth", name: "Ethiopian", kind: "coffee_type", price: 2500 }] }],
      optionals: [],
    },
  } as unknown as DeliveryMenuItem;
  const addons = [
    { addon_item_id: "eth", name: "Ethiopian", type: "coffee_type", price: 2500, is_available: true },
    { addon_item_id: "decaf", name: "Decaf", type: "coffee_type", price: 3500, is_available: true },
  ] as unknown as DeliveryAddonOption[];
  const coffee = (id: string, ing: string, price: number) => ({
    id, name: id, kind: "coffee_type", price, ingredients: [{ id: ing, name: ing, unit: "g" }], sized: [],
  });
  const optionPricing = (decafChannel: number | null) => [
    { view: coffee("eth", "eth-beans", 2500), channel_price: null },
    { view: coffee("decaf", "decaf-beans", 3500), channel_price: decafChannel },
  ] as unknown as DeliveryOptionPricing[];

  it("charges a swap over the drink's own beans", () => {
    const view = storefrontView(v60, addons, null, optionPricing(null));
    expect(optionCharge(view, null, "eth")).toBe(0);
    expect(optionCharge(view, null, "decaf")).toBe(1000);
  });

  it("takes a channel's own price over the rule's", () => {
    expect(channelPrices(optionPricing(4000)).get("decaf")).toBe(4000);
    expect(channelPrices(optionPricing(null)).size).toBe(0);
  });

  it("without the views (an older server), charges a coffee in full as before", () => {
    const view = storefrontView(v60, addons, null, null);
    expect(optionCharge(view, null, "eth")).toBe(2500);
  });
});

