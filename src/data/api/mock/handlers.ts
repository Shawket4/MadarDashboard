import { http, HttpResponse } from "msw";

import {
  MOCK_ADDON_ITEMS,
  MOCK_BRANCH_SALES,
  MOCK_BRANCHES,
  MOCK_CATEGORIES,
  MOCK_COMPARISON,
  MOCK_DELIVERY_SALES,
  MOCK_INGREDIENT_CATALOG,
  MOCK_INVENTORY_SETTINGS,
  MOCK_INVENTORY_VALUATION,
  MOCK_LOW_STOCK,
  MOCK_MENU_CATALOG,
  MOCK_MENU_ITEMS,
  MOCK_ORDERS_PAGE,
  MOCK_ORG,
  MOCK_PUBLIC_MENU,
  MOCK_PURCHASE_ORDERS,
  MOCK_STOCKTAKES,
  MOCK_SUPPLIERS,
  MOCK_PEAK_HOURS,
  MOCK_TIMESERIES,
  MOCK_TOKEN,
  MOCK_USER,
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

/** All MSW request handlers. Order matters: more specific first. */
export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post("*/auth/login", () =>
    HttpResponse.json({ token: MOCK_TOKEN, user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 }),
  ),
  http.get("*/me", () =>
    HttpResponse.json({ user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 }),
  ),
  http.get("*/permissions*", () => HttpResponse.json({ permissions: [] })),

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
  http.get("*/reports/branches/*/waste-report", () => HttpResponse.json([])),
  http.get("*/reports/orgs/*/waste-report", () => HttpResponse.json([])),
  http.get("*/reports/branches/*/consumption", () => HttpResponse.json([])),
  http.get("*/reports/orgs/*/consumption", () => HttpResponse.json([])),
  http.get("*/reports/branches/*/shrinkage", () => HttpResponse.json([])),
  http.get("*/reports/orgs/*/shrinkage", () => HttpResponse.json([])),
  http.get("*/reports/branches/*/menu-engineering", () => HttpResponse.json({ rows: [] })),

  // ── Org ───────────────────────────────────────────────────────────────────
  http.get("*/orgs/:orgId", () => HttpResponse.json(MOCK_ORG)),
  http.get("*/branches", () => HttpResponse.json(MOCK_BRANCHES)),
  http.get("*/timezones", () => HttpResponse.json([])),

  // ── Menu ──────────────────────────────────────────────────────────────────
  http.get("*/categories", () => HttpResponse.json(MOCK_CATEGORIES)),
  http.get("*/costing/catalog", () => HttpResponse.json(MOCK_MENU_CATALOG)),
  http.get("*/addon-items", () => HttpResponse.json(MOCK_ADDON_ITEMS)),
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
  http.get("*/inventory/branches/*/stock", () => HttpResponse.json([])),
  http.get("*/inventory/branches/*/waste", () => HttpResponse.json([])),
  http.get("*/inventory/branches/*/transfers", () => HttpResponse.json([])),

  // ── Purchasing ────────────────────────────────────────────────────────────
  http.get("*/purchasing/orgs/*/orders", () => HttpResponse.json(MOCK_PURCHASE_ORDERS)),
  http.get("*/purchasing/orgs/*/suppliers", () => HttpResponse.json(MOCK_SUPPLIERS)),
  http.get("*/purchasing/branches/*/orders", () => HttpResponse.json(MOCK_PURCHASE_ORDERS)),
  http.get("*/purchasing/branches/*/reorder-suggestions", () => HttpResponse.json([])),

  // ── Stocktakes ────────────────────────────────────────────────────────────
  http.get("*/stocktakes/branches/*", () => HttpResponse.json(MOCK_STOCKTAKES)),

  // ── Admin / catalog ───────────────────────────────────────────────────────
  http.get("*/discounts", () => HttpResponse.json([])),
  http.get("*/users", () => HttpResponse.json([])),
  http.get("*/permissions/matrix", () => HttpResponse.json([])),

  // ── Delivery settings ─────────────────────────────────────────────────────
  http.get("*/delivery/channel-addon-overrides", () => HttpResponse.json([])),
  http.get("*/delivery/channel-overrides", () => HttpResponse.json([])),
  http.get("*/delivery/zones", () => HttpResponse.json([])),
  http.get("*/delivery/settings", () =>
    HttpResponse.json({
      in_mall_enabled: false,
      outside_enabled: false,
      in_mall_open_time: null,
      in_mall_close_time: null,
      outside_open_time: null,
      outside_close_time: null,
      in_mall_fee: 0,
      prep_time_minutes: 15,
      max_road_distance_meters: null,
      in_mall_discount_id: null,
      outside_discount_id: null,
      otp_required: true,
      in_mall_require_location: true,
    }),
  ),

  // ── Orders ────────────────────────────────────────────────────────────────
  http.get("*/orders", () => HttpResponse.json(MOCK_ORDERS_PAGE)),
];
