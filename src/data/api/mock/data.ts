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

export const MOCK_INGREDIENT_CATALOG = [
  { id: "ing_milk", org_id: MOCK_ORG_ID, name: "Whole Milk", name_translations: { ar: "حليب كامل الدسم" }, unit: "liter", cost_per_unit: 1_800, low_stock_level: 10, reorder_threshold: 10, supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", is_active: true },
  { id: "ing_coffee", org_id: MOCK_ORG_ID, name: "Espresso Beans", name_translations: { ar: "حبوب إسبريسو" }, unit: "kg", cost_per_unit: 45_000, low_stock_level: 2, reorder_threshold: 2, supplier_id: "sup_coffee", supplier_name: "Premium Roasters", is_active: true },
  { id: "ing_cream", org_id: MOCK_ORG_ID, name: "Heavy Cream", name_translations: { ar: "كريمة ثقيلة" }, unit: "liter", cost_per_unit: 3_200, low_stock_level: 5, reorder_threshold: 5, supplier_id: "sup_dairy", supplier_name: "Cairo Dairy Co.", is_active: true },
  { id: "ing_oatmilk", org_id: MOCK_ORG_ID, name: "Oat Milk", name_translations: { ar: "حليب الشوفان" }, unit: "liter", cost_per_unit: 4_500, low_stock_level: 4, reorder_threshold: 4, supplier_id: null, supplier_name: null, is_active: true },
  { id: "ing_sugar", org_id: MOCK_ORG_ID, name: "Sugar", name_translations: { ar: "سكر" }, unit: "kg", cost_per_unit: 800, low_stock_level: 5, reorder_threshold: 5, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", is_active: true },
  { id: "ing_vanilla", org_id: MOCK_ORG_ID, name: "Vanilla Syrup", name_translations: { ar: "شراب الفانيليا" }, unit: "liter", cost_per_unit: 12_000, low_stock_level: 2, reorder_threshold: 2, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", is_active: true },
  { id: "ing_cocoa", org_id: MOCK_ORG_ID, name: "Cocoa Powder", name_translations: { ar: "مسحوق الكاكاو" }, unit: "kg", cost_per_unit: 9_500, low_stock_level: 1, reorder_threshold: 1, supplier_id: "sup_dry", supplier_name: "Dry Goods Dist.", is_active: true },
  { id: "ing_matcha", org_id: MOCK_ORG_ID, name: "Matcha Powder", name_translations: { ar: "مسحوق الماتشا" }, unit: "kg", cost_per_unit: 85_000, low_stock_level: 0.5, reorder_threshold: 0.5, supplier_id: null, supplier_name: null, is_active: true },
];

export const MOCK_INVENTORY_VALUATION = {
  total_value: 142_500_00,
  unknown_cost_count: 2,
  by_category: [],
};

export const MOCK_LOW_STOCK: unknown[] = [];

export const MOCK_SUPPLIERS = [
  { id: "sup_dairy", org_id: MOCK_ORG_ID, name: "Cairo Dairy Co.", contact_name: "Ahmed Hassan", email: "ahmed@cairodairy.eg", phone: "+20 2 1234 5678", is_active: true },
  { id: "sup_coffee", org_id: MOCK_ORG_ID, name: "Premium Roasters", contact_name: "Sara Nour", email: "orders@premiumroasters.eg", phone: "+20 100 987 6543", is_active: true },
  { id: "sup_dry", org_id: MOCK_ORG_ID, name: "Dry Goods Dist.", contact_name: null, email: null, phone: null, is_active: true },
];

export const MOCK_PURCHASE_ORDERS: unknown[] = [];

export const MOCK_STOCKTAKES: unknown[] = [];

export const MOCK_INVENTORY_SETTINGS = { stocktake_variance_threshold_pct: 5 };
