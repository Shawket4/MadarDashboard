/**
 * Combos, deals and the Bundles report under `dev:mock`: an in-memory store,
 * so the editor, the deals dialog and the settings pane can be driven end to
 * end without a backend (a page reload re-seeds it, like the floor store).
 *
 * The economics are a plain approximation of the server's (list value from
 * the default picks' base prices, cost at 35%); good enough to show the panel.
 */
import { http, HttpResponse } from "msw";

import type {
  BundlesReport,
  Combo,
  ComboEconomics,
  ComboSettings,
  ComboSummary,
  ComboWrite,
  DealRule,
  DealWrite,
  OrderFull,
} from "@/data/api/generated/models";

import { MOCK_MENU_ITEMS, MOCK_ORDERS_PAGE } from "./data";
import { MOCK_STAFF_ORDER } from "./staff-pool";

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const priceOf = (id: string | null | undefined) => MOCK_MENU_ITEMS.find((m) => m.id === id)?.base_price ?? 0;

let minMargin: string | null = "0.5500";
let channels = { pos: true, qr: true, online: true, delivery: true };
const branchOverrides = new Map<string, { pos?: boolean | null; qr?: boolean | null; online?: boolean | null; delivery?: boolean | null }>();

function economics(w: ComboWrite, branchId: string | null = null): ComboEconomics {
  let list = 0;
  for (const s of w.slots) {
    const id = s.default_item_id ?? s.choices.find((c) => c.menu_item_id)?.menu_item_id ?? null;
    list += priceOf(id) * Math.max(1, s.min);
  }
  const cost = Math.round(list * 0.35);
  const margin = w.price > 0 ? ((w.price - cost) / w.price).toFixed(4) : null;
  const warnings: ComboEconomics["warnings"] = [];
  if (margin !== null && minMargin !== null && Number(margin) < Number(minMargin)) {
    warnings.push({ code: "MARGIN_BELOW_MIN", vars: { margin, min: minMargin } });
  }
  if (w.price >= list) warnings.push({ code: "NO_SAVING", vars: {} });
  return {
    branch_id: branchId,
    price: w.price,
    list_default: list,
    list_min: list,
    list_max: list,
    cost_default: cost,
    cost_max: cost,
    margin_default: margin,
    margin_worst: margin,
    min_margin: minMargin,
    saving_default: list - w.price,
    warnings,
  };
}

function toCombo(w: ComboWrite, prev?: Combo): Combo {
  const id = prev?.id ?? uid("combo");
  const slots = w.slots.map((s, i) => ({
    id: s.id ?? uid("slot"),
    name: s.name,
    name_translations: s.name_translations ?? {},
    sort: s.sort ?? i,
    min: s.min,
    max: s.max,
    default_item_id: s.default_item_id ?? null,
    default_size_label: s.default_size_label ?? null,
    choices: s.choices.map((c, j) => ({
      id: c.id ?? uid("choice"),
      menu_item_id: c.menu_item_id ?? null,
      category_id: c.category_id ?? null,
      surcharge: c.surcharge ?? 0,
      included_size_label: c.included_size_label ?? null,
      size_surcharges: c.size_surcharges ?? [],
      sort: c.sort ?? j,
    })),
  }));
  return {
    id,
    kind: "combo",
    name: w.name,
    name_translations: w.name_translations ?? {},
    description: w.description ?? null,
    description_translations: w.description_translations ?? {},
    category_id: w.category_id ?? null,
    is_active: w.is_active ?? true,
    price: w.price,
    image_url: prev?.image_url ?? null,
    is_fixed: slots.every((s) => s.choices.length === 1 && !!s.choices[0].menu_item_id && s.min === s.max),
    available_now: w.is_active ?? true,
    windows: w.windows ?? [],
    slots,
    economics: economics(w),
    created_at: prev?.created_at ?? now(),
    updated_at: now(),
  };
}

const combos = new Map<string, Combo>();
const seed = toCombo({
  name: "Breakfast combo",
  name_translations: { ar: "كومبو الفطور" },
  category_id: "cat_food",
  price: 9_000,
  slots: [
    { name: "Pastry", name_translations: { ar: "مخبوزات" }, min: 1, max: 1, default_item_id: "mi_croissant", choices: [{ menu_item_id: "mi_croissant" }] },
    { name: "Coffee", name_translations: { ar: "قهوة" }, min: 1, max: 1, default_item_id: "mi_latte", choices: [{ category_id: "cat_hot" }] },
  ],
  windows: [{ branch_id: null, weekdays: 127, starts_at: "07:00", ends_at: "12:00" }],
});
combos.set(seed.id, seed);

const summaryOf = (c: Combo): ComboSummary => ({
  id: c.id,
  name: c.name,
  name_translations: c.name_translations,
  image_url: c.image_url,
  category_id: c.category_id,
  price: c.price,
  is_active: c.is_active,
  is_fixed: c.is_fixed,
  slot_count: c.slots.length,
  window_count: c.windows.length,
  available_now: c.available_now,
  margin_default: c.economics.margin_default,
  warning_count: c.economics.warnings.length,
});

const deals = new Map<string, DealRule>();
function toDeal(w: DealWrite, prev?: DealRule): DealRule {
  return {
    id: prev?.id ?? uid("deal"),
    name: w.name,
    name_translations: w.name_translations ?? {},
    kind: w.kind,
    qty: w.qty,
    price: w.price ?? null,
    get_qty: w.get_qty ?? null,
    get_percent: w.get_percent ?? null,
    max_per_order: w.max_per_order ?? null,
    sort: w.sort ?? 0,
    is_active: w.is_active ?? true,
    pool: w.pool,
    reward_pool: w.reward_pool ?? [],
    windows: w.windows ?? [],
    branch_overrides: prev?.branch_overrides ?? [],
    created_at: prev?.created_at ?? now(),
    updated_at: now(),
  };
}

function settings(): ComboSettings {
  return {
    min_margin: minMargin,
    channels,
    branch_overrides: [...branchOverrides].map(([branch_id, sell]) => ({
      branch_id,
      sell,
      effective: {
        pos: sell.pos ?? channels.pos,
        qr: sell.qr ?? channels.qr,
        online: sell.online ?? channels.online,
        delivery: sell.delivery ?? channels.delivery,
      },
    })),
  };
}

function report(kind: string, from: string, to: string): BundlesReport {
  const rows =
    kind === "deal"
      ? [...deals.values()].map((d, i) => ({
          kind: "deal", id: d.id, name: d.name, name_translations: d.name_translations,
          sold: 14 - i, orders: 13 - i, revenue: 126_000, list_value: 154_000, saving: 28_000, cost: 49_000, cost_missing: false, margin: "0.6111",
        }))
      : [...combos.values()].map((c, i) => ({
          kind: "combo", id: c.id, name: c.name, name_translations: c.name_translations,
          sold: 42 - i * 5, orders: 39 - i * 5, revenue: c.price * (42 - i * 5), list_value: c.economics.list_default * (42 - i * 5),
          saving: (c.economics.list_default - c.price) * (42 - i * 5), cost: (c.economics.cost_default ?? 0) * (42 - i * 5), cost_missing: false, margin: c.economics.margin_default ?? null,
        }));
  const sum = (k: "sold" | "revenue" | "list_value" | "saving" | "cost") => rows.reduce((s, r) => s + r[k], 0);
  return { from, to, rows, totals: { sold: sum("sold"), revenue: sum("revenue"), list_value: sum("list_value"), saving: sum("saving"), cost: sum("cost") } };
}

/** One sale with a combo (header + parts) and a plain line in a deal, for the order sheet. */
export const MOCK_COMBO_ORDER_ID = "ord_combo_1";
const line = (p: Record<string, unknown>) => ({
  order_id: MOCK_COMBO_ORDER_ID, size_label: null, addons: [], optionals: [], deductions_snapshot: [], staff_comp_minor: 0, staff_drink_id: null,
  line_kind: "item", combo_line_id: null, combo_slot_id: null, combo_slot_name: null, combo_unit_price: null, combo_share: 0, combo_surcharge: 0, deal_minor: 0,
  ...p,
});
export const MOCK_COMBO_ORDER = {
  ...MOCK_STAFF_ORDER,
  id: MOCK_COMBO_ORDER_ID,
  order_number: 44,
  order_ref: "ZM-260616-0044",
  payment_legs: [{ method: "cash", amount: 16_530, is_cash: true }],
  subtotal: 14_500,
  tax_amount: 2_030,
  total_amount: 16_530,
  items: [
    line({ id: "oi_c_h", menu_item_id: seed.id, item_name: "Breakfast combo", name_translations: { ar: "كومبو الفطور" }, quantity: 1, unit_price: 0, line_total: 0, line_kind: "combo", combo_unit_price: 9_000 }),
    line({ id: "oi_c_p1", menu_item_id: "mi_croissant", item_name: "Croissant", name_translations: { ar: "كرواسان" }, quantity: 1, unit_price: 4_500, line_total: 3_857, line_kind: "combo_part", combo_line_id: "oi_c_h", combo_slot_name: "Pastry", combo_share: 3_857 }),
    line({ id: "oi_c_p2", menu_item_id: "mi_latte", item_name: "Latte", name_translations: { ar: "لاتيه" }, size_label: "Large", quantity: 1, unit_price: 7_000, line_total: 6_143, line_kind: "combo_part", combo_line_id: "oi_c_h", combo_slot_name: "Coffee", combo_share: 5_143, combo_surcharge: 1_000 }),
    line({ id: "oi_c_x", menu_item_id: "mi_cheesecake", item_name: "Cheesecake", name_translations: { ar: "تشيز كيك" }, quantity: 1, unit_price: 9_000, line_total: 4_500, deal_minor: 4_500 }),
  ],
  deals: [{ id: "od_1", deal_rule_id: "deal_seed", name: "Cake half off", name_translations: { ar: "الكيك بنصف السعر" }, times: 1, discount: 4_500, discount_server: 4_500, lines: [{ order_item_id: "oi_c_x", units: 1, discount: 4_500 }] }],
} as unknown as OrderFull;

const json = async <T,>(r: Request) => (await r.json()) as T;
const q = (r: Request, k: string) => new URL(r.url).searchParams.get(k);

export const comboHandlers = [
  // Settings first: "*/combos" would otherwise also match "/settings/combos".
  http.get("*/settings/combos", () => HttpResponse.json(settings())),
  http.put("*/settings/combos", async ({ request }) => {
    const b = await json<{ min_margin?: string | null; channels?: typeof channels | null }>(request);
    if ("min_margin" in b) minMargin = b.min_margin ?? null;
    if (b.channels) channels = { ...channels, ...b.channels };
    return HttpResponse.json(settings());
  }),
  http.put("*/settings/combos/branches/:branchId", async ({ params, request }) => {
    branchOverrides.set(params.branchId as string, await json(request));
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete("*/settings/combos/branches/:branchId", ({ params }) => {
    branchOverrides.delete(params.branchId as string);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/combos/economics", async ({ request }) => {
    const b = await json<ComboWrite & { branch_id?: string | null }>(request);
    return HttpResponse.json(economics(b, b.branch_id ?? null));
  }),
  http.get("*/combos", ({ request }) => {
    const term = (q(request, "q") ?? "").toLowerCase();
    const data = [...combos.values()].filter((c) => !term || c.name.toLowerCase().includes(term)).map(summaryOf);
    return HttpResponse.json({ data, total: data.length, page: 1, per_page: data.length || 20, total_pages: 1 });
  }),
  http.post("*/combos", async ({ request }) => {
    const c = toCombo(await json<ComboWrite>(request));
    combos.set(c.id, c);
    return HttpResponse.json(c, { status: 201 });
  }),
  http.get("*/combos/:id", ({ params }) => {
    const c = combos.get(params.id as string);
    return c ? HttpResponse.json(c) : HttpResponse.json({ error: "not found", code: "NOT_FOUND" }, { status: 404 });
  }),
  http.put("*/combos/:id", async ({ params, request }) => {
    const prev = combos.get(params.id as string);
    if (!prev) return HttpResponse.json({ error: "not found", code: "NOT_FOUND" }, { status: 404 });
    const c = toCombo(await json<ComboWrite>(request), prev);
    combos.set(c.id, c);
    return HttpResponse.json(c);
  }),
  http.put("*/menu-items/:id/meal", () => new HttpResponse(null, { status: 204 })),

  http.get("*/deals", () => HttpResponse.json([...deals.values()])),
  http.post("*/deals", async ({ request }) => {
    const d = toDeal(await json<DealWrite>(request));
    deals.set(d.id, d);
    return HttpResponse.json(d, { status: 201 });
  }),
  http.put("*/deals/:id/branches/:branchId", async ({ params, request }) => {
    const d = deals.get(params.id as string);
    if (d) {
      const { is_active } = await json<{ is_active: boolean }>(request);
      d.branch_overrides = [...d.branch_overrides.filter((o) => o.branch_id !== params.branchId), { branch_id: params.branchId as string, is_active }];
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete("*/deals/:id/branches/:branchId", ({ params }) => {
    const d = deals.get(params.id as string);
    if (d) d.branch_overrides = d.branch_overrides.filter((o) => o.branch_id !== params.branchId);
    return new HttpResponse(null, { status: 204 });
  }),
  http.put("*/deals/:id", async ({ params, request }) => {
    const prev = deals.get(params.id as string);
    if (!prev) return HttpResponse.json({ error: "not found", code: "NOT_FOUND" }, { status: 404 });
    const d = toDeal(await json<DealWrite>(request), prev);
    deals.set(d.id, d);
    return HttpResponse.json(d);
  }),
  http.delete("*/deals/:id", ({ params }) => {
    deals.delete(params.id as string);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/reports/bundles/combos/:id/mix", ({ params, request }) => {
    const c = combos.get(params.id as string);
    return HttpResponse.json({
      combo_id: params.id,
      from: q(request, "from"),
      to: q(request, "to"),
      slots: (c?.slots ?? []).map((s) => ({
        slot_id: s.id,
        name: s.name,
        picks: s.choices
          .filter((ch) => ch.menu_item_id)
          .map((ch) => ({ menu_item_id: ch.menu_item_id, name: MOCK_MENU_ITEMS.find((m) => m.id === ch.menu_item_id)?.name ?? "", size_label: null, count: 30, surcharge_total: 0 })),
      })),
    });
  }),
  http.get("*/reports/bundles", ({ request }) => HttpResponse.json(report(q(request, "kind") ?? "combo", q(request, "from") ?? "", q(request, "to") ?? ""))),

  http.get(`*/orders/${MOCK_COMBO_ORDER_ID}`, () => HttpResponse.json(MOCK_COMBO_ORDER)),
  // The combo sale heads the orders list, so the sheet can be opened from it.
  http.get("*/orders", () =>
    HttpResponse.json({
      ...MOCK_ORDERS_PAGE,
      data: [
        { ...MOCK_ORDERS_PAGE.data[0], id: MOCK_COMBO_ORDER_ID, order_number: 44, order_ref: "ZM-260616-0044", subtotal: 14_500, tax_amount: 2_030, total_amount: 16_530 },
        ...MOCK_ORDERS_PAGE.data,
      ],
    }),
  ),
];
