import type {
  AdjustmentType,
  InventoryUnit,
  OrderStatus,
  PaymentMethod,
  PrinterBrand,
  Role,
  ShiftStatus,
} from "@/data/config/constants";

// Re-export enum types for convenience so consumers can import everything from one place
export type { AdjustmentType, InventoryUnit, OrderStatus, PaymentMethod, PrinterBrand, Role, ShiftStatus };

// ── Auth / User ──────────────────────────────────────────────────────────────

export type { UserPublic, LoginResponse } from "./api/generated/models";

export interface UserBranch {
  branch_id: string;
  branch_name: string;
}

// ── Org ──────────────────────────────────────────────────────────────────────

export type { Org } from "./api/generated/models";

// ── Branch ───────────────────────────────────────────────────────────────────

export type { Branch } from "./api/generated/models";

// ── Permissions ──────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  user_id: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface RolePermission {
  role: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface PermissionMatrix {
  resource: string;
  action: string;
  role_default: boolean | null;
  user_override: boolean | null;
  effective: boolean;
}

// ── Menu ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddonItem {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  addon_type: string; // free text — e.g. "coffee_type", "milk_type", "extra", "sweetener"
  default_price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItemSize {
  id: string;
  menu_item_id: string;
  label: string;
  price_override: number;
  display_order: number;
  is_active: boolean;
}

export interface AddonSlot {
  id: string;
  menu_item_id: string;
  addon_type: string;
  label: string | null;
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  display_order: number;
  created_at: string;
}

export interface MenuItemOptionalField {
  id: string;
  menu_item_id: string;
  name: string;
  ingredient_name?: string | null;
  org_ingredient_id?: string | null;
  ingredient_unit?: string | null;
  quantity_used?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  org_id: string;
  category_id?: string | null;
  name: string;
  name_translations: Record<string, string>;
  description?: string | null;
  description_translations: Record<string, string>;
  image_url?: string | null;
  base_price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Recipe row as embedded in GET /menu-items/:id (distinct from the top-level
 * `DrinkRecipe` which is what /recipes/drinks/:id returns). The embedded
 * shape ships extra fields (`category`, `ingredient_unit` vs `unit`) that the
 * POS app relies on at order time.
 */
export interface MenuItemEmbeddedRecipe {
  org_ingredient_id?: string | null;
  quantity_used: number | string;
  ingredient_name: string;
  ingredient_unit: string;
  category: string;
  size_label: string;
}

export interface MenuItemFull extends MenuItem {
  sizes: ItemSize[];
  /** Per-drink addon slots configured for this item */
  addon_slots?: AddonSlot[];
  /** Per-drink optional fields (e.g. "Add Whip") */
  optional_fields?: MenuItemOptionalField[];
  /** Base + per-size ingredient recipes, embedded in the detail endpoint */
  recipes?: MenuItemEmbeddedRecipe[];
  /** Org-level default for the milk slot */
  default_milk_addon_id?: string | null;
}

// ── Recipes ──────────────────────────────────────────────────────────────────

export interface DrinkRecipe {
  id: string;
  menu_item_id: string;
  size_label: string;
  ingredient_name: string;
  unit: string;
  quantity_used: number;
}

export interface AddonIngredient {
  id: string;
  addon_item_id: string;
  org_ingredient_id?: string | null;
  ingredient_name: string;
  unit: string;
  quantity_used: number;
}

// ── Inventory ────────────────────────────────────────────────────────────────

export interface OrgIngredient {
  id: string;
  org_id: string;
  name: string;
  unit: InventoryUnit;
  category: string;
  description: string | null;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchInventoryItem {
  id: string;
  branch_id: string;
  org_ingredient_id: string;
  ingredient_name: string;
  unit: InventoryUnit;
  description: string | null;
  cost_per_unit: number;
  current_stock: number;
  reorder_threshold: number;
  below_reorder: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchInventoryAdjustment {
  id: string;
  branch_id: string;
  branch_inventory_id: string;
  ingredient_name: string;
  unit: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  note: string;
  transfer_id: string | null;
  adjusted_by: string;
  adjusted_by_name: string;
  created_at: string;
}

export interface BranchInventoryTransfer {
  id: string;
  org_id: string;
  source_branch_id: string;
  source_branch_name: string;
  destination_branch_id: string;
  destination_branch_name: string;
  org_ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  note: string | null;
  initiated_by: string;
  initiated_by_name: string;
  initiated_at: string;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_item_id: string;
  addon_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderItemOptional {
  id: string;
  order_item_id: string;
  optional_field_id: string | null;
  field_name: string;
  price: number;
  org_ingredient_id: string | null;
  ingredient_name: string | null;
  ingredient_unit: string | null;
  quantity_deducted: string | number | null;
}

export interface InventoryDeduction {
  org_ingredient_id: string | null;
  ingredient_name: string;
  unit: string;
  quantity: number;
  source: string;
  category: string;
}

export interface OrderBundleComponentAddon {
  addon_item_id: string;
  name: string;
  price_modifier: number;
  quantity: number;
}

export interface OrderBundleComponentOptional {
  optional_field_id: string;
  name: string;
  price: number;
}

export interface OrderBundleComponentFull {
  item_id: string;
  item_name: string;
  quantity: number;
  size_label: string | null;
  addons: OrderBundleComponentAddon[];
  optionals: OrderBundleComponentOptional[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  size_label: string | null;
  bundle_id?: string | null;
  bundle_components?: OrderBundleComponentFull[];
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  addons: OrderItemAddon[];
  optionals?: OrderItemOptional[];
  deductions_snapshot: InventoryDeduction[];
}

export interface OrderItemFull {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  size_label: string | null;
  bundle_id?: string | null;
  bundle_components?: OrderBundleComponentFull[];
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  deductions_snapshot: InventoryDeduction[];
  addons: OrderItemAddon[];
  optionals: OrderItemOptional[];
}

export interface OrderPayment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
}

export interface Order {
  id: string;
  branch_id: string;
  shift_id: string;
  teller_id: string;
  teller_name: string;
  order_number: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  customer_name: string | null;
  notes: string | null;
  amount_tendered: number | null;
  change_given: number | null;
  tip_amount: number | null;
  discount_id: string | null;
  voided_at: string | null;
  void_reason: string | null;
  voided_by: string | null;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderExport extends Order {
  items: OrderItemFull[];
  payments: OrderPayment[];
}

export interface ExportResponse {
  data: OrderExport[];
  total: number;
  generated_at: string;
  summary: {
    revenue: number;
    completed: number;
    voided: number;
    discounts: number;
    tips: number;
  };
}

export interface OrderSummary {
  revenue: number;
  completed: number;
  voided: number;
  discounts: number;
  tips: number;
}


export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  summary: OrderSummary;
}

export interface OrdersQuery {
  branch_id?: string;
  shift_id?: string;
  page?: number;
  per_page?: number;
  teller_name?: string;
  payment_method?: PaymentMethod;
  status?: OrderStatus;
  from?: string;
  to?: string;
}

// ── Shifts ───────────────────────────────────────────────────────────────────

export interface Shift {
  id: string;
  branch_id: string;
  teller_id: string;
  teller_name: string;
  status: ShiftStatus;
  opening_cash: number;
  opening_cash_original: number | null;
  opening_cash_was_edited: boolean;
  opening_cash_edit_reason: string | null;
  closing_cash_declared: number | null;
  closing_cash_system: number | null;
  cash_discrepancy: number | null;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  force_closed_by: string | null;
  force_closed_at: string | null;
  force_close_reason: string | null;
  notes: string | null;
}

export interface ShiftPreFill {
  has_open_shift: boolean;
  open_shift: Shift | null;
  suggested_opening_cash: number;
}

export interface CashMovement {
  id: string;
  shift_id: string;
  amount: number;
  note: string;
  moved_by: string;
  moved_by_name: string;
  created_at: string;
}

export interface PaymentSummaryRow {
  payment_method: PaymentMethod;
  total: number;
  order_count: number;
}

export interface CashMovementSummaryRow {
  amount: number;
  note: string;
  moved_by_name: string;
  created_at: string;
}

export interface ShiftReport {
  shift: Shift;
  payment_summary: PaymentSummaryRow[];
  total_payments: number;
  total_returns: number;
  net_payments: number;
  cash_movements: CashMovementSummaryRow[];
  cash_movements_in: number;
  cash_movements_out: number;
  cash_movements_net: number;
  printed_at: string;
}

// ── Reports / Analytics ──────────────────────────────────────────────────────

export type {
  ItemSales,
  CategorySales,
  BranchSalesReport,
  TimeseriesPoint,
  TellerStats,
  AddonSalesRow,
  BranchComparison,
  OrgComparisonReport,
  StockRow,
  BranchStockReport,
} from "./api/generated/models";

// ── Discounts ────────────────────────────────────────────────────────────────

export interface Discount {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  dtype: "percentage" | "fixed";
  value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Bundles ──────────────────────────────────────────────────────────────────

export type BundleStatus = "draft" | "active" | "archived";

export interface Bundle {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  description: string | null;
  description_translations: Record<string, string>;
  price: number; // Stored in piastres
  status: BundleStatus;
  image_url: string | null;
  display_order: number;
  available_from_time: string | null; // "HH:MM:SS" or null
  available_until_time: string | null; // "HH:MM:SS" or null
  available_from_date: string | null; // "YYYY-MM-DD" or null
  available_until_date: string | null; // "YYYY-MM-DD" or null
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BundleComponentHydrated {
  id: string;
  bundle_id: string;
  item_id: string;
  quantity: number;
  position: number;
  item_name: string;
  item_price: number; // Stored in piastres
  item_cost: number;  // Stored in piastres
}

export interface BundleWithComponents {
  id: string;
  org_id: string;
  name: string;
  name_translations: Record<string, string>;
  description: string | null;
  description_translations: Record<string, string>;
  price: number; // Stored in piastres
  status: BundleStatus;
  image_url: string | null;
  display_order: number;
  available_from_time: string | null;
  available_until_time: string | null;
  available_from_date: string | null;
  available_until_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  components: BundleComponentHydrated[];
  branch_ids: string[];
  computed_cost: number; // Sum of component costs (piastres)
}

export interface PaginatedBundles {
  data: BundleWithComponents[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ComponentPopularity {
  item_id: string;
  item_name: string;
  quantity_sold: number;
}

export interface BundlePerformanceResponse {
  sales_volume: number;
  gross_revenue: number; // Stored in piastres
  net_profit: number;    // Stored in piastres
  component_popularity: ComponentPopularity[];
}

