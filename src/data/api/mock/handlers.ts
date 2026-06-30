import { http, HttpResponse } from "msw";

import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import {
  MOCK_ADDON_CATALOG,
  MOCK_ADDON_ITEMS,
  MOCK_ADDON_SALES,
  MOCK_ADVISOR_RUN,
  MOCK_BRANCH_ADDON_OVERRIDES,
  MOCK_BRANCH_MENU_OVERRIDES,
  MOCK_BRANCH_SALES,
  MOCK_BRANCH_STOCK,
  MOCK_BRANCHES,
  MOCK_BUNDLE_PERFORMANCE,
  MOCK_BUNDLE_SUGGESTIONS,
  MOCK_BUNDLES,
  MOCK_CATEGORIES,
  MOCK_COMBINED_ITEM_SALES,
  MOCK_COMPARISON,
  MOCK_CONSUMPTION,
  MOCK_CURRENT_SHIFT,
  MOCK_DELIVERY_SALES,
  MOCK_DELIVERY_SETTINGS,
  MOCK_INGREDIENT_CATALOG,
  MOCK_INVENTORY_SETTINGS,
  MOCK_INVENTORY_VALUATION,
  MOCK_LOW_STOCK,
  MOCK_MENU_CATALOG,
  MOCK_MENU_ENGINEERING,
  MOCK_MENU_ITEMS,
  MOCK_ORDERS_PAGE,
  MOCK_ORG,
  MOCK_ORG_ID,
  MOCK_PO_LINES,
  MOCK_PRICE_SUGGESTIONS,
  MOCK_PUBLIC_MENU,
  MOCK_PURCHASE_ORDERS,
  MOCK_QR,
  MOCK_REMOVAL_SCENARIOS,
  MOCK_REORDER_SUGGESTIONS,
  MOCK_SHIFT_REPORT,
  MOCK_SHRINKAGE,
  MOCK_STOCKTAKES,
  MOCK_SUPPLIERS,
  MOCK_TELLER_STATS,
  MOCK_USERS,
  MOCK_VARIANCE_REPORT,
  MOCK_WASTE,
  MOCK_PEAK_HOURS,
  MOCK_TIMESERIES,
  MOCK_TOKEN,
  MOCK_USER,
  bundlesPage,
  permissionMatrix,
  shiftsPage,
} from "./data";

const PUBLIC_BRANCHES = [
  {
    id: "br_zamalek",
    name: "Zamalek",
    code: "ZAM",
    in_mall_enabled: true,
    outside_enabled: true,
    in_mall_open_now: true,
    outside_open_now: true,
    otp_required: false,
    in_mall_require_location: false,
  },
  {
    id: "br_newcairo",
    name: "New Cairo",
    code: "NC",
    in_mall_enabled: false,
    outside_enabled: true,
    in_mall_open_now: false,
    outside_open_now: true,
    otp_required: false,
    in_mall_require_location: true,
  },
];

const MOCK_ORDER_ITEMS = [
  { name: "Latte", quantity: 2 },
  { name: "Espresso", quantity: 1 },
];

const MOCK_ORDER_ITEMS_2 = [{ name: "Cappuccino", quantity: 1 }];

const MOCK_HISTORY = [
  {
    id: "ord_001",
    delivery_ref: "ZAM-1042",
    status: "delivered",
    created_at: "2026-06-10T14:30:00Z",
    branch_id: "br_zamalek",
    branch_name: "Zamalek",
    channel: "outside",
    customer_name: "Ahmed Hassan",
    subtotal: 18000,
    delivery_fee: 1500,
    discount_amount: 0,
    total: 19500,
    address_line: "14 Hassan Sabry St, Zamalek",
    place_name: null,
    customer_lat: 30.063,
    customer_lng: 31.217,
    items: MOCK_ORDER_ITEMS,
  },
  {
    id: "ord_002",
    delivery_ref: "ZAM-1031",
    status: "cancelled",
    created_at: "2026-06-05T10:15:00Z",
    branch_id: "br_zamalek",
    branch_name: "Zamalek",
    channel: "outside",
    customer_name: "Ahmed Hassan",
    subtotal: 9000,
    delivery_fee: 1500,
    discount_amount: 0,
    total: 10500,
    address_line: "14 Hassan Sabry St, Zamalek",
    place_name: null,
    customer_lat: 30.063,
    customer_lng: 31.217,
    items: MOCK_ORDER_ITEMS_2,
  },
];

const MOCK_PAST_LOCATIONS = [
  {
    branch_id: "br_zamalek",
    channel: "outside",
    address_line: "14 Hassan Sabry St, Zamalek",
    place_name: null,
    floor: null,
    unit_number: null,
    landmark: "Near the Nile",
    customer_lat: 30.063,
    customer_lng: 31.217,
    last_used_at: "2026-06-10T14:30:00Z",
  },
  {
    branch_id: "br_zamalek",
    channel: "in_mall",
    address_line: null,
    place_name: "Madar Coffee",
    floor: "2",
    unit_number: "Unit 14",
    landmark: "Near the main entrance",
    customer_lat: 30.063,
    customer_lng: 31.217,
    last_used_at: "2026-06-08T11:00:00Z",
  },
];

const MOCK_TRACKING = {
  id: "ord_001",
  org_id: "org_madar_demo",
  delivery_ref: "ZAM-1042",
  branch_name: "Zamalek",
  status: "out_for_delivery",
  channel: "outside",
  customer_name: "Ahmed Hassan",
  address_line: "14 Hassan Sabry St, Zamalek",
  place_name: null,
  floor: null,
  unit_number: null,
  cancel_reason: null,
  payment_method_hint: "cash",
  subtotal: 18000,
  delivery_fee: 1500,
  discount_amount: 0,
  total: 19500,
  estimated_prep_minutes: 25,
  created_at: "2026-06-10T14:30:00Z",
  confirmed_at: "2026-06-10T14:32:00Z",
  preparing_at: "2026-06-10T14:35:00Z",
  ready_at: "2026-06-10T14:45:00Z",
  out_for_delivery_at: "2026-06-10T14:48:00Z",
  delivered_at: null,
  cancelled_at: null,
  rejected_at: null,
  items: MOCK_ORDER_ITEMS,
};

/** A rich, mostly-complete onboarding so the wizard + mirror look alive under
 *  the mock harness: required steps done (can_complete), some optional steps
 *  still open (so the "keep building" nudge shows), recipe coverage partial.
 *  Statefully flips to completed on /complete so the finish→dashboard flow
 *  (and the redirect gate) behave like the real backend. */
let onboardingDone = false;
const onboardingStatus = () => ({
  org_id: MOCK_ORG_ID,
  completed: onboardingDone,
  completed_at: onboardingDone ? "2026-06-30T10:00:00Z" : null,
  can_complete: true,
  recipe_coverage: 0.45,
  steps: [
    { key: "org_profile", done: true, count: 1, required: false },
    { key: "branch", done: true, count: 2, required: true },
    { key: "payment_methods", done: true, count: 3, required: true },
    { key: "categories", done: true, count: 4, required: true },
    { key: "menu_items", done: true, count: 9, required: true },
    { key: "ingredients", done: true, count: 12, required: false },
    { key: "recipes", done: false, count: 4, required: false },
    { key: "addons", done: false, count: 0, required: false },
    { key: "team", done: false, count: 0, required: false },
    { key: "first_order", done: false, count: 0, required: false },
  ],
});

/** Echo a create back with a synthetic id so onboarding dialogs succeed under
 *  mock (multipart bodies aren't JSON — fall back to just an id). */
const echoCreated = async ({ request }: { request: Request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    /* multipart / empty */
  }
  return HttpResponse.json({ id: `mock_${Math.random().toString(36).slice(2)}`, ...body });
};

/** All MSW request handlers. Order matters: more specific first. */
export const handlers = [
  // ── Demo session ──────────────────────────────────────────────────────────
  // Mirrors the demo backend so `dev:demo` exercises the playground locally:
  // `full` lands on a populated dashboard, `empty` flows into onboarding.
  http.post("*/demo/session", ({ request }) => {
    const variant = new URL(request.url).searchParams.get("variant") === "empty" ? "empty" : "full";
    onboardingDone = variant === "full";
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return HttpResponse.json({ token: MOCK_TOKEN, org_id: MOCK_ORG_ID, expires_at, variant, user: MOCK_USER });
  }),

  // ── Onboarding ────────────────────────────────────────────────────────────
  http.get("*/orgs/*/onboarding", () => HttpResponse.json(onboardingStatus())),
  http.post("*/orgs/*/onboarding/complete", () => {
    onboardingDone = true;
    return HttpResponse.json(onboardingStatus());
  }),

  // ── Setup writes (so the onboarding wizard's dialogs succeed under mock) ─────
  http.post("*/branches", echoCreated),
  http.post("*/payment-methods", echoCreated),
  http.post("*/categories", echoCreated),
  http.post("*/addon-items", echoCreated),
  http.post("*/inventory/orgs/*/catalog", echoCreated),
  http.post("*/users", echoCreated),
  http.post("*/menu-items/*/sizes", echoCreated),
  http.post("*/recipes/drinks/*", echoCreated),
  http.put("*/menu-items/*/allowed-addons", () => HttpResponse.json({})),
  http.post("*/uploads/menu-items/*", () => HttpResponse.json({ id: "img", image_url: "" })),
  http.post("*/menu-items", echoCreated),
  http.patch("*/orgs/*", echoCreated),
  http.put("*/orgs/*/logo", () => HttpResponse.json({ id: MOCK_ORG_ID, logo_url: null })),

  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post("*/auth/login", () =>
    HttpResponse.json({ token: MOCK_TOKEN, user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 }),
  ),
  http.get("*/me", () =>
    HttpResponse.json({ user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 }),
  ),
  // The current user's permission list (auth bootstrap). Scoped to the real API
  // path so it can't shadow Vite's "/src/routes/_app/permissions.tsx" module URL.
  http.get("*/permissions/user/*", () => HttpResponse.json({ permissions: [] })),

  // ── OTP ───────────────────────────────────────────────────────────────────
  http.post("*/otp/request", () => HttpResponse.json({ success: true })),
  http.post("*/otp/verify", () => HttpResponse.json({ device_token: "mock_device_token_abc123" })),

  // ── Public ordering ───────────────────────────────────────────────────────
  http.get("*/public/branches/:branchId/menu", () => HttpResponse.json(MOCK_PUBLIC_MENU)),
  http.get("*/public/branches/:branchId/delivery-quote", () =>
    HttpResponse.json({ status: "ok", fee: 1500, distance_meters: 2400, zone_id: "z1", zone_name: "Zone A" }),
  ),
  http.get("*/public/branches", () => HttpResponse.json(PUBLIC_BRANCHES)),
  http.get("*/public/delivery-orders/history", () => HttpResponse.json(MOCK_HISTORY)),
  http.get("*/public/delivery-orders/past-locations", () => HttpResponse.json(MOCK_PAST_LOCATIONS)),
  http.get("*/public/delivery-orders/:id/track", () => HttpResponse.json(MOCK_TRACKING)),
  http.post("*/public/delivery-orders", () =>
    HttpResponse.json({ id: "ord_new_001", delivery_ref: "ZAM-1099", status: "received" }),
  ),

  // ── Reports ───────────────────────────────────────────────────────────────
  http.get("*/reports/orgs/*/comparison", () => HttpResponse.json(MOCK_COMPARISON)),
  http.get("*/reports/branches/*/sales/timeseries", () => HttpResponse.json(MOCK_TIMESERIES)),
  http.get("*/reports/branches/*/sales/peak-hours", () => HttpResponse.json(MOCK_PEAK_HOURS)),
  http.get("*/reports/branches/*/delivery-sales", () => HttpResponse.json(MOCK_DELIVERY_SALES)),
  http.get("*/reports/branches/*/sales", () => HttpResponse.json(MOCK_BRANCH_SALES)),
  http.get("*/reports/orgs/*/inventory-valuation", () => HttpResponse.json(MOCK_INVENTORY_VALUATION)),
  http.get("*/reports/orgs/*/low-stock", () => HttpResponse.json(MOCK_LOW_STOCK)),
  http.get("*/reports/branches/*/inventory-valuation", () => HttpResponse.json(MOCK_INVENTORY_VALUATION)),
  http.get("*/reports/branches/*/low-stock", () => HttpResponse.json(MOCK_LOW_STOCK)),
  http.get("*/reports/branches/*/waste-report", () => HttpResponse.json(MOCK_WASTE)),
  http.get("*/reports/orgs/*/waste-report", () => HttpResponse.json(MOCK_WASTE)),
  http.get("*/reports/branches/*/consumption", () => HttpResponse.json(MOCK_CONSUMPTION)),
  http.get("*/reports/orgs/*/consumption", () => HttpResponse.json(MOCK_CONSUMPTION)),
  http.get("*/reports/branches/*/shrinkage", () => HttpResponse.json(MOCK_SHRINKAGE)),
  http.get("*/reports/orgs/*/shrinkage", () => HttpResponse.json(MOCK_SHRINKAGE)),
  http.get("*/reports/branches/*/items-combined", () => HttpResponse.json(MOCK_COMBINED_ITEM_SALES)),
  http.get("*/reports/branches/*/addons", () => HttpResponse.json(MOCK_ADDON_SALES)),
  http.get("*/reports/branches/*/tellers", () => HttpResponse.json(MOCK_TELLER_STATS)),
  http.get("*/reports/branches/*/menu-engineering", () => HttpResponse.json(MOCK_MENU_ENGINEERING)),

  // ── Org ───────────────────────────────────────────────────────────────────
  http.get("*/orgs/:orgId", () => HttpResponse.json(MOCK_ORG)),
  http.get("*/branches", () => HttpResponse.json(MOCK_BRANCHES)),
  http.get("*/timezones", () => HttpResponse.json([])),

  // ── Menu ──────────────────────────────────────────────────────────────────
  http.get("*/categories", () => HttpResponse.json(MOCK_CATEGORIES)),
  http.get("*/costing/catalog", () => HttpResponse.json(MOCK_MENU_CATALOG)),
  http.get("*/addon-items/catalog", () => HttpResponse.json(MOCK_ADDON_CATALOG)),
  http.get("*/addon-items", () => HttpResponse.json(MOCK_ADDON_ITEMS)),

  // ── Bundles ───────────────────────────────────────────────────────────────
  http.get("*/bundles/:id/performance", ({ params }) =>
    HttpResponse.json(
      MOCK_BUNDLE_PERFORMANCE[params.id as string] ?? {
        sales_volume: 0, gross_revenue: 0, net_profit: 0, component_popularity: [],
      },
    ),
  ),
  http.get("*/bundles/available", () => HttpResponse.json(MOCK_BUNDLES)),
  http.get("*/bundles", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json(bundlesPage(status));
  }),

  // ── Branch overrides ──────────────────────────────────────────────────────
  http.get("*/branch-menu-overrides", () => HttpResponse.json(MOCK_BRANCH_MENU_OVERRIDES)),
  http.get("*/branch-addon-overrides", () => HttpResponse.json(MOCK_BRANCH_ADDON_OVERRIDES)),

  // ── Menu Advisor ──────────────────────────────────────────────────────────
  http.get("*/menu-advisor/branches/*/runs/active", () => HttpResponse.json(null)),
  http.get("*/menu-advisor/branches/*/runs/latest", () => HttpResponse.json(MOCK_ADVISOR_RUN)),
  http.get("*/menu-advisor/branches/*/runs", () => HttpResponse.json([MOCK_ADVISOR_RUN])),
  http.get("*/menu-advisor/runs/*/price-suggestions", () => HttpResponse.json(MOCK_PRICE_SUGGESTIONS)),
  http.get("*/menu-advisor/runs/*/bundle-suggestions", () => HttpResponse.json(MOCK_BUNDLE_SUGGESTIONS)),
  http.get("*/menu-advisor/runs/*/removal-scenarios", () => HttpResponse.json(MOCK_REMOVAL_SCENARIOS)),
  http.get("*/menu-items/mi_espresso", () =>
    HttpResponse.json({
      id: "mi_espresso",
      org_id: "org_madar_demo",
      name: "Espresso",
      name_translations: { ar: "إسبريسو" },
      description: null,
      description_translations: {},
      base_price: 3500,
      category_id: "cat_hot",
      image_url: null,
      is_active: true,
      sizes: [{ label: "Single", price_override: 3500 }, { label: "Double", price_override: 5000 }],
      recipes: [
        { size_label: "Single", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.018 },
        { size_label: "Double", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.036 },
      ],
      sku_costs: [],
    }),
  ),
  http.get("*/menu-items/mi_latte", () =>
    HttpResponse.json({
      id: "mi_latte",
      org_id: "org_madar_demo",
      name: "Latte",
      name_translations: { ar: "لاتيه" },
      description: null,
      description_translations: {},
      base_price: 6000,
      category_id: "cat_hot",
      image_url: null,
      is_active: true,
      sizes: [{ label: "Regular", price_override: 6000 }, { label: "Large", price_override: 7500 }],
      recipes: [
        { size_label: "Regular", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.018 },
        { size_label: "Regular", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", ingredient_unit: "liter", quantity_used: 0.24 },
        { size_label: "Regular", org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", ingredient_unit: "liter", quantity_used: 0.015 },
        { size_label: "Large", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.024 },
        { size_label: "Large", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", ingredient_unit: "liter", quantity_used: 0.32 },
        { size_label: "Large", org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", ingredient_unit: "liter", quantity_used: 0.02 },
      ],
      sku_costs: [],
    }),
  ),
  http.get("*/menu-items/:id/addon-slots", () => HttpResponse.json([])),
  http.get("*/menu-items/:id/optional-fields", () => HttpResponse.json([])),
  http.get("*/menu-items/:id", () =>
    HttpResponse.json({
      id: "mi_generic",
      org_id: "org_madar_demo",
      name: "Menu Item",
      name_translations: {},
      description: null,
      description_translations: {},
      base_price: 5000,
      category_id: "cat_hot",
      image_url: null,
      is_active: true,
      sizes: [{ label: "Regular", price_override: 5000 }],
      recipes: [
        { size_label: "Regular", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.016 },
        { size_label: "Regular", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", ingredient_unit: "liter", quantity_used: 0.2 },
      ],
      sku_costs: [],
    }),
  ),
  http.get("*/menu-items", () => HttpResponse.json(MOCK_MENU_ITEMS)),

  // ── Inventory ─────────────────────────────────────────────────────────────
  http.get("*/inventory/orgs/*/catalog", () => HttpResponse.json(MOCK_INGREDIENT_CATALOG)),
  http.get("*/inventory/orgs/*/settings", () => HttpResponse.json(MOCK_INVENTORY_SETTINGS)),
  http.get("*/inventory/branches/*/stock", () => HttpResponse.json(MOCK_BRANCH_STOCK)),
  http.get("*/inventory/branches/*/waste", () => HttpResponse.json([])),
  http.get("*/inventory/branches/*/transfers", () => HttpResponse.json([])),

  // ── Purchasing ────────────────────────────────────────────────────────────
  // A single PO returns its full shape (PurchaseOrder + lines) for the receive dialog.
  http.get("*/purchasing/orders/:poId/receipts", () => HttpResponse.json([])),
  http.get("*/purchasing/orders/:poId", ({ params }) => {
    const po = MOCK_PURCHASE_ORDERS.find((p) => p.id === params.poId) ?? MOCK_PURCHASE_ORDERS[0];
    return HttpResponse.json({ ...po, lines: MOCK_PO_LINES[po.id] ?? [] });
  }),
  http.get("*/purchasing/orgs/*/orders", () => HttpResponse.json(MOCK_PURCHASE_ORDERS)),
  http.get("*/purchasing/orgs/*/suppliers", () => HttpResponse.json(MOCK_SUPPLIERS)),
  http.get("*/purchasing/branches/*/reorder-suggestions", () => HttpResponse.json(MOCK_REORDER_SUGGESTIONS)),
  http.get("*/purchasing/branches/:branchId/orders", ({ params }) => {
    const data = params.branchId === ALL_BRANCHES_ID ? MOCK_PURCHASE_ORDERS : MOCK_PURCHASE_ORDERS.filter((p) => p.branch_id === params.branchId);
    return HttpResponse.json(data);
  }),

  // ── Stocktakes ────────────────────────────────────────────────────────────
  http.get("*/stocktakes/:id/variance-report", () => HttpResponse.json(MOCK_VARIANCE_REPORT)),
  http.get("*/stocktakes/branches/:branchId", ({ params }) => {
    const data = params.branchId === ALL_BRANCHES_ID ? MOCK_STOCKTAKES : MOCK_STOCKTAKES.filter((s) => s.branch_id === params.branchId);
    return HttpResponse.json(data);
  }),

  // ── Admin / catalog ───────────────────────────────────────────────────────
  http.get("*/discounts", () => HttpResponse.json([])),
  // Per-user permission matrix (resource × action) must precede the bare /users.
  http.get("*/permissions/matrix/:userId", ({ params }) =>
    HttpResponse.json(permissionMatrix(params.userId as string)),
  ),
  http.get("*/permissions/matrix", () => HttpResponse.json([])),
  http.get("*/users", () => HttpResponse.json(MOCK_USERS)),

  // ── QR codes ──────────────────────────────────────────────────────────────
  http.get("*/branches/:id/qr", ({ request }) => {
    const inMall = new URL(request.url).searchParams.has("place_name");
    return HttpResponse.json(MOCK_QR(inMall ? "branch_in_mall" : "branch", "madar-coffee/zamalek", inMall ? "zm-mall" : "zm-menu"));
  }),
  http.get("*/orgs/:id/qr", () => HttpResponse.json(MOCK_QR("org", "madar-coffee", "madar"))),

  // ── Shifts ────────────────────────────────────────────────────────────────
  http.get("*/shifts/branches/:branchId/current", () => HttpResponse.json(MOCK_CURRENT_SHIFT)),
  http.get("*/shifts/branches/:branchId", ({ params }) =>
    HttpResponse.json(shiftsPage(params.branchId as string)),
  ),
  http.get("*/shifts/:shiftId/report", ({ params }) =>
    HttpResponse.json(MOCK_SHIFT_REPORT(params.shiftId as string)),
  ),
  http.get("*/shifts/:shiftId/cash-movements", () => HttpResponse.json([])),

  // ── Delivery settings ─────────────────────────────────────────────────────
  http.get("*/delivery/channel-addon-overrides", () => HttpResponse.json([])),
  http.get("*/delivery/channel-overrides", () => HttpResponse.json([])),
  http.get("*/delivery/zones", () => HttpResponse.json([])),
  http.get("*/delivery/settings", () => HttpResponse.json(MOCK_DELIVERY_SETTINGS)),

  // ── Orders ────────────────────────────────────────────────────────────────
  http.get("*/orders", () => HttpResponse.json(MOCK_ORDERS_PAGE)),
];
