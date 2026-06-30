/**
 * Curated, realistic seed data for the dev preview harness (VITE_MOCK=1).
 * Money is in piastres (1 EGP = 100), matching the real backend contract.
 * Deterministic — no Math.random — so screenshots are stable across runs.
 */
import type { Org } from "@/data/api/generated/models/org";
import type { Branch } from "@/data/api/generated/models/branch";
import type { BranchComparison } from "@/data/api/generated/models/branchComparison";
import type { OrgComparisonReport } from "@/data/api/generated/models/orgComparisonReport";
import type { TimeseriesPoint } from "@/data/api/generated/models/timeseriesPoint";
import type { BranchSalesReport } from "@/data/api/generated/models/branchSalesReport";
import type { DeliverySalesReport } from "@/data/api/generated/models/deliverySalesReport";
import type { Order } from "@/data/api/generated/models/order";
import type { OrderSummary } from "@/data/api/generated/models/orderSummary";
import type { PaginatedOrders } from "@/data/api/generated/models/paginatedOrders";
import type { PeakHourPoint } from "@/data/api/generated/models/peakHourPoint";
import type { UserPublic } from "@/data/types";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";

export const MOCK_ORG_ID = "org_madar_demo";
export const MOCK_TOKEN = "mock.session.token";

export const MOCK_USER: UserPublic = {
  id: "usr_demo_admin",
  name: "Shawket Ibrahim",
  email: "shawket@madar.app",
  phone: "+20 100 000 0000",
  role: "org_admin",
  org_id: MOCK_ORG_ID,
  branch_id: null,
  is_active: true,
};

const NOW_ISO = "2026-06-16T09:24:00Z";

/** Split a piastres total into a realistic payment-method map. */
function methodSplit(total: number): Record<string, number> {
  const cash = Math.round(total * 0.34);
  const card = Math.round(total * 0.31);
  const talabat_online = Math.round(total * 0.18);
  const digital_wallet = Math.round(total * 0.1);
  const talabat_cash = total - cash - card - talabat_online - digital_wallet;
  return { cash, card, talabat_online, digital_wallet, talabat_cash };
}

interface BranchSeed {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  voided: number;
}

const BRANCH_SEEDS: BranchSeed[] = [
  { id: "br_zamalek", name: "Zamalek", revenue: 4_820_000, orders: 612, voided: 14 },
  { id: "br_newcairo", name: "New Cairo", revenue: 3_910_000, orders: 503, voided: 9 },
  { id: "br_maadi", name: "Maadi", revenue: 3_240_000, orders: 441, voided: 11 },
  { id: "br_heliopolis", name: "Heliopolis", revenue: 2_680_000, orders: 388, voided: 7 },
  { id: "br_zayed", name: "Sheikh Zayed", revenue: 1_950_000, orders: 271, voided: 5 },
];

export const MOCK_ORG: Org = {
  id: MOCK_ORG_ID,
  name: "Madar Coffee Co.",
  slug: "madar-coffee",
  currency_code: "EGP",
  tax_rate: 0.14,
  timezone: "Africa/Cairo",
  logo_url: null,
  receipt_footer: "Thank you — see you again soon.",
  is_active: true,
};

export const MOCK_BRANCHES: Branch[] = BRANCH_SEEDS.map((b) => ({
  id: b.id,
  org_id: MOCK_ORG_ID,
  name: b.name,
  is_active: true,
  address: `${b.name}, Cairo`,
  phone: "+20 2 0000 0000",
  timezone: "Africa/Cairo",
  geo_radius_meters: 200,
  latitude: 30.05,
  longitude: 31.23,
  org_logo_url: null,
  printer_brand: null,
  printer_ip: null,
  printer_port: null,
  created_at: "2026-01-04T08:00:00Z",
  updated_at: NOW_ISO,
}));

const COMPARISON_BRANCHES: BranchComparison[] = BRANCH_SEEDS.map((b) => ({
  branch_id: b.id,
  branch_name: b.name,
  total_revenue: b.revenue,
  total_orders: b.orders,
  voided_orders: b.voided,
  avg_order_value: Math.round(b.revenue / b.orders),
  void_rate_pct: Math.round((b.voided / b.orders) * 1000) / 10,
  revenue_by_method: methodSplit(b.revenue),
}));

export const MOCK_COMPARISON: OrgComparisonReport = {
  org_id: MOCK_ORG_ID,
  from: "2026-05-18",
  to: "2026-06-16",
  branches: COMPARISON_BRANCHES,
};

/** 30 daily points with weekly seasonality + a gentle upward trend (deterministic). */
export const MOCK_TIMESERIES: TimeseriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 4, 18) + i * 86_400_000);
  const dow = date.getUTCDay(); // 0 Sun .. 6 Sat
  const weekend = dow === 5 || dow === 6 ? 1.22 : dow === 4 ? 1.1 : 1; // Thu/Fri/Sat busier
  const trend = 1 + i * 0.006;
  const wobble = 1 + 0.06 * Math.sin(i * 1.1);
  const revenue = Math.round(495_000 * weekend * trend * wobble);
  const orders = Math.round(revenue / 7_850);
  return {
    period: date.toISOString().slice(0, 10),
    revenue,
    orders,
    voided: Math.max(0, Math.round(orders * 0.018)),
    discount: Math.round(revenue * 0.04),
    tax: Math.round(revenue * 0.14),
    revenue_by_method: {},
  };
});

// Typical café pattern: morning rush, lunch dip, afternoon pick-up, quiet night.
const PEAK_WEIGHTS = [0,0,0,0,0,0.02,0.04,0.12,0.18,0.15,0.1,0.08,0.14,0.1,0.08,0.12,0.11,0.09,0.07,0.05,0.03,0.02,0.01,0];
const MOCK_DEMO_DAYS = 30;
const _ph_raw = PEAK_WEIGHTS.map((w) => {
  const revenue = Math.round(w * 14_500_000);
  return { revenue, orders: Math.round(revenue / 7_850) };
});
const _ph_total_rev = _ph_raw.reduce((s, r) => s + r.revenue, 0);
const _ph_total_ord = _ph_raw.reduce((s, r) => s + r.orders, 0);
export const MOCK_PEAK_HOURS: PeakHourPoint[] = _ph_raw.map((r, hour) => ({
  hour,
  revenue: r.revenue,
  orders: r.orders,
  voided: Math.round(r.orders * 0.018),
  discount: Math.round(r.revenue * 0.04),
  tax: Math.round(r.revenue * 0.14),
  avg_revenue_per_day: Math.round(r.revenue / MOCK_DEMO_DAYS),
  avg_orders_per_day: r.orders / MOCK_DEMO_DAYS,
  revenue_pct: _ph_total_rev > 0 ? Math.round(r.revenue / _ph_total_rev * 1000) / 10 : 0,
  orders_pct: _ph_total_ord > 0 ? Math.round(r.orders / _ph_total_ord * 1000) / 10 : 0,
}));

// Top sellers + sales-by-category for the analytics overview tab + leaderboards.
const TOP_ITEMS = [
  { menu_item_id: "mi_latte", item_name: "Latte", item_name_translations: { ar: "لاتيه" }, quantity_sold: 142, revenue: 852_000 },
  { menu_item_id: "mi_frappuccino", item_name: "Frappuccino", item_name_translations: { ar: "فرابيتشينو" }, quantity_sold: 67, revenue: 569_500 },
  { menu_item_id: "mi_cheesecake", item_name: "Cheesecake", item_name_translations: { ar: "تشيز كيك" }, quantity_sold: 62, revenue: 558_000 },
  { menu_item_id: "mi_cappuccino", item_name: "Cappuccino", item_name_translations: { ar: "كابوتشينو" }, quantity_sold: 98, revenue: 539_000 },
  { menu_item_id: "mi_americano", item_name: "Americano", item_name_translations: { ar: "أمريكانو" }, quantity_sold: 89, revenue: 400_500 },
  { menu_item_id: "mi_flatwhite", item_name: "Flat White", item_name_translations: { ar: "فلات وايت" }, quantity_sold: 54, revenue: 351_000 },
  { menu_item_id: "mi_matcha", item_name: "Matcha Latte", item_name_translations: { ar: "ماتشا لاتيه" }, quantity_sold: 34, revenue: 255_000 },
];

const CATEGORY_SALES = [
  {
    category_id: "cat_hot", category_name: "Hot Drinks", category_name_translations: { ar: "مشروبات ساخنة" },
    item_count: 6, quantity_sold: 487, revenue: 3_182_500,
    items: TOP_ITEMS.filter((i) => ["mi_latte", "mi_cappuccino", "mi_americano", "mi_flatwhite", "mi_matcha"].includes(i.menu_item_id)),
  },
  {
    category_id: "cat_cold", category_name: "Cold Drinks", category_name_translations: { ar: "مشروبات باردة" },
    item_count: 4, quantity_sold: 198, revenue: 1_079_500,
    items: TOP_ITEMS.filter((i) => i.menu_item_id === "mi_frappuccino"),
  },
  {
    category_id: "cat_food", category_name: "Food", category_name_translations: { ar: "أكل" },
    item_count: 2, quantity_sold: 98, revenue: 558_000,
    items: TOP_ITEMS.filter((i) => i.menu_item_id === "mi_cheesecake"),
  },
];

/** Single-branch report (used when a branch is selected in the scope bar). */
export const MOCK_BRANCH_SALES: BranchSalesReport = {
  branch_id: "br_zamalek",
  branch_name: "Zamalek",
  total_revenue: 4_820_000,
  total_orders: 612,
  voided_orders: 14,
  subtotal: 4_228_070,
  total_tax: 591_930,
  total_discount: 192_800,
  revenue_by_method: methodSplit(4_820_000),
  by_category: CATEGORY_SALES,
  top_items: TOP_ITEMS,
  from: "2026-05-18",
  to: "2026-06-16",
};

export const MOCK_PERMISSIONS = { permissions: [] as Array<{ resource: string; action: string; granted: boolean }> };

const deliveryChannel = (channel: string, orders: number, revenue: number, fees: number, cancelled: number) => ({
  channel,
  orders,
  revenue,
  delivery_fees: fees,
  avg_order_value: orders ? Math.round(revenue / orders) : 0,
  cancelled_orders: cancelled,
});

const DELIVERY_CHANNELS = [
  deliveryChannel("in_mall", 312, 2_180_000, 156_000, 8),
  deliveryChannel("outside", 244, 1_940_000, 244_000, 11),
];

export const MOCK_DELIVERY_SALES: DeliverySalesReport = {
  from: "2026-05-18",
  to: "2026-06-16",
  total_orders: DELIVERY_CHANNELS.reduce((s, c) => s + c.orders, 0),
  total_revenue: DELIVERY_CHANNELS.reduce((s, c) => s + c.revenue, 0),
  total_delivery_fees: DELIVERY_CHANNELS.reduce((s, c) => s + c.delivery_fees, 0),
  cancelled_orders: DELIVERY_CHANNELS.reduce((s, c) => s + c.cancelled_orders, 0),
  avg_order_value: Math.round(
    DELIVERY_CHANNELS.reduce((s, c) => s + c.revenue, 0) /
      DELIVERY_CHANNELS.reduce((s, c) => s + c.orders, 0),
  ),
  channels: DELIVERY_CHANNELS,
};

// ── Menu ─────────────────────────────────────────────────────────────────────

export const MOCK_CATEGORIES = [
  { id: "cat_hot", org_id: MOCK_ORG_ID, name: "Hot Drinks", name_translations: { ar: "مشروبات ساخنة" }, image_url: null, display_order: 1, is_active: true },
  { id: "cat_cold", org_id: MOCK_ORG_ID, name: "Cold Drinks", name_translations: { ar: "مشروبات باردة" }, image_url: null, display_order: 2, is_active: true },
  { id: "cat_food", org_id: MOCK_ORG_ID, name: "Food", name_translations: { ar: "أكل" }, image_url: null, display_order: 3, is_active: true },
];

const ITEM_SEEDS = [
  { id: "mi_espresso", name: "Espresso", name_ar: "إسبريسو", cat: "cat_hot", price: 3_500 },
  { id: "mi_cappuccino", name: "Cappuccino", name_ar: "كابوتشينو", cat: "cat_hot", price: 5_500 },
  { id: "mi_latte", name: "Latte", name_ar: "لاتيه", cat: "cat_hot", price: 6_000 },
  { id: "mi_americano", name: "Americano", name_ar: "أمريكانو", cat: "cat_hot", price: 4_500 },
  { id: "mi_flatwhite", name: "Flat White", name_ar: "فلات وايت", cat: "cat_hot", price: 6_500 },
  { id: "mi_matcha", name: "Matcha Latte", name_ar: "ماتشا لاتيه", cat: "cat_hot", price: 7_500 },
  { id: "mi_coldbrew", name: "Cold Brew", name_ar: "كولد برو", cat: "cat_cold", price: 7_000 },
  { id: "mi_icedlatte", name: "Iced Latte", name_ar: "لاتيه مثلج", cat: "cat_cold", price: 6_500 },
  { id: "mi_icedmatcha", name: "Iced Matcha", name_ar: "ماتشا مثلجة", cat: "cat_cold", price: 8_000 },
  { id: "mi_frappuccino", name: "Frappuccino", name_ar: "فرابيتشينو", cat: "cat_cold", price: 8_500 },
  { id: "mi_croissant", name: "Croissant", name_ar: "كرواسان", cat: "cat_food", price: 4_500 },
  { id: "mi_cheesecake", name: "Cheesecake", name_ar: "تشيز كيك", cat: "cat_food", price: 9_000 },
];

export const MOCK_MENU_ITEMS = ITEM_SEEDS.map((s) => ({
  id: s.id,
  org_id: MOCK_ORG_ID,
  name: s.name,
  name_translations: { ar: s.name_ar },
  description: null,
  description_translations: {},
  base_price: s.price,
  category_id: s.cat,
  image_url: null,
  is_active: true,
  sizes: [],
  recipes: [],
  sku_costs: [],
}));

export const MOCK_MENU_CATALOG = {
  data: MOCK_MENU_ITEMS,
  total: MOCK_MENU_ITEMS.length,
  page: 1,
  per_page: 24,
  total_pages: 1,
};

export const MOCK_ADDON_ITEMS = [
  { id: "ai_oatmilk", org_id: MOCK_ORG_ID, name: "Oat Milk", name_translations: { ar: "حليب الشوفان" }, addon_type: "milk", default_price: 1_500, is_active: true },
  { id: "ai_almondmilk", org_id: MOCK_ORG_ID, name: "Almond Milk", name_translations: { ar: "حليب اللوز" }, addon_type: "milk", default_price: 1_500, is_active: true },
  { id: "ai_extrahot", org_id: MOCK_ORG_ID, name: "Extra Hot", name_translations: { ar: "حار جداً" }, addon_type: "temperature", default_price: 0, is_active: true },
  { id: "ai_vanilla", org_id: MOCK_ORG_ID, name: "Vanilla Syrup", name_translations: { ar: "شراب الفانيليا" }, addon_type: "syrup", default_price: 1_000, is_active: true },
  { id: "ai_caramel", org_id: MOCK_ORG_ID, name: "Caramel Syrup", name_translations: { ar: "شراب الكراميل" }, addon_type: "syrup", default_price: 1_000, is_active: true },
  { id: "ai_hazelnut", org_id: MOCK_ORG_ID, name: "Hazelnut Syrup", name_translations: { ar: "شراب البندق" }, addon_type: "syrup", default_price: 1_000, is_active: true },
  { id: "ai_extrashot", org_id: MOCK_ORG_ID, name: "Extra Shot", name_translations: { ar: "شوت إضافي" }, addon_type: "shot", default_price: 2_000, is_active: true },
];

// ── Public ordering menu (delivery shape) ─────────────────────────────────────
// The customer-facing menu the public ordering app fetches. Items are shaped as
// DeliveryMenuItem (price/sizes/allowed_addon_ids) and addons as the global
// DeliveryAddonOption catalog, so the menu, the item customizer (sizes + add-ons)
// and the cart all render with real data.

const ITEM_DESCRIPTIONS: Record<string, { en: string; ar: string }> = {
  mi_espresso: { en: "A short, intense single origin shot.", ar: "شوت مركّز من حبوب أحادية المصدر." },
  mi_cappuccino: { en: "Espresso, steamed milk and a velvet foam cap.", ar: "إسبريسو وحليب مبخّر ورغوة ناعمة." },
  mi_latte: { en: "Smooth espresso with silky steamed milk.", ar: "إسبريسو ناعم مع حليب مبخّر حريري." },
  mi_americano: { en: "Espresso lengthened with hot water.", ar: "إسبريسو ممدود بالماء الساخن." },
  mi_flatwhite: { en: "Double ristretto under thin micro-foam.", ar: "ريستريتو مزدوج تحت رغوة رفيعة." },
  mi_matcha: { en: "Stone-ground matcha whisked with milk.", ar: "ماتشا مطحونة مخفوقة بالحليب." },
  mi_coldbrew: { en: "Steeped 18 hours, smooth and low-acid.", ar: "منقوع ١٨ ساعة، ناعم وقليل الحموضة." },
  mi_icedlatte: { en: "Espresso over cold milk and ice.", ar: "إسبريسو فوق حليب بارد وثلج." },
  mi_icedmatcha: { en: "Iced matcha over chilled milk.", ar: "ماتشا مثلجة فوق حليب بارد." },
  mi_frappuccino: { en: "Blended iced coffee, lightly sweet.", ar: "قهوة مثلجة مخفوقة، حلاوة خفيفة." },
  mi_croissant: { en: "All-butter, baked fresh each morning.", ar: "بالزبدة، يُخبز طازجًا كل صباح." },
  mi_cheesecake: { en: "New York style, dense and creamy.", ar: "على الطريقة النيويوركية، كثيف وكريمي." },
};

const DELIVERY_ADDONS = [
  { addon_item_id: "ai_oatmilk", is_available: true, name: "Oat Milk", name_translations: { ar: "حليب الشوفان" }, price: 1_500, type: "milk_type" },
  { addon_item_id: "ai_almondmilk", is_available: true, name: "Almond Milk", name_translations: { ar: "حليب اللوز" }, price: 1_500, type: "milk_type" },
  { addon_item_id: "ai_extrashot", is_available: true, name: "Extra Shot", name_translations: { ar: "شوت إضافي" }, price: 2_000, type: "coffee_type" },
  { addon_item_id: "ai_vanilla", is_available: true, name: "Vanilla Syrup", name_translations: { ar: "شراب الفانيليا" }, price: 1_000, type: "extra" },
  { addon_item_id: "ai_caramel", is_available: true, name: "Caramel Syrup", name_translations: { ar: "شراب الكراميل" }, price: 1_000, type: "extra" },
  { addon_item_id: "ai_hazelnut", is_available: true, name: "Hazelnut Syrup", name_translations: { ar: "شراب البندق" }, price: 1_000, type: "extra" },
];

const DRINK_ADDONS = DELIVERY_ADDONS.map((a) => a.addon_item_id);

const DELIVERY_MENU_ITEMS = MOCK_MENU_ITEMS.map((m) => {
  const isDrink = m.category_id === "cat_hot" || m.category_id === "cat_cold";
  return {
    id: m.id,
    name: m.name,
    name_translations: m.name_translations,
    description: ITEM_DESCRIPTIONS[m.id]?.en ?? null,
    description_translations: { ar: ITEM_DESCRIPTIONS[m.id]?.ar ?? "" },
    image_url: null,
    category_id: m.category_id,
    price: m.base_price,
    sizes: isDrink
      ? [
          { label: "Small", price: Math.max(0, m.base_price - 1_000) },
          { label: "Medium", price: m.base_price },
          { label: "Large", price: m.base_price + 1_500 },
        ]
      : [],
    allowed_addon_ids: isDrink ? DRINK_ADDONS : [],
    default_milk_addon_id: null,
    optionals: [],
  };
});

export const MOCK_PUBLIC_MENU = {
  categories: MOCK_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    name_translations: c.name_translations,
    image_url: null,
    items: DELIVERY_MENU_ITEMS.filter((i) => i.category_id === c.id),
  })),
  items: DELIVERY_MENU_ITEMS,
  addons: DELIVERY_ADDONS,
  discount: null,
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const MOCK_ORDER_SUMMARY: OrderSummary = {
  revenue: 16_600_000,
  completed: 2215,
  voided: 46,
  discounts: 640_000,
  tips: 0,
  delivery_fees: 400_000,
  delivery_orders: 556,
  delivery_revenue: 4_120_000,
  in_mall_orders: 312,
  in_mall_revenue: 2_180_000,
  in_mall_fees: 156_000,
  outside_orders: 244,
  outside_revenue: 1_940_000,
  outside_fees: 244_000,
};

interface OrderSeed {
  ref: string;
  num: number;
  teller: string;
  status: "completed" | "voided";
  method: string;
  type: "dine_in" | "delivery";
  channel?: "in_mall" | "outside";
  total: number;
  minsAgo: number;
}

const ORDER_SEEDS: OrderSeed[] = [
  { ref: "ZM-260616-0042", num: 42, teller: "Mona Adel", status: "completed", method: "cash", type: "dine_in", total: 14_500, minsAgo: 6 },
  { ref: "ZM-260616-0041", num: 41, teller: "Karim Saleh", status: "completed", method: "card", type: "delivery", channel: "outside", total: 21_900, minsAgo: 18 },
  { ref: "ZM-260616-0040", num: 40, teller: "Mona Adel", status: "completed", method: "talabat_online", type: "delivery", channel: "in_mall", total: 18_750, minsAgo: 35 },
  { ref: "ZM-260616-0039", num: 39, teller: "Youssef Nabil", status: "voided", method: "cash", type: "dine_in", total: 9_200, minsAgo: 52 },
  { ref: "ZM-260616-0038", num: 38, teller: "Karim Saleh", status: "completed", method: "digital_wallet", type: "dine_in", total: 27_300, minsAgo: 74 },
  { ref: "ZM-260616-0037", num: 37, teller: "Mona Adel", status: "completed", method: "talabat_cash", type: "delivery", channel: "outside", total: 16_400, minsAgo: 96 },
  { ref: "ZM-260616-0036", num: 36, teller: "Youssef Nabil", status: "completed", method: "card", type: "dine_in", total: 11_850, minsAgo: 121 },
  { ref: "ZM-260616-0035", num: 35, teller: "Karim Saleh", status: "completed", method: "cash", type: "dine_in", total: 8_600, minsAgo: 158 },
];

const BASE_MS = Date.UTC(2026, 5, 16, 9, 24, 0);

export const MOCK_ORDERS = ORDER_SEEDS.map((o) => {
  const subtotal = Math.round(o.total / 1.14);
  const tax = o.total - subtotal;
  const created = new Date(BASE_MS - o.minsAgo * 60_000).toISOString();
  return {
    id: `ord_${o.num}`,
    branch_id: "br_zamalek",
    shift_id: "shift_demo",
    teller_id: `tel_${o.teller.split(" ")[0].toLowerCase()}`,
    teller_name: o.teller,
    order_number: o.num,
    order_ref: o.ref,
    status: o.status,
    payment_method: o.method,
    order_type: o.type,
    delivery_channel: o.channel ?? null,
    delivery_fee: o.type === "delivery" ? 2_000 : 0,
    subtotal,
    tax_amount: tax,
    discount_amount: 0,
    discount_value: 0,
    total_amount: o.total,
    created_at: created,
    updated_at: created,
  } as unknown as Order;
});

export const MOCK_ORDERS_PAGE: PaginatedOrders = {
  data: MOCK_ORDERS,
  total: 2215,
  page: 1,
  per_page: 20,
  total_pages: 111,
  summary: MOCK_ORDER_SUMMARY,
};

// ── Inventory ─────────────────────────────────────────────────────────────────

/**
 * Ingredient catalog (OrgIngredient[]). `category` resolves to a readable label
 * via the existing `inventory.catalog.cat_*` i18n keys — only "general", "milk"
 * and "coffee_bean" have translations, so we stick to those three (Milk, Coffee
 * bean, General) rather than inventing keys the bundle can't translate.
 */
export const MOCK_INGREDIENT_CATALOG = [
  { id: "ing_milk", org_id: MOCK_ORG_ID, name: "Whole Milk", name_translations: { ar: "حليب كامل الدسم" }, category: "milk", unit: "l", cost_per_unit: 1_800, density_g_per_ml: null, pack_size: 12, pack_unit: "case", yield_pct: null, low_stock_level: 10, reorder_threshold: 10, supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_coffee", org_id: MOCK_ORG_ID, name: "Espresso Beans", name_translations: { ar: "حبوب إسبريسو" }, category: "coffee_bean", unit: "kg", cost_per_unit: 45_000, density_g_per_ml: null, pack_size: 6, pack_unit: "case", yield_pct: null, low_stock_level: 2, reorder_threshold: 2, supplier_id: "sup_coffee", supplier_name: "Premium Roasters", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_cream", org_id: MOCK_ORG_ID, name: "Heavy Cream", name_translations: { ar: "كريمة ثقيلة" }, category: "milk", unit: "l", cost_per_unit: 3_200, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 5, reorder_threshold: 5, supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_oatmilk", org_id: MOCK_ORG_ID, name: "Oat Milk", name_translations: { ar: "حليب الشوفان" }, category: "milk", unit: "l", cost_per_unit: 4_500, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 4, reorder_threshold: 4, supplier_id: null, supplier_name: null, description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_sugar", org_id: MOCK_ORG_ID, name: "Sugar", name_translations: { ar: "سكر" }, category: "general", unit: "kg", cost_per_unit: 800, density_g_per_ml: null, pack_size: 25, pack_unit: "sack", yield_pct: null, low_stock_level: 5, reorder_threshold: 5, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_vanilla", org_id: MOCK_ORG_ID, name: "Vanilla Syrup", name_translations: { ar: "شراب الفانيليا" }, category: "general", unit: "l", cost_per_unit: 12_000, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 2, reorder_threshold: 2, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_caramel", org_id: MOCK_ORG_ID, name: "Caramel Syrup", name_translations: { ar: "شراب الكراميل" }, category: "general", unit: "l", cost_per_unit: 11_500, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 2, reorder_threshold: 2, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_cocoa", org_id: MOCK_ORG_ID, name: "Cocoa Powder", name_translations: { ar: "مسحوق الكاكاو" }, category: "general", unit: "kg", cost_per_unit: 9_500, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 1, reorder_threshold: 1, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "ing_matcha", org_id: MOCK_ORG_ID, name: "Matcha Powder", name_translations: { ar: "مسحوق الماتشا" }, category: "general", unit: "kg", cost_per_unit: 85_000, density_g_per_ml: null, pack_size: null, pack_unit: null, yield_pct: null, low_stock_level: 0.5, reorder_threshold: 0.5, supplier_id: null, supplier_name: null, description: null, is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
];

/** On-hand quantity per ingredient (deterministic), keyed by org_ingredient_id. */
const STOCK_LEVELS: Record<string, number> = {
  ing_milk: 8, ing_coffee: 14.5, ing_cream: 6.2, ing_oatmilk: 3, ing_sugar: 22,
  ing_vanilla: 1.4, ing_caramel: 5.1, ing_cocoa: 2.3, ing_matcha: 0.35,
};

/** BranchInventoryItem[] — on-hand stock for a single branch. */
export const MOCK_BRANCH_STOCK = MOCK_INGREDIENT_CATALOG.map((ing) => {
  const stock = STOCK_LEVELS[ing.id] ?? 0;
  const reorder = ing.reorder_threshold;
  return {
    id: `bii_${ing.id}`,
    branch_id: "br_zamalek",
    org_ingredient_id: ing.id,
    ingredient_name: ing.name,
    description: null,
    unit: ing.unit,
    current_stock: stock,
    cost_per_unit: ing.cost_per_unit,
    reorder_threshold: reorder,
    par_min: reorder,
    par_max: reorder * 4,
    below_reorder: stock <= reorder,
    last_counted_at: "2026-06-15T19:30:00Z",
    created_at: "2026-01-04T08:00:00Z",
    updated_at: NOW_ISO,
  };
});

/** InventoryValuationReport — value = current_stock × cost_per_unit (piastres). */
const VALUATION_ITEMS = MOCK_INGREDIENT_CATALOG.map((ing) => {
  const stock = STOCK_LEVELS[ing.id] ?? 0;
  const value = ing.cost_per_unit != null ? Math.round(stock * ing.cost_per_unit) : null;
  return { org_ingredient_id: ing.id, ingredient_name: ing.name, unit: ing.unit, current_stock: stock, cost_per_unit: ing.cost_per_unit, value };
});

export const MOCK_INVENTORY_VALUATION = {
  total_value: VALUATION_ITEMS.reduce((s, i) => s + (i.value ?? 0), 0),
  unknown_cost_count: 0,
  items: VALUATION_ITEMS,
};

/** Low-stock alert rows: the branch items at/under their reorder point. */
export const MOCK_LOW_STOCK = MOCK_BRANCH_STOCK.filter((i) => i.below_reorder);

/** ConsumptionRow[] — ingredient usage over the period (org roll-up). */
export const MOCK_CONSUMPTION = [
  { org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", consumed_qty: 218.4, consumed_value: 393_120 },
  { org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", unit: "kg", consumed_qty: 31.6, consumed_value: 1_422_000 },
  { org_ingredient_id: "ing_cream", ingredient_name: "Heavy Cream", unit: "l", consumed_qty: 24.8, consumed_value: 79_360 },
  { org_ingredient_id: "ing_oatmilk", ingredient_name: "Oat Milk", unit: "l", consumed_qty: 18.5, consumed_value: 83_250 },
  { org_ingredient_id: "ing_sugar", ingredient_name: "Sugar", unit: "kg", consumed_qty: 41.2, consumed_value: 32_960 },
  { org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", unit: "l", consumed_qty: 6.4, consumed_value: 76_800 },
  { org_ingredient_id: "ing_caramel", ingredient_name: "Caramel Syrup", unit: "l", consumed_qty: 4.1, consumed_value: 47_150 },
  { org_ingredient_id: "ing_matcha", ingredient_name: "Matcha Powder", unit: "kg", consumed_qty: 1.18, consumed_value: 100_300 },
];

/** ShrinkageRow[] — losses surfaced by finalized counts. */
export const MOCK_SHRINKAGE = [
  { org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", reason: "spoilage", shrinkage_qty: 4.5, shrinkage_value: 8_100 },
  { org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", unit: "kg", reason: "miscount", shrinkage_qty: 0.8, shrinkage_value: 36_000 },
  { org_ingredient_id: "ing_cream", ingredient_name: "Heavy Cream", unit: "l", reason: "breakage", shrinkage_qty: 1.2, shrinkage_value: 3_840 },
  { org_ingredient_id: "ing_matcha", ingredient_name: "Matcha Powder", unit: "kg", reason: "theft", shrinkage_qty: 0.05, shrinkage_value: 4_250 },
];

/** WasteReportRow[] — logged waste over the period. */
export const MOCK_WASTE = [
  { org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", reason: "expired", waste_qty: 3.0, waste_value: 5_400 },
  { org_ingredient_id: "ing_cream", ingredient_name: "Heavy Cream", unit: "l", reason: "spoiled", waste_qty: 0.9, waste_value: 2_880 },
  { org_ingredient_id: "ing_oatmilk", ingredient_name: "Oat Milk", unit: "l", reason: "damaged", waste_qty: 1.0, waste_value: 4_500 },
  { org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", unit: "l", reason: "overproduction", waste_qty: 0.3, waste_value: 3_600 },
];

export const MOCK_SUPPLIERS = [
  { id: "sup_dairy", org_id: MOCK_ORG_ID, name: "Cairo Dairy Co.", contact_name: "Ahmed Hassan", email: "ahmed@cairodairy.eg", phone: "+20 2 1234 5678", is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "sup_coffee", org_id: MOCK_ORG_ID, name: "Premium Roasters", contact_name: "Sara Nour", email: "orders@premiumroasters.eg", phone: "+20 100 987 6543", is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "sup_dry", org_id: MOCK_ORG_ID, name: "Dry Goods Dist.", contact_name: "Omar Fathy", email: "sales@drygoods.eg", phone: "+20 2 2468 1357", is_active: true, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
  { id: "sup_pkg", org_id: MOCK_ORG_ID, name: "Pack & Cup Supplies", contact_name: "Lena Adib", email: "hello@packcup.eg", phone: "+20 100 222 4488", is_active: false, created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO },
];

/**
 * Purchase orders (PurchaseOrder[]). Mix of statuses; the page makes the
 * "ordered" / "partially_received" / "draft" POs receive-able (a Receive button
 * is shown), and shows coloured status badges for received/cancelled.
 */
export const MOCK_PURCHASE_ORDERS = [
  { id: "po_2041", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", branch_name: "Zamalek", supplier_id: "sup_coffee", supplier_name: "Premium Roasters", status: "ordered", reference: "PO-2041", note: "Monthly bean restock", expected_at: "2026-06-19T08:00:00Z", received_at: null, received_by: null, created_by: "Shawket Ibrahim", created_at: "2026-06-14T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
  { id: "po_2040", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", branch_name: "Zamalek", supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", status: "partially_received", reference: "PO-2040", note: null, expected_at: "2026-06-16T07:00:00Z", received_at: null, received_by: null, created_by: "Mona Adel", created_at: "2026-06-12T10:30:00Z", updated_at: "2026-06-15T11:00:00Z" },
  { id: "po_2039", org_id: MOCK_ORG_ID, branch_id: "br_newcairo", branch_name: "New Cairo", supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", status: "draft", reference: "PO-2039", note: "Awaiting approval", expected_at: null, received_at: null, received_by: null, created_by: "Karim Saleh", created_at: "2026-06-15T14:20:00Z", updated_at: "2026-06-15T14:20:00Z" },
  { id: "po_2038", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", branch_name: "Zamalek", supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", status: "received", reference: "PO-2038", note: null, expected_at: "2026-06-08T07:00:00Z", received_at: "2026-06-08T08:12:00Z", received_by: "Mona Adel", created_by: "Mona Adel", created_at: "2026-06-05T09:00:00Z", updated_at: "2026-06-08T08:12:00Z" },
  { id: "po_2037", org_id: MOCK_ORG_ID, branch_id: "br_maadi", branch_name: "Maadi", supplier_id: "sup_coffee", supplier_name: "Premium Roasters", status: "cancelled", reference: "PO-2037", note: "Duplicate order", expected_at: null, received_at: null, received_by: null, created_by: "Youssef Nabil", created_at: "2026-06-03T12:00:00Z", updated_at: "2026-06-04T09:30:00Z" },
];

/** Line items per PO id (PurchaseOrderFull = PurchaseOrder + lines[]). */
export const MOCK_PO_LINES: Record<string, Array<Record<string, unknown>>> = {
  po_2041: [
    { id: "pol_1", purchase_order_id: "po_2041", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", unit: "kg", purchase_unit: "case", units_per_purchase_unit: 6, quantity_ordered: 4, quantity_received: 0, unit_cost: 270_000 },
  ],
  po_2040: [
    { id: "pol_2", purchase_order_id: "po_2040", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", purchase_unit: "case", units_per_purchase_unit: 12, quantity_ordered: 6, quantity_received: 4, unit_cost: 21_600 },
    { id: "pol_3", purchase_order_id: "po_2040", org_ingredient_id: "ing_cream", ingredient_name: "Heavy Cream", unit: "l", purchase_unit: "l", units_per_purchase_unit: 1, quantity_ordered: 12, quantity_received: 12, unit_cost: 3_200 },
  ],
  po_2039: [
    { id: "pol_4", purchase_order_id: "po_2039", org_ingredient_id: "ing_sugar", ingredient_name: "Sugar", unit: "kg", purchase_unit: "sack", units_per_purchase_unit: 25, quantity_ordered: 2, quantity_received: 0, unit_cost: 20_000 },
    { id: "pol_5", purchase_order_id: "po_2039", org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", unit: "l", purchase_unit: "l", units_per_purchase_unit: 1, quantity_ordered: 4, quantity_received: 0, unit_cost: 12_000 },
  ],
  po_2038: [
    { id: "pol_6", purchase_order_id: "po_2038", org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", purchase_unit: "case", units_per_purchase_unit: 12, quantity_ordered: 8, quantity_received: 8, unit_cost: 21_600 },
  ],
  po_2037: [
    { id: "pol_7", purchase_order_id: "po_2037", org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", unit: "kg", purchase_unit: "case", units_per_purchase_unit: 6, quantity_ordered: 2, quantity_received: 0, unit_cost: 270_000 },
  ],
};

/** ReorderSuggestion[] — items at/under reorder, grouped by default supplier. */
export const MOCK_REORDER_SUGGESTIONS = [
  {
    supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.",
    lines: [
      { org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", current_stock: 8, suggested_qty: 32, unit: "l" },
    ],
  },
  {
    supplier_id: null, supplier_name: null,
    lines: [
      { org_ingredient_id: "ing_oatmilk", ingredient_name: "Oat Milk", current_stock: 3, suggested_qty: 13, unit: "l" },
      { org_ingredient_id: "ing_matcha", ingredient_name: "Matcha Powder", current_stock: 0.35, suggested_qty: 1.65, unit: "kg" },
    ],
  },
];

/**
 * Stocktakes (Stocktake[]). One finalized count drives the variance report; a
 * couple more give the history table some body. No open/in_progress count so
 * the "All branches" list reads cleanly (the editor only shows per-branch).
 */
export const MOCK_STOCKTAKES = [
  { id: "stk_0610", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", branch_name: "Zamalek", status: "finalized", note: "End-of-week full count", started_by: "usr_mona", started_by_name: "Mona Adel", finalized_by: "usr_mona", started_at: "2026-06-15T18:45:00Z", finalized_at: "2026-06-15T19:30:00Z", created_at: "2026-06-15T18:45:00Z" },
  { id: "stk_0608", org_id: MOCK_ORG_ID, branch_id: "br_newcairo", branch_name: "New Cairo", status: "finalized", note: null, started_by: "usr_karim", started_by_name: "Karim Saleh", finalized_by: "usr_karim", started_at: "2026-06-08T20:00:00Z", finalized_at: "2026-06-08T20:40:00Z", created_at: "2026-06-08T20:00:00Z" },
  { id: "stk_0601", org_id: MOCK_ORG_ID, branch_id: "br_maadi", branch_name: "Maadi", status: "finalized", note: "Coffee + dairy only", started_by: "usr_youssef", started_by_name: "Youssef Nabil", finalized_by: "usr_youssef", started_at: "2026-06-01T19:10:00Z", finalized_at: "2026-06-01T19:35:00Z", created_at: "2026-06-01T19:10:00Z" },
];

/** VarianceReport for the finalized Zamalek count (stk_0610). */
const VARIANCE_ROWS = [
  { org_ingredient_id: "ing_milk", ingredient_name: "Whole Milk", unit: "l", expected_qty: 12.5, counted_qty: 8.0, variance: -4.5, unit_cost: 1_800, variance_value: -8_100, variance_reason: "spoilage", is_flagged: true },
  { org_ingredient_id: "ing_coffee", ingredient_name: "Espresso Beans", unit: "kg", expected_qty: 15.3, counted_qty: 14.5, variance: -0.8, unit_cost: 45_000, variance_value: -36_000, variance_reason: "miscount", is_flagged: true },
  { org_ingredient_id: "ing_cream", ingredient_name: "Heavy Cream", unit: "l", expected_qty: 7.4, counted_qty: 6.2, variance: -1.2, unit_cost: 3_200, variance_value: -3_840, variance_reason: "breakage", is_flagged: true },
  { org_ingredient_id: "ing_sugar", ingredient_name: "Sugar", unit: "kg", expected_qty: 21.0, counted_qty: 22.0, variance: 1.0, unit_cost: 800, variance_value: 800, variance_reason: null, is_flagged: false },
  { org_ingredient_id: "ing_oatmilk", ingredient_name: "Oat Milk", unit: "l", expected_qty: 3.0, counted_qty: 3.0, variance: 0, unit_cost: 4_500, variance_value: 0, variance_reason: null, is_flagged: false },
  { org_ingredient_id: "ing_vanilla", ingredient_name: "Vanilla Syrup", unit: "l", expected_qty: 1.4, counted_qty: 1.4, variance: 0, unit_cost: 12_000, variance_value: 0, variance_reason: null, is_flagged: false },
  { org_ingredient_id: "ing_matcha", ingredient_name: "Matcha Powder", unit: "kg", expected_qty: 0.40, counted_qty: 0.35, variance: -0.05, unit_cost: 85_000, variance_value: -4_250, variance_reason: "theft", is_flagged: true },
];

export const MOCK_VARIANCE_REPORT = {
  stocktake_id: "stk_0610",
  rows: VARIANCE_ROWS,
  total_shrinkage_value: VARIANCE_ROWS.reduce((s, r) => s + (r.variance_value && r.variance_value < 0 ? -r.variance_value : 0), 0),
  total_overage_value: VARIANCE_ROWS.reduce((s, r) => s + (r.variance_value && r.variance_value > 0 ? r.variance_value : 0), 0),
  net_variance_value: VARIANCE_ROWS.reduce((s, r) => s + (r.variance_value ?? 0), 0),
  unknown_cost_count: 0,
  variance_threshold_pct: 5,
};

export const MOCK_INVENTORY_SETTINGS = { stocktake_variance_threshold_pct: 5 };

// ── Menu engineering (BCG matrix) ─────────────────────────────────────────────
// Per-item profit-vs-popularity rows spread across the four quadrants so the
// scatter and the table read well. `class`: star | workhorse | challenge | dog.

interface MeRowSeed {
  id: string; name: string; size: string; cat_id: string; cat: string;
  qty: number; price: number; unit_cost: number; cls: "star" | "workhorse" | "challenge" | "dog";
}

const ME_SEEDS: MeRowSeed[] = [
  { id: "mi_latte", name: "Latte", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 142, price: 6_000, unit_cost: 1_620, cls: "star" },
  { id: "mi_cappuccino", name: "Cappuccino", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 98, price: 5_500, unit_cost: 1_480, cls: "star" },
  { id: "mi_flatwhite", name: "Flat White", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 54, price: 6_500, unit_cost: 1_700, cls: "challenge" },
  { id: "mi_matcha", name: "Matcha Latte", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 34, price: 7_500, unit_cost: 3_100, cls: "challenge" },
  { id: "mi_americano", name: "Americano", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 89, price: 4_500, unit_cost: 760, cls: "workhorse" },
  { id: "mi_espresso", name: "Espresso", size: "one_size", cat_id: "cat_hot", cat: "Hot Drinks", qty: 76, price: 3_500, unit_cost: 740, cls: "workhorse" },
  { id: "mi_frappuccino", name: "Frappuccino", size: "one_size", cat_id: "cat_cold", cat: "Cold Drinks", qty: 67, price: 8_500, unit_cost: 2_900, cls: "star" },
  { id: "mi_icedlatte", name: "Iced Latte", size: "one_size", cat_id: "cat_cold", cat: "Cold Drinks", qty: 58, price: 6_500, unit_cost: 1_780, cls: "workhorse" },
  { id: "mi_coldbrew", name: "Cold Brew", size: "one_size", cat_id: "cat_cold", cat: "Cold Drinks", qty: 41, price: 7_000, unit_cost: 1_540, cls: "challenge" },
  { id: "mi_icedmatcha", name: "Iced Matcha", size: "one_size", cat_id: "cat_cold", cat: "Cold Drinks", qty: 22, price: 8_000, unit_cost: 3_250, cls: "dog" },
  { id: "mi_cheesecake", name: "Cheesecake", size: "one_size", cat_id: "cat_food", cat: "Food", qty: 62, price: 9_000, unit_cost: 3_400, cls: "star" },
  { id: "mi_croissant", name: "Croissant", size: "one_size", cat_id: "cat_food", cat: "Food", qty: 28, price: 4_500, unit_cost: 1_900, cls: "dog" },
];

const ME_TOTAL_QTY = ME_SEEDS.reduce((s, r) => s + r.qty, 0);

const ME_ROWS = ME_SEEDS.map((r) => {
  const sales = r.qty * r.price;
  const total_cost = r.qty * r.unit_cost;
  const total_profit = sales - total_cost;
  return {
    menu_item_id: r.id,
    item_name: r.name,
    size_label: r.size,
    category_id: r.cat_id,
    category_name: r.cat,
    class: r.cls,
    quantity_sold: r.qty,
    sales,
    total_cost,
    total_profit,
    item_profit: Math.round(total_profit / r.qty),
    popularity_pct: Math.round((r.qty / ME_TOTAL_QTY) * 10000) / 10000,
    popularity_category: r.cls === "star" || r.cls === "workhorse" ? "high" : "low",
    profit_category: r.cls === "star" || r.cls === "challenge" ? "high" : "low",
    cost_missing_lines: 0,
  };
});

export const MOCK_MENU_ENGINEERING = {
  branch_id: ALL_BRANCHES_ID,
  cost_basis: "snapshot",
  from: "2026-05-18",
  to: "2026-06-16",
  rows: ME_ROWS,
  rows_cost_missing: 1,
  excluded_sales: 96_000,
  total_sales: ME_ROWS.reduce((s, r) => s + r.sales, 0),
  total_cost: ME_ROWS.reduce((s, r) => s + r.total_cost, 0),
  total_profit: ME_ROWS.reduce((s, r) => s + r.total_profit, 0),
};

// ── Analytics: item & addon sales, teller stats ───────────────────────────────

/** CombinedItemSalesRow[] — standalone + bundle quantities per item. */
export const MOCK_COMBINED_ITEM_SALES = [
  { item_id: "mi_latte", item_name: "Latte", item_name_translations: { ar: "لاتيه" }, standalone_qty: 142, bundle_qty: 24, total_qty: 166 },
  { item_id: "mi_cappuccino", item_name: "Cappuccino", item_name_translations: { ar: "كابوتشينو" }, standalone_qty: 98, bundle_qty: 18, total_qty: 116 },
  { item_id: "mi_americano", item_name: "Americano", item_name_translations: { ar: "أمريكانو" }, standalone_qty: 89, bundle_qty: 7, total_qty: 96 },
  { item_id: "mi_espresso", item_name: "Espresso", item_name_translations: { ar: "إسبريسو" }, standalone_qty: 76, bundle_qty: 4, total_qty: 80 },
  { item_id: "mi_frappuccino", item_name: "Frappuccino", item_name_translations: { ar: "فرابيتشينو" }, standalone_qty: 67, bundle_qty: 9, total_qty: 76 },
  { item_id: "mi_cheesecake", item_name: "Cheesecake", item_name_translations: { ar: "تشيز كيك" }, standalone_qty: 62, bundle_qty: 31, total_qty: 93 },
  { item_id: "mi_icedlatte", item_name: "Iced Latte", item_name_translations: { ar: "لاتيه مثلج" }, standalone_qty: 58, bundle_qty: 12, total_qty: 70 },
  { item_id: "mi_flatwhite", item_name: "Flat White", item_name_translations: { ar: "فلات وايت" }, standalone_qty: 54, bundle_qty: 5, total_qty: 59 },
  { item_id: "mi_coldbrew", item_name: "Cold Brew", item_name_translations: { ar: "كولد برو" }, standalone_qty: 41, bundle_qty: 2, total_qty: 43 },
  { item_id: "mi_matcha", item_name: "Matcha Latte", item_name_translations: { ar: "ماتشا لاتيه" }, standalone_qty: 34, bundle_qty: 6, total_qty: 40 },
  { item_id: "mi_croissant", item_name: "Croissant", item_name_translations: { ar: "كرواسان" }, standalone_qty: 28, bundle_qty: 22, total_qty: 50 },
  { item_id: "mi_icedmatcha", item_name: "Iced Matcha", item_name_translations: { ar: "ماتشا مثلجة" }, standalone_qty: 22, bundle_qty: 3, total_qty: 25 },
];

/** AddonSalesRow[] — add-on attach volume + revenue (piastres). */
export const MOCK_ADDON_SALES = [
  { addon_item_id: "ai_extrashot", addon_name: "Extra Shot", addon_name_translations: { ar: "شوت إضافي" }, addon_type: "shot", quantity_sold: 184, revenue: 368_000 },
  { addon_item_id: "ai_oatmilk", addon_name: "Oat Milk", addon_name_translations: { ar: "حليب الشوفان" }, addon_type: "milk", quantity_sold: 121, revenue: 181_500 },
  { addon_item_id: "ai_vanilla", addon_name: "Vanilla Syrup", addon_name_translations: { ar: "شراب الفانيليا" }, addon_type: "syrup", quantity_sold: 96, revenue: 96_000 },
  { addon_item_id: "ai_caramel", addon_name: "Caramel Syrup", addon_name_translations: { ar: "شراب الكراميل" }, addon_type: "syrup", quantity_sold: 78, revenue: 78_000 },
  { addon_item_id: "ai_almondmilk", addon_name: "Almond Milk", addon_name_translations: { ar: "حليب اللوز" }, addon_type: "milk", quantity_sold: 64, revenue: 96_000 },
  { addon_item_id: "ai_hazelnut", addon_name: "Hazelnut Syrup", addon_name_translations: { ar: "شراب البندق" }, addon_type: "syrup", quantity_sold: 47, revenue: 47_000 },
];

/** TellerStats[] — per-teller revenue, orders, void rate, shifts. */
export const MOCK_TELLER_STATS = [
  { teller_id: "tel_mona", teller_name: "Mona Adel", orders: 248, revenue: 1_984_000, avg_order_value: 8_000, voided: 4, shifts: 22 },
  { teller_id: "tel_karim", teller_name: "Karim Saleh", orders: 213, revenue: 1_725_300, avg_order_value: 8_100, voided: 6, shifts: 20 },
  { teller_id: "tel_youssef", teller_name: "Youssef Nabil", orders: 167, revenue: 1_252_500, avg_order_value: 7_500, voided: 3, shifts: 18 },
  { teller_id: "tel_nour", teller_name: "Nour El-Sayed", orders: 134, revenue: 1_058_600, avg_order_value: 7_900, voided: 2, shifts: 15 },
  { teller_id: "tel_hossam", teller_name: "Hossam Ali", orders: 98, revenue: 740_900, avg_order_value: 7_560, voided: 5, shifts: 12 },
];

// ── Menu Advisor ──────────────────────────────────────────────────────────────
// `active` returns null (no run in progress); `latest` returns this completed
// run; its id drives the price / bundle / removal suggestion lists.

export const MOCK_ADVISOR_RUN = {
  id: "run_demo_001",
  org_id: MOCK_ORG_ID,
  branch_id: "br_zamalek",
  status: "completed",
  started_at: "2026-06-16T08:40:00Z",
  completed_at: "2026-06-16T08:41:12Z",
  error_message: null,
  window_days: 30,
  config: { analysis_window_days: 30, bundle_max_size: 3, target_food_cost_pct: 0.3 },
  mode_summary: { items_total: 12, items_cm_tracked: 9, items_revenue_only: 2, items_insufficient: 1 },
};

const itemKey = (menu_item_id: string, size_label = "one_size") => ({ menu_item_id, size_label });

export const MOCK_PRICE_SUGGESTIONS = [
  {
    id: "ps_1", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null,
    item_name: "Americano", key: itemKey("mi_americano"),
    action: "raise_price", confidence: "high",
    classification: { mode: "cm", quadrant: "plowhorse" },
    current_price: 4_500, effective_price: 4_500, suggested_price: 5_000, suggested_delta_abs: 500, suggested_delta_pct: 0.111,
    margin_pct: 0.83, food_cost_pct: 0.17, cm_per_unit: 3_740, popularity_share: 0.18,
    cost_missing: false, price_changed_in_window: false, units_sold_raw: 89,
    anchors: { status_quo: 4_500, peer_median: 5_200, cost_plus: 2_400 },
    cost_reduction_whatif_margin: null, peer_comparison: { median_effective_price_peers: 5_200, median_cm_per_unit_peers: 3_900, median_margin_pct_peers: 0.79, same_category_count: 5, your_position: "below" },
    guard_clips: [], explanation: "High-volume, very high-margin workhorse priced 13% under category peers. A small +0.50 EGP raise is well within the change cap and lifts contribution with negligible demand risk.",
  },
  {
    id: "ps_2", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null,
    item_name: "Iced Matcha", key: itemKey("mi_icedmatcha"),
    action: "lower_price", confidence: "medium",
    classification: { mode: "cm", quadrant: "dog" },
    current_price: 8_000, effective_price: 8_000, suggested_price: 7_000, suggested_delta_abs: -1_000, suggested_delta_pct: -0.125,
    margin_pct: 0.59, food_cost_pct: 0.41, cm_per_unit: 4_750, popularity_share: 0.04,
    cost_missing: false, price_changed_in_window: false, units_sold_raw: 22,
    anchors: { status_quo: 8_000, peer_median: 7_200, cost_plus: 4_600 },
    cost_reduction_whatif_margin: null, peer_comparison: { median_effective_price_peers: 7_200, median_cm_per_unit_peers: 4_100, median_margin_pct_peers: 0.6, same_category_count: 4, your_position: "above" },
    guard_clips: [], explanation: "Low-popularity, priced above peers. A modest cut to 70 EGP should recover lost units; the margin floor still holds at the lower price.",
  },
  {
    id: "ps_3", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null,
    item_name: "Flat White", key: itemKey("mi_flatwhite"),
    action: "raise_price", confidence: "medium",
    classification: { mode: "cm", quadrant: "puzzle" },
    current_price: 6_500, effective_price: 6_500, suggested_price: 7_000, suggested_delta_abs: 500, suggested_delta_pct: 0.077,
    margin_pct: 0.74, food_cost_pct: 0.26, cm_per_unit: 4_800, popularity_share: 0.11,
    cost_missing: false, price_changed_in_window: true, units_sold_raw: 54,
    anchors: { status_quo: 6_500, peer_median: 7_100, cost_plus: 2_600 },
    cost_reduction_whatif_margin: null, peer_comparison: { median_effective_price_peers: 7_100, median_cm_per_unit_peers: 5_000, median_margin_pct_peers: 0.72, same_category_count: 5, your_position: "below" },
    guard_clips: ["change_cap"], explanation: "Strong margin but under-priced versus peers. A capped +0.50 EGP nudge tests willingness-to-pay without spooking regulars.",
  },
];

export const MOCK_BUNDLE_SUGGESTIONS = [
  {
    id: "bs_1", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null, promoted_bundle_id: null,
    focus_item: itemKey("mi_latte"), bundle_items: [itemKey("mi_latte"), itemKey("mi_croissant")],
    bundle_list_price: 10_500, bundle_suggested_price: 9_500, bundle_discount_pct: 0.095,
    bundle_cost: 3_520, bundle_cm: 5_980, bundle_margin_pct: 0.63, missing_costs: false,
    association: { composite_score: 0.81, pair_lifts: [{ item_a: itemKey("mi_latte"), item_b: itemKey("mi_croissant"), lift: 2.4, support: 0.18, confidence_ab: 0.42 }] },
    forecast: { expected_velocity: { lo: 14, mid: 19, hi: 25 }, halo_units_x: 1.2, inside_bundle_units_x: 1.6, total_units_uplift_x: 1.8, incremental_cm: { lo: 1_100, mid: 1_700, hi: 2_300 } },
    guard_clips: [], explanation: "Latte and Croissant co-occur in 18% of morning baskets with a 2.4× lift. A 'Morning Set' at 95 EGP keeps a healthy 63% margin and should lift attach by ~1.8×.",
  },
  {
    id: "bs_2", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null, promoted_bundle_id: null,
    focus_item: itemKey("mi_frappuccino"), bundle_items: [itemKey("mi_frappuccino"), itemKey("mi_cheesecake")],
    bundle_list_price: 17_500, bundle_suggested_price: 15_500, bundle_discount_pct: 0.114,
    bundle_cost: 6_300, bundle_cm: 9_200, bundle_margin_pct: 0.59, missing_costs: false,
    association: { composite_score: 0.74, pair_lifts: [{ item_a: itemKey("mi_frappuccino"), item_b: itemKey("mi_cheesecake"), lift: 1.9, support: 0.12, confidence_ab: 0.36 }] },
    forecast: { expected_velocity: { lo: 8, mid: 12, hi: 17 }, halo_units_x: 1.1, inside_bundle_units_x: 1.4, total_units_uplift_x: 1.5, incremental_cm: { lo: 900, mid: 1_400, hi: 1_900 } },
    guard_clips: [], explanation: "Frappuccino and Cheesecake form a strong afternoon treat pairing. A 155 EGP combo discounts 11% while protecting a 59% margin.",
  },
];

export const MOCK_REMOVAL_SCENARIOS = [
  {
    id: "rs_1", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null,
    item_name: "Iced Matcha", key: itemKey("mi_icedmatcha"), recommendation: "keep_and_bundle",
    baseline_cm: 104_500, net_cm_change: -38_200, net_cm_change_lo: -52_000, net_cm_change_hi: -24_000,
    absorbed_by: [{ key: itemKey("mi_icedlatte"), absorbed_units: 9, absorbed_cm: 42_300 }],
    complementary_losses: [{ key: itemKey("mi_cheesecake"), lost_units: 3, lost_cm: 16_800 }],
    explanation: "Iced Matcha is a slow mover, but removing it would cost ~382 EGP/month in net contribution once complementary cheesecake pulls are accounted for. Keep it and try bundling instead.",
  },
  {
    id: "rs_2", run_id: "run_demo_001", branch_id: "br_zamalek", created_at: "2026-06-16T08:41:00Z", decision: null,
    item_name: "Croissant", key: itemKey("mi_croissant"), recommendation: "keep_and_reformulate",
    baseline_cm: 72_800, net_cm_change: -21_400, net_cm_change_lo: -30_000, net_cm_change_hi: -12_000,
    absorbed_by: [{ key: itemKey("mi_cheesecake"), absorbed_units: 6, absorbed_cm: 33_600 }],
    complementary_losses: [{ key: itemKey("mi_latte"), lost_units: 11, lost_cm: 48_180 }],
    explanation: "Croissant is a low-margin pastry, but it's a powerful basket anchor for Latte. Removing it would lose 214 EGP/month net. A cheaper recipe lifts margin without breaking the pairing.",
  },
];

// ── Bundles ────────────────────────────────────────────────────────────────────

interface BundleSeed {
  id: string; name: string; name_ar: string; desc: string; status: "active" | "draft" | "archived";
  price: number; components: Array<{ item_id: string; item_name: string; qty: number; price: number; cost: number }>;
}

const BUNDLE_SEEDS: BundleSeed[] = [
  {
    id: "bnd_morning", name: "Morning Set", name_ar: "وجبة الصباح", desc: "Latte + fresh croissant — the regular's go-to.", status: "active", price: 9_500,
    components: [
      { item_id: "mi_latte", item_name: "Latte", qty: 1, price: 6_000, cost: 1_620 },
      { item_id: "mi_croissant", item_name: "Croissant", qty: 1, price: 4_500, cost: 1_900 },
    ],
  },
  {
    id: "bnd_afternoon", name: "Afternoon Treat", name_ar: "حلوى العصر", desc: "Frappuccino + a slice of cheesecake.", status: "active", price: 15_500,
    components: [
      { item_id: "mi_frappuccino", item_name: "Frappuccino", qty: 1, price: 8_500, cost: 2_900 },
      { item_id: "mi_cheesecake", item_name: "Cheesecake", qty: 1, price: 9_000, cost: 3_400 },
    ],
  },
  {
    id: "bnd_duo", name: "Espresso Duo", name_ar: "ثنائي الإسبريسو", desc: "Two espressos for sharing.", status: "active", price: 6_000,
    components: [
      { item_id: "mi_espresso", item_name: "Espresso", qty: 2, price: 3_500, cost: 740 },
    ],
  },
  {
    id: "bnd_worker", name: "Remote Worker", name_ar: "العامل عن بُعد", desc: "Cold brew + cheesecake for a long session.", status: "draft", price: 14_000,
    components: [
      { item_id: "mi_coldbrew", item_name: "Cold Brew", qty: 1, price: 7_000, cost: 1_540 },
      { item_id: "mi_cheesecake", item_name: "Cheesecake", qty: 1, price: 9_000, cost: 3_400 },
    ],
  },
  {
    id: "bnd_winter", name: "Winter Warmer", name_ar: "دفء الشتاء", desc: "Seasonal cappuccino pairing (off-menu).", status: "archived", price: 10_000,
    components: [
      { item_id: "mi_cappuccino", item_name: "Cappuccino", qty: 1, price: 5_500, cost: 1_480 },
      { item_id: "mi_croissant", item_name: "Croissant", qty: 1, price: 4_500, cost: 1_900 },
    ],
  },
];

export const MOCK_BUNDLES = BUNDLE_SEEDS.map((b, idx) => ({
  id: b.id, org_id: MOCK_ORG_ID, name: b.name, name_translations: { ar: b.name_ar },
  description: b.desc, description_translations: { ar: b.desc }, image_url: null,
  price: b.price, status: b.status, created_by: "usr_demo_admin",
  available_from_date: null, available_from_time: null, available_until_date: null, available_until_time: null,
  created_at: `2026-0${idx < 4 ? "5" : "4"}-1${idx}T09:00:00Z`, updated_at: NOW_ISO,
  branch_ids: ["br_zamalek", "br_newcairo"],
  computed_cost: b.components.reduce((s, c) => s + c.cost * c.qty, 0),
  components: b.components.map((c, ci) => ({
    id: `${b.id}_c${ci}`, bundle_id: b.id, item_id: c.item_id, item_name: c.item_name,
    item_price: c.price, item_cost: c.cost, quantity: c.qty, position: ci,
  })),
}));

/** Per-bundle performance (BundlePerformanceResponse), keyed by bundle id. */
export const MOCK_BUNDLE_PERFORMANCE: Record<string, Record<string, unknown>> = {
  bnd_morning: { sales_volume: 312, gross_revenue: 2_964_000, net_profit: 1_865_600, component_popularity: [{ item_id: "mi_latte", item_name: "Latte", quantity_sold: 312 }, { item_id: "mi_croissant", item_name: "Croissant", quantity_sold: 312 }] },
  bnd_afternoon: { sales_volume: 188, gross_revenue: 2_914_000, net_profit: 1_729_600, component_popularity: [{ item_id: "mi_frappuccino", item_name: "Frappuccino", quantity_sold: 188 }, { item_id: "mi_cheesecake", item_name: "Cheesecake", quantity_sold: 188 }] },
  bnd_duo: { sales_volume: 96, gross_revenue: 576_000, net_profit: 433_900, component_popularity: [{ item_id: "mi_espresso", item_name: "Espresso", quantity_sold: 192 }] },
};

/** PaginatedBundles for a given status filter (or all). */
export function bundlesPage(status: string | null) {
  const data = status ? MOCK_BUNDLES.filter((b) => b.status === status) : MOCK_BUNDLES;
  return { data, total: data.length, page: 1, per_page: 20, total_pages: 1 };
}

// ── Branch overrides ────────────────────────────────────────────────────────────

/** Addon catalog page (PaginatedAddonItems) — mirrors MOCK_ADDON_ITEMS. */
export const MOCK_ADDON_CATALOG = {
  data: MOCK_ADDON_ITEMS.map((a) => ({
    id: a.id, org_id: MOCK_ORG_ID, name: a.name, name_translations: a.name_translations,
    addon_type: a.addon_type, default_price: a.default_price, is_active: a.is_active,
    primary_ingredient_id: null, ingredients: [],
    created_at: "2026-01-04T08:00:00Z", updated_at: NOW_ISO,
  })),
  total: MOCK_ADDON_ITEMS.length, page: 1, per_page: 24, total_pages: 1,
};

/** BranchMenuOverride[] for br_zamalek — several priced / hidden / size overrides. */
export const MOCK_BRANCH_MENU_OVERRIDES = [
  { branch_id: "br_zamalek", menu_item_id: "mi_latte", is_available: true, price_override: 6_500, sizes: [], updated_at: NOW_ISO },
  { branch_id: "br_zamalek", menu_item_id: "mi_cappuccino", is_available: true, price_override: 6_000, sizes: [{ size_label: "Large", price_override: 7_500 }], updated_at: NOW_ISO },
  { branch_id: "br_zamalek", menu_item_id: "mi_matcha", is_available: false, price_override: null, sizes: [], updated_at: NOW_ISO },
  { branch_id: "br_zamalek", menu_item_id: "mi_frappuccino", is_available: true, price_override: 9_000, sizes: [], updated_at: NOW_ISO },
  { branch_id: "br_zamalek", menu_item_id: "mi_cheesecake", is_available: false, price_override: null, sizes: [], updated_at: NOW_ISO },
];

/** BranchAddonOverride[] for br_zamalek. */
export const MOCK_BRANCH_ADDON_OVERRIDES = [
  { branch_id: "br_zamalek", addon_item_id: "ai_oatmilk", is_available: true, price_override: 2_000, updated_at: NOW_ISO },
  { branch_id: "br_zamalek", addon_item_id: "ai_hazelnut", is_available: false, price_override: null, updated_at: NOW_ISO },
];

// ── Shifts ──────────────────────────────────────────────────────────────────────

interface ShiftSeed {
  id: string; branch_id: string; branch_name: string; teller_id: string; teller: string;
  status: "open" | "closed" | "force_closed"; opening: number; declared: number | null; system: number | null;
  openedAt: string; closedAt: string | null; tillId: string; tillName: string; editedOpen?: boolean; origOpen?: number; editReason?: string;
}

const SHIFT_SEEDS: ShiftSeed[] = [
  { id: "shift_open_zam", branch_id: "br_zamalek", branch_name: "Zamalek", teller_id: "tel_mona", teller: "Mona Adel", status: "open", opening: 100_000, declared: null, system: null, openedAt: "2026-06-16T06:00:00Z", closedAt: null, tillId: "till_1", tillName: "Front drawer" },
  { id: "shift_zam_0615", branch_id: "br_zamalek", branch_name: "Zamalek", teller_id: "tel_karim", teller: "Karim Saleh", status: "closed", opening: 100_000, declared: 1_842_500, system: 1_844_000, openedAt: "2026-06-15T06:00:00Z", closedAt: "2026-06-15T22:10:00Z", tillId: "till_1", tillName: "Front drawer" },
  { id: "shift_nc_0615", branch_id: "br_newcairo", branch_name: "New Cairo", teller_id: "tel_youssef", teller: "Youssef Nabil", status: "closed", opening: 80_000, declared: 1_512_000, system: 1_512_000, openedAt: "2026-06-15T06:00:00Z", closedAt: "2026-06-15T22:05:00Z", tillId: "till_2", tillName: "Main till" },
  { id: "shift_zam_0614", branch_id: "br_zamalek", branch_name: "Zamalek", teller_id: "tel_nour", teller: "Nour El-Sayed", status: "force_closed", opening: 120_000, declared: null, system: 1_390_000, openedAt: "2026-06-14T06:00:00Z", closedAt: "2026-06-14T22:40:00Z", tillId: "till_1", tillName: "Front drawer", editedOpen: true, origOpen: 100_000, editReason: "Added float from safe" },
];

export const MOCK_SHIFTS = SHIFT_SEEDS.map((s) => ({
  id: s.id, branch_id: s.branch_id, branch_name: s.branch_name, teller_id: s.teller_id, teller_name: s.teller,
  status: s.status, opened_at: s.openedAt, closed_at: s.closedAt, closed_by: s.closedAt ? s.teller_id : null,
  opening_cash: s.opening, opening_cash_original: s.editedOpen ? (s.origOpen ?? null) : null,
  opening_cash_was_edited: !!s.editedOpen, opening_cash_edit_reason: s.editReason ?? null,
  closing_cash_declared: s.declared, closing_cash_system: s.system,
  cash_discrepancy: s.declared != null && s.system != null ? s.declared - s.system : null,
  force_closed_at: s.status === "force_closed" ? s.closedAt : null, force_closed_by: s.status === "force_closed" ? "usr_demo_admin" : null,
  force_close_reason: s.status === "force_closed" ? "Teller left before counting" : null,
  till_id: s.tillId, till_name: s.tillName, notes: null,
}));

export function shiftsPage(branchId: string) {
  const data = branchId === ALL_BRANCHES_ID ? MOCK_SHIFTS : MOCK_SHIFTS.filter((s) => s.branch_id === branchId);
  return { data, total: data.length, page: 1, per_page: data.length || 1, total_pages: 1 };
}

export const MOCK_CURRENT_SHIFT = {
  has_open_shift: true,
  open_shift: MOCK_SHIFTS.find((s) => s.id === "shift_open_zam") ?? null,
  suggested_opening_cash: 100_000,
};

/** ShiftReportResponse keyed by shift id (settlement / payment breakdown). */
function shiftReport(shiftId: string) {
  const shift = MOCK_SHIFTS.find((s) => s.id === shiftId) ?? MOCK_SHIFTS[1];
  const payment_summary = [
    { payment_method: "cash", is_cash: true, order_count: 84, total: 712_000 },
    { payment_method: "card", is_cash: false, order_count: 61, total: 548_000 },
    { payment_method: "talabat_online", is_cash: false, order_count: 28, total: 331_500 },
    { payment_method: "digital_wallet", is_cash: false, order_count: 19, total: 184_000 },
    { payment_method: "talabat_cash", is_cash: true, order_count: 7, total: 69_000 },
  ];
  const total_payments = payment_summary.reduce((s, p) => s + p.total, 0);
  const voided_amount = 18_400;
  const cash_movements = [
    { amount: 50_000, created_at: "2026-06-15T12:30:00Z", moved_by_name: "Mona Adel", note: "Float top-up from safe" },
    { amount: -30_000, created_at: "2026-06-15T18:15:00Z", moved_by_name: "Karim Saleh", note: "Petty cash — supplier delivery" },
  ];
  const cash_movements_in = cash_movements.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const cash_movements_out = -cash_movements.filter((m) => m.amount < 0).reduce((s, m) => s + m.amount, 0);
  return {
    shift,
    expected_cash: shift.closing_cash_system ?? 1_844_000,
    total_payments,
    net_payments: total_payments - voided_amount,
    voided_amount,
    payment_summary,
    cash_movements,
    cash_movements_in,
    cash_movements_out,
    cash_movements_net: cash_movements_in - cash_movements_out,
    printed_at: NOW_ISO,
  };
}
export const MOCK_SHIFT_REPORT = shiftReport;

// ── Permissions ──────────────────────────────────────────────────────────────

/** UserPublic[] for the org (the current admin is filtered out by the page). */
export const MOCK_USERS = [
  { id: "usr_demo_admin", name: "Shawket Ibrahim", email: "shawket@madar.app", phone: "+20 100 000 0000", role: "org_admin", org_id: MOCK_ORG_ID, branch_id: null, is_active: true },
  { id: "usr_mona", name: "Mona Adel", email: "mona@madar.app", phone: "+20 100 111 2222", role: "branch_manager", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", is_active: true },
  { id: "usr_karim", name: "Karim Saleh", email: "karim@madar.app", phone: "+20 100 333 4444", role: "teller", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", is_active: true },
  { id: "usr_youssef", name: "Youssef Nabil", email: "youssef@madar.app", phone: "+20 100 555 6666", role: "teller", org_id: MOCK_ORG_ID, branch_id: "br_newcairo", is_active: true },
  { id: "usr_nour", name: "Nour El-Sayed", email: "nour@madar.app", phone: "+20 100 777 8888", role: "waiter", org_id: MOCK_ORG_ID, branch_id: "br_zamalek", is_active: true },
  { id: "usr_hossam", name: "Hossam Ali", email: "hossam@madar.app", phone: "+20 100 999 0000", role: "kitchen", org_id: MOCK_ORG_ID, branch_id: "br_maadi", is_active: true },
];

const PERM_RESOURCES = [
  "orgs", "branches", "users", "permissions", "settings", "categories", "menu_items",
  "addon_items", "recipes", "inventory", "stocktakes", "suppliers", "purchase_orders",
  "orders", "payments", "shifts",
];
const PERM_ACTIONS = ["read", "create", "update", "delete"];

/**
 * Role defaults: a branch_manager can read everything, write most operational
 * resources, but can't manage orgs/users/permissions. A few cells carry an
 * explicit user override to exercise the override styling.
 */
function roleDefault(resource: string, action: string): boolean {
  if (action === "read") return resource !== "permissions";
  const writableForManager = ["categories", "menu_items", "addon_items", "recipes", "inventory", "stocktakes", "suppliers", "purchase_orders", "orders", "payments", "shifts", "branches", "settings"];
  if (action === "delete") return ["inventory", "stocktakes", "orders", "shifts"].includes(resource);
  return writableForManager.includes(resource);
}

const PERM_OVERRIDES: Record<string, boolean> = {
  "users:read": true, // grant beyond role default
  "purchase_orders:delete": true,
  "payments:update": false, // explicitly deny
};

export function permissionMatrix(_userId: string) {
  const rows: Array<{ resource: string; action: string; role_default: boolean; user_override: boolean | null; effective: boolean }> = [];
  for (const resource of PERM_RESOURCES) {
    for (const action of PERM_ACTIONS) {
      const role_default = roleDefault(resource, action);
      const ovKey = `${resource}:${action}`;
      const user_override = ovKey in PERM_OVERRIDES ? PERM_OVERRIDES[ovKey] : null;
      rows.push({ resource, action, role_default, user_override, effective: user_override ?? role_default });
    }
  }
  return rows;
}

// ── QR codes ────────────────────────────────────────────────────────────────────

/**
 * A small but recognisable QR-looking SVG (deterministic), base64-encoded into a
 * data URL so the <img> renders without a network round-trip. Not a real QR —
 * just a stable placeholder that reads as a scannable code in screenshots.
 */
const QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 29 29" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/><g fill="#0b1f3a"><path d="M0 0h7v7h-7zM1 1v5h5v-5z M2 2h3v3h-3z"/><path d="M22 0h7v7h-7zM23 1v5h5v-5z M24 2h3v3h-3z"/><path d="M0 22h7v7h-7zM1 23v5h5v-5z M2 24h3v3h-3z"/><rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="13" y="1" width="1" height="1"/><rect x="15" y="0" width="1" height="1"/><rect x="18" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="13" y="3" width="1" height="1"/><rect x="16" y="4" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="13" y="9" width="1" height="1"/><rect x="15" y="11" width="1" height="1"/><rect x="17" y="9" width="1" height="1"/><rect x="19" y="12" width="1" height="1"/><rect x="21" y="10" width="1" height="1"/><rect x="23" y="13" width="1" height="1"/><rect x="25" y="9" width="1" height="1"/><rect x="9" y="13" width="1" height="1"/><rect x="11" y="15" width="1" height="1"/><rect x="13" y="17" width="1" height="1"/><rect x="15" y="19" width="1" height="1"/><rect x="10" y="20" width="1" height="1"/><rect x="12" y="22" width="1" height="1"/><rect x="14" y="24" width="1" height="1"/><rect x="16" y="26" width="1" height="1"/><rect x="18" y="20" width="1" height="1"/><rect x="20" y="22" width="1" height="1"/><rect x="22" y="24" width="1" height="1"/><rect x="24" y="26" width="1" height="1"/><rect x="26" y="20" width="1" height="1"/><rect x="20" y="15" width="1" height="1"/><rect x="22" y="17" width="1" height="1"/><rect x="24" y="14" width="1" height="1"/><rect x="26" y="16" width="1" height="1"/><rect x="18" y="9" width="1" height="1"/><rect x="9" y="17" width="1" height="1"/><rect x="9" y="25" width="1" height="1"/><rect x="11" y="27" width="1" height="1"/><rect x="13" y="13" width="1" height="1"/><rect x="15" y="15" width="1" height="1"/></g></svg>`;

function qrResponse(kind: string, slug: string, code: string) {
  const base64 = typeof btoa === "function" ? btoa(QR_SVG) : Buffer.from(QR_SVG).toString("base64");
  return {
    kind,
    short_code: code,
    short_url: `https://mdr.to/${code}`,
    long_url: `https://order.madar.app/${slug}`,
    qr_data_url: `data:image/svg+xml;base64,${base64}`,
  };
}
export const MOCK_QR = qrResponse;

// ── Delivery settings (branch-scoped) ─────────────────────────────────────────

export const MOCK_DELIVERY_SETTINGS = {
  branch_id: "br_zamalek",
  in_mall_enabled: true,
  in_mall_open_time: "10:00:00",
  in_mall_close_time: "23:30:00",
  in_mall_fee: 1_500,
  in_mall_discount_id: null,
  in_mall_override: "default",
  in_mall_require_location: true,
  outside_enabled: true,
  outside_open_time: "09:00:00",
  outside_close_time: "23:00:00",
  outside_discount_id: null,
  outside_override: "default",
  umbrella_enabled: false,
  umbrella_open_time: null,
  umbrella_close_time: null,
  umbrella_fee: 2_000,
  umbrella_discount_id: null,
  umbrella_override: "default",
  pickup_enabled: true,
  pickup_open_time: null,
  pickup_close_time: null,
  pickup_fee: 0,
  pickup_discount_id: null,
  pickup_override: "default",
  prep_time_minutes: 20,
  max_road_distance_meters: 5_000,
  otp_required: true,
};
