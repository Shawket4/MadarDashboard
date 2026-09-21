/**
 * The staff drinks pool for the dev preview (VITE_MOCK=1).
 *
 * The seed is chosen to put every kind of row the report has to read on one
 * screen, because each is a separate way to get the money wrong:
 *
 *  1. a plain free drink — smallest size, default picks: comp, no extras;
 *  2. a drink that paid for something — bigger size + an extra shot;
 *  3. a drink an OFFLINE till priced differently than the server
 *     (`comp_minor_reported` ≠ `comp_minor`);
 *  4. a drink rung by an OLD till (POS ≤ v0.7.12): no sale line behind it, so
 *     `comp_minor` / `extras_minor` are null — "unknown", never 0. It is also
 *     the one past the allowance, found on the server's recount.
 *
 * The summary is COMPUTED from these rows with the server's own definitions
 * (contract §3), so the strip and the table under it can never disagree here
 * any more than they can in production. Money is in piastres.
 */
import type { OrderFull } from "@/data/api/generated/models/orderFull";
import type { StaffDrink } from "@/data/api/generated/models/staffDrink";
import type { StaffDrinksSummary } from "@/data/api/generated/models/staffDrinksSummary";
import type { StaffPoolSettings } from "@/data/api/generated/models/staffPoolSettings";
import type { StaffPoolToday } from "@/data/api/generated/models/staffPoolToday";

import { MOCK_ORG_ID } from "./data";

const BRANCH = "br_zamalek";
const ELIGIBLE = ["mi_latte", "mi_cappuccino", "mi_americano"];
const ALLOWANCE = 3;

export const MOCK_STAFF_ORDER_ID = "ord_staff_1";

export const MOCK_STAFF_POOL_SETTINGS: StaffPoolSettings = {
  org_id: MOCK_ORG_ID,
  branch_id: null,
  enabled: true,
  daily_allowance: ALLOWANCE,
  eligible_item_ids: ELIGIBLE,
};

const today = () => new Date().toISOString().slice(0, 10);

interface DrinkSeed {
  id: string;
  order_id: string | null;
  menu_item_id: string;
  item_name: string;
  size_label: string | null;
  note: string;
  hour: number;
  cost_minor: number | null;
  comp_minor: number | null;
  extras_minor: number | null;
  comp_minor_reported: number | null;
  overspent?: boolean;
  overspent_on_replay?: boolean;
}

const DRINK_SEEDS: DrinkSeed[] = [
  {
    id: "sd_1", order_id: "ord_staff_0", menu_item_id: "mi_americano", item_name: "Americano", size_label: "Small",
    note: "Mona, opening shift", hour: 6, cost_minor: 900,
    comp_minor: 4_500, extras_minor: 0, comp_minor_reported: null,
  },
  {
    id: "sd_2", order_id: MOCK_STAFF_ORDER_ID, menu_item_id: "mi_latte", item_name: "Latte", size_label: "Large",
    note: "Karim — double shift today", hour: 9, cost_minor: 2_150,
    comp_minor: 8_000, extras_minor: 4_000, comp_minor_reported: null,
  },
  {
    id: "sd_3", order_id: "ord_staff_2", menu_item_id: "mi_cappuccino", item_name: "Cappuccino", size_label: "Small",
    note: "the electrician, waiting on the fridge", hour: 12, cost_minor: 1_300,
    // The tablet was offline and still had last week's price for the size.
    comp_minor: 5_500, extras_minor: 0, comp_minor_reported: 6_000,
  },
  {
    id: "sd_4", order_id: null, menu_item_id: "mi_latte", item_name: "Latte", size_label: null,
    note: "Youssef, closing", hour: 15, cost_minor: 1_700,
    comp_minor: null, extras_minor: null, comp_minor_reported: null,
    overspent: true, overspent_on_replay: true,
  },
];

export function mockStaffDrinks(to: string | null, overspentOnly = false): StaffDrink[] {
  const day = to ?? today();
  const rows = DRINK_SEEDS.map(
    (s, i): StaffDrink => ({
      id: s.id,
      branch_id: BRANCH,
      order_id: s.order_id,
      menu_item_id: s.menu_item_id,
      item_name: s.item_name,
      size_label: s.size_label,
      quantity: 1,
      note: s.note,
      business_date: day,
      allowance_at_record: ALLOWANCE,
      used_before: i,
      overspent: s.overspent ?? false,
      overspent_on_replay: s.overspent_on_replay ?? false,
      cost_minor: s.cost_minor,
      comp_minor: s.comp_minor,
      extras_minor: s.extras_minor,
      comp_minor_reported: s.comp_minor_reported,
      recorded_by: "tel_mona",
      recorded_at: `${day}T${String(s.hour).padStart(2, "0")}:12:00Z`,
    }),
  );
  // Newest first, as the endpoint answers.
  return rows.filter((d) => !overspentOnly || d.overspent).reverse();
}

export function mockStaffDrinksSummary(to: string | null, overspentOnly = false): StaffDrinksSummary {
  const rows = mockStaffDrinks(to, overspentOnly);
  const sum = (pick: (d: StaffDrink) => number | null | undefined) => rows.reduce((s, d) => s + (pick(d) ?? 0), 0);
  return {
    drinks: rows.length,
    quantity: sum((d) => d.quantity),
    overspent: rows.filter((d) => d.overspent).length,
    comp_minor: sum((d) => d.comp_minor),
    extras_minor: sum((d) => d.extras_minor),
    cost_minor: sum((d) => d.cost_minor),
    comp_mismatches: rows.filter(
      (d) => d.comp_minor != null && d.comp_minor_reported != null && d.comp_minor_reported !== d.comp_minor,
    ).length,
    unpriced: rows.filter((d) => d.comp_minor == null).length,
  };
}

export function mockStaffPoolToday(branchId: string | null, businessDate: string | null): StaffPoolToday {
  const used = DRINK_SEEDS.length;
  return {
    branch_id: branchId ?? BRANCH,
    business_date: businessDate ?? today(),
    enabled: true,
    allowance: ALLOWANCE,
    used,
    remaining: Math.max(0, ALLOWANCE - used),
    over: Math.max(0, used - ALLOWANCE),
    eligible_item_ids: ELIGIBLE,
  };
}

/**
 * The sale behind `sd_2`, stored the way the server stores it: NET of the comp.
 *
 * Large latte 85.00 (small is 60.00 → the size pays 25.00); the required milk
 * pick is the default (20.00, free); an extra shot (15.00) is never free.
 *   normal 120.00 − comp 80.00 = charged 40.00, plus a croissant at 45.00.
 *   subtotal 85.00, tax 14% on the charged part only = 11.90, total 96.90.
 */
export const MOCK_STAFF_ORDER = {
  id: MOCK_STAFF_ORDER_ID,
  branch_id: BRANCH,
  teller_id: "tel_karim",
  teller_name: "Karim Saleh",
  order_number: 43,
  order_ref: "ZM-260616-0043",
  status: "completed",
  payment_method: "cash",
  payment_legs: [{ method: "cash", amount: 9_690, is_cash: true }],
  payments: [],
  order_type: "dine_in",
  delivery_fee: 0,
  subtotal: 8_500,
  discount_amount: 0,
  tax_amount: 1_190,
  total_amount: 9_690,
  created_at: new Date().toISOString(),
  items: [
    {
      id: "oi_staff_latte",
      order_id: MOCK_STAFF_ORDER_ID,
      menu_item_id: "mi_latte",
      item_name: "Latte",
      name_translations: { ar: "لاتيه" },
      size_label: "Large",
      quantity: 1,
      unit_price: 8_500,
      line_total: 2_500,
      line_cost: 2_150,
      staff_comp_minor: 8_000,
      staff_drink_id: "sd_2",
      addons: [
        {
          id: "oia_milk", order_item_id: "oi_staff_latte", addon_item_id: "ad_whole_milk",
          addon_name: "Whole milk", name_translations: { ar: "لبن كامل الدسم" },
          quantity: 1, unit_price: 2_000, line_total: 0, staff_comp_minor: 2_000,
        },
        {
          id: "oia_shot", order_item_id: "oi_staff_latte", addon_item_id: "ad_extra_shot",
          addon_name: "Extra shot", name_translations: { ar: "شوت إضافي" },
          quantity: 1, unit_price: 1_500, line_total: 1_500, staff_comp_minor: 0,
        },
      ],
      optionals: [],
      deductions_snapshot: [],
    },
    {
      id: "oi_croissant",
      order_id: MOCK_STAFF_ORDER_ID,
      menu_item_id: "mi_croissant",
      item_name: "Croissant",
      name_translations: { ar: "كرواسون" },
      size_label: null,
      quantity: 1,
      unit_price: 4_500,
      line_total: 4_500,
      line_cost: 1_400,
      staff_comp_minor: 0,
      staff_drink_id: null,
      addons: [],
      optionals: [],
      deductions_snapshot: [],
    },
  ],
} as unknown as OrderFull;

/**
 * The sale behind any seeded drink. `sd_2` has the hand-built order above; the
 * others are a single, fully free line (what came off equals what it rings at),
 * so every "View order" link on the report opens something true.
 */
export function mockStaffOrder(orderId: string): OrderFull | null {
  if (orderId === MOCK_STAFF_ORDER_ID) return MOCK_STAFF_ORDER;
  const seed = DRINK_SEEDS.find((s) => s.order_id === orderId);
  if (!seed || seed.comp_minor == null) return null;
  // Replayed: the TILL's figure is what came off the stored money.
  const applied = seed.comp_minor_reported ?? seed.comp_minor;
  return {
    ...MOCK_STAFF_ORDER,
    id: orderId,
    order_ref: `ZM-STAFF-${seed.id.toUpperCase()}`,
    payment_legs: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    items: [
      {
        id: `oi_${seed.id}`,
        order_id: orderId,
        menu_item_id: seed.menu_item_id,
        item_name: seed.item_name,
        name_translations: {},
        size_label: seed.size_label,
        quantity: 1,
        unit_price: applied,
        line_total: 0,
        line_cost: seed.cost_minor,
        staff_comp_minor: applied,
        staff_drink_id: seed.id,
        addons: [],
        optionals: [],
        deductions_snapshot: [],
      },
    ],
  } as unknown as OrderFull;
}
