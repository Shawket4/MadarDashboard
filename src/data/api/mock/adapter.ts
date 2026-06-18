import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { apiClient } from "@/data/api/client";
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
  MOCK_PURCHASE_ORDERS,
  MOCK_STOCKTAKES,
  MOCK_SUPPLIERS,
  MOCK_PEAK_HOURS,
  MOCK_TIMESERIES,
  MOCK_TOKEN,
  MOCK_USER,
} from "./data";

/**
 * Dev-only mock at the axios-adapter level — NO service worker. MSW's service
 * worker intercepts every same-origin request in the headless preview, which
 * races Vite's dynamic route-chunk imports and breaks lazy routes. Overriding
 * `apiClient.defaults.adapter` mocks the API without ever touching the network,
 * so module loading is untouched. Curated endpoints cover the screenshot
 * surfaces; anything else returns a benign default.
 */

interface Rule {
  test: RegExp;
  method?: string;
  data: unknown;
}

// Substring-anchored so they match whether axios passes a relative path
// (`/branches`) or the full URL (`…/api/branches`).
const RULES: Rule[] = [
  { test: /\/auth\/login$/, data: { token: MOCK_TOKEN, user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 } },
  { test: /\/me$/, data: { user: MOCK_USER, currency_code: "EGP", tax_rate: 0.14 } },
  { test: /permissions/, data: { permissions: [] } },
  { test: /\/reports\/orgs\/[^/]+\/comparison/, data: MOCK_COMPARISON },
  { test: /\/reports\/branches\/[^/]+\/sales\/timeseries/, data: MOCK_TIMESERIES },
  { test: /\/reports\/branches\/[^/]+\/sales\/peak-hours/, data: MOCK_PEAK_HOURS },
  { test: /\/reports\/branches\/[^/]+\/delivery-sales/, data: MOCK_DELIVERY_SALES },
  { test: /\/reports\/branches\/[^/]+\/sales$/, data: MOCK_BRANCH_SALES },
  { test: /\/orgs\/[^/]+$/, method: "get", data: MOCK_ORG },
  // Public ordering — must come BEFORE generic /branches$ rule (more specific path)
  { test: /\/public\/branches\/[^/]+\/menu/, method: "get", data: { items: [], categories: [], addons: [], discount: null } },
  { test: /\/public\/branches\/[^/]+\/delivery-quote/, method: "get", data: { status: "ok", fee: 1500, distance_meters: 2400, zone_id: "z1", zone_name: "Zone A" } },
  { test: /\/public\/branches/, method: "get", data: [
    { id: "br_zamalek", name: "Zamalek", code: "ZAM", in_mall_enabled: true, outside_enabled: true, in_mall_open_now: true, outside_open_now: true, otp_required: false, in_mall_require_location: false },
    { id: "br_newcairo", name: "New Cairo", code: "NC", in_mall_enabled: false, outside_enabled: true, in_mall_open_now: false, outside_open_now: true, otp_required: false, in_mall_require_location: true },
  ] },
  { test: /\/public\/delivery-orders\/history/, method: "get", data: [
    { id: "ord_001", delivery_ref: "ZAM-1042", status: "delivered", created_at: "2026-06-10T14:30:00Z", branch_id: "br_zamalek", branch_name: "Zamalek", channel: "outside", subtotal: 18000, delivery_fee: 1500, total: 19500, customer_name: "Ahmed Hassan", address_line: "14 Hassan Sabry St, Zamalek", place_name: null, customer_lat: 30.063, customer_lng: 31.217, items: [{ name: "Latte", quantity: 2 }, { name: "Espresso", quantity: 1 }] },
    { id: "ord_002", delivery_ref: "ZAM-1031", status: "cancelled", created_at: "2026-06-05T10:15:00Z", branch_id: "br_zamalek", branch_name: "Zamalek", channel: "outside", subtotal: 9000, delivery_fee: 1500, total: 10500, customer_name: "Ahmed Hassan", address_line: "14 Hassan Sabry St, Zamalek", place_name: null, customer_lat: 30.063, customer_lng: 31.217, items: [{ name: "Cappuccino", quantity: 1 }] },
  ] },
  { test: /\/public\/delivery-orders\/past-locations/, method: "get", data: [
    { branch_id: "br_zamalek", channel: "outside", address_line: "14 Hassan Sabry St, Zamalek", place_name: null, floor: null, unit_number: null, landmark: "Near the Nile", customer_lat: 30.063, customer_lng: 31.217, last_used_at: "2026-06-10T14:30:00Z" },
    { branch_id: "br_zamalek", channel: "in_mall", address_line: null, place_name: "Sufrix Coffee", floor: "2", unit_number: "Unit 14", landmark: "Near the main entrance", customer_lat: 30.063, customer_lng: 31.217, last_used_at: "2026-06-08T11:00:00Z" },
  ] },
  { test: /\/branches$/, method: "get", data: MOCK_BRANCHES },
  { test: /\/timezones/, data: [] },
  { test: /\/categories/, method: "get", data: MOCK_CATEGORIES },
  { test: /\/costing\/catalog/, method: "get", data: MOCK_MENU_CATALOG },
  { test: /\/addon-items/, method: "get", data: MOCK_ADDON_ITEMS },
  // Individual item fetch must come BEFORE the list rule (more specific regex first)
  { test: /\/menu-items\/mi_espresso/, method: "get", data: { id: "mi_espresso", org_id: "org_sufrix_demo", name: "Espresso", name_translations: { ar: "إسبريسو" }, description: null, description_translations: {}, base_price: 3_500, category_id: "cat_hot", image_url: null, is_active: true, sizes: [{ label: "Single", price_override: 3_500 }, { label: "Double", price_override: 5_000 }], recipes: [{ size_label: "Single", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.018 }, { size_label: "Double", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.036 }], sku_costs: [] } },
  { test: /\/menu-items\/mi_latte/, method: "get", data: { id: "mi_latte", org_id: "org_sufrix_demo", name: "Latte", name_translations: { ar: "لاتيه" }, description: null, description_translations: {}, base_price: 6_000, category_id: "cat_hot", image_url: null, is_active: true, sizes: [{ label: "Regular", price_override: 6_000 }, { label: "Large", price_override: 7_500 }], recipes: [{ size_label: "Regular", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.018 }, { size_label: "Regular", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", ingredient_unit: "liter", quantity_used: 0.15 }, { size_label: "Large", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", ingredient_unit: "kg", quantity_used: 0.018 }, { size_label: "Large", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", ingredient_unit: "liter", quantity_used: 0.22 }], sku_costs: [] } },
  { test: /\/menu-items\/[^/]+$/, method: "get", data: { id: "mi_generic", org_id: "org_sufrix_demo", name: "Menu Item", name_translations: {}, description: null, description_translations: {}, base_price: 5_000, category_id: "cat_hot", image_url: null, is_active: true, sizes: [{ label: "Regular", price_override: 5_000 }], recipes: [], sku_costs: [] } },
  { test: /\/menu-items/, method: "get", data: MOCK_MENU_ITEMS },
  // Inventory — must come before generic /orders$ to avoid shadowing
  { test: /\/inventory\/orgs\/[^/]+\/catalog/, method: "get", data: MOCK_INGREDIENT_CATALOG },
  { test: /\/inventory\/orgs\/[^/]+\/settings/, method: "get", data: MOCK_INVENTORY_SETTINGS },
  { test: /\/inventory\/branches\/[^/]+\/stock/, method: "get", data: [] },
  { test: /\/inventory\/branches\/[^/]+\/waste/, method: "get", data: [] },
  { test: /\/inventory\/branches\/[^/]+\/transfers/, method: "get", data: [] },
  { test: /\/purchasing\/orgs\/[^/]+\/orders/, method: "get", data: MOCK_PURCHASE_ORDERS },
  { test: /\/purchasing\/orgs\/[^/]+\/suppliers/, method: "get", data: MOCK_SUPPLIERS },
  { test: /\/purchasing\/branches\/[^/]+\/orders/, method: "get", data: MOCK_PURCHASE_ORDERS },
  { test: /\/purchasing\/branches\/[^/]+\/reorder-suggestions/, method: "get", data: [] },
  { test: /\/reports\/orgs\/[^/]+\/inventory-valuation/, method: "get", data: MOCK_INVENTORY_VALUATION },
  { test: /\/reports\/orgs\/[^/]+\/low-stock/, method: "get", data: MOCK_LOW_STOCK },
  { test: /\/reports\/branches\/[^/]+\/inventory-valuation/, method: "get", data: MOCK_INVENTORY_VALUATION },
  { test: /\/reports\/branches\/[^/]+\/low-stock/, method: "get", data: MOCK_LOW_STOCK },
  { test: /\/stocktakes\/branches\/[^/]+/, method: "get", data: MOCK_STOCKTAKES },
  // Inventory report endpoints that return arrays
  { test: /\/reports\/branches\/[^/]+\/waste-report/, method: "get", data: [] },
  { test: /\/reports\/orgs\/[^/]+\/waste-report/, method: "get", data: [] },
  { test: /\/reports\/branches\/[^/]+\/consumption/, method: "get", data: [] },
  { test: /\/reports\/orgs\/[^/]+\/consumption/, method: "get", data: [] },
  { test: /\/reports\/branches\/[^/]+\/shrinkage/, method: "get", data: [] },
  { test: /\/reports\/orgs\/[^/]+\/shrinkage/, method: "get", data: [] },
  { test: /\/reports\/branches\/[^/]+\/menu-engineering/, method: "get", data: { rows: [] } },
  // Admin / catalog endpoints
  { test: /\/discounts/, method: "get", data: [] },
  { test: /\/users/, method: "get", data: [] },
  { test: /\/permissions\/matrix/, method: "get", data: [] },
  // Delivery endpoints
  { test: /\/delivery\/channel-addon-overrides/, method: "get", data: [] },
  { test: /\/delivery\/channel-overrides/, method: "get", data: [] },
  { test: /\/delivery\/zones/, method: "get", data: [] },
  {
    test: /\/delivery\/settings/, method: "get",
    data: {
      in_mall_enabled: false, outside_enabled: false,
      in_mall_open_time: null, in_mall_close_time: null,
      outside_open_time: null, outside_close_time: null,
      in_mall_fee: 0, prep_time_minutes: 15,
      max_road_distance_meters: null,
      in_mall_discount_id: null, outside_discount_id: null,
      otp_required: true, in_mall_require_location: true,
    },
  },
  // Slots & Optionals — must come before generic menu-item rules
  { test: /\/menu-items\/[^/]+\/addon-slots/, method: "get", data: [] },
  { test: /\/menu-items\/[^/]+\/optional-fields/, method: "get", data: [] },
  // Generic order list — after specific purchasing routes
  { test: /\/orders$/, method: "get", data: MOCK_ORDERS_PAGE },
];

export function installMockAdapter(): void {
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const method = (config.method ?? "get").toLowerCase();
    const rule = RULES.find((r) => r.test.test(url) && (!r.method || r.method === method));
    const response: AxiosResponse = {
      data: rule ? rule.data : {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
    return response;
  };
  apiClient.defaults.adapter = adapter;
}
