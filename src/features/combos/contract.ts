/**
 * TEMPORARY: the combos/deals wire shapes, typed by hand from
 * `COMBOS_CONTRACT.md` §2 and §3 with the owner's §11 answers applied
 * (org-wide channel toggles with branch overrides, NO per-combo channels;
 * optional date ranges on windows).
 *
 * This file exists only until Builder A publishes the spec. Then the Orval
 * models in `src/data/api/generated/models` replace every type here and this
 * file is deleted. Nothing here is ever sent over the wire by hand.
 */

export type ComboChannel = "pos" | "qr" | "online" | "delivery";
export const COMBO_CHANNELS: readonly ComboChannel[] = ["pos", "qr", "online", "delivery"] as const;

export type Translations = Record<string, string>;

/** `sale_windows`: optional; no rows means always available. */
export interface SaleWindow {
  /** null = every branch */
  branch_id: string | null;
  /** bit0 = Sunday … bit6 = Saturday, 1..127 */
  weekdays: number;
  /** "HH:MM"; both null or both set; ends < starts crosses midnight */
  starts_at: string | null;
  ends_at: string | null;
  /** §11.3: optional date range, "YYYY-MM-DD" */
  valid_from: string | null;
  valid_to: string | null;
}

export interface SizeSurcharge {
  size_label: string;
  surcharge: number;
}

export interface ComboChoiceWrite {
  id?: string | null;
  menu_item_id: string | null;
  category_id: string | null;
  surcharge: number;
  included_size_label: string | null;
  size_surcharges: SizeSurcharge[];
  sort: number;
}

export interface ComboSlotWrite {
  id?: string | null;
  name: string;
  name_translations: Translations;
  sort: number;
  min: number;
  max: number;
  default_item_id: string | null;
  default_size_label: string | null;
  choices: ComboChoiceWrite[];
}

export interface ComboWrite {
  name: string;
  name_translations: Translations;
  category_id: string | null;
  description: string | null;
  is_active: boolean;
  /** P, piastres */
  price: number;
  windows: SaleWindow[];
  slots: ComboSlotWrite[];
}

export type ComboWarningCode = "MARGIN_BELOW_MIN" | "NO_SAVING" | "COST_UNKNOWN" | "SLOT_EMPTY_NOW" | "CHOICE_INACTIVE";

export interface ComboWarning {
  code: ComboWarningCode | string;
  vars?: Record<string, string>;
}

export interface ComboEconomics {
  branch_id: string | null;
  price: number;
  list_default: number;
  list_min: number;
  list_max: number;
  cost_default: number | null;
  cost_max: number | null;
  /** string decimals ("0.5933") like every other rate */
  margin_default: string | null;
  margin_worst: string | null;
  min_margin: string | null;
  saving_default: number;
  warnings: ComboWarning[];
}

export interface Combo extends ComboWrite {
  id: string;
  kind: "combo";
  image_url: string | null;
  is_fixed: boolean;
  economics: ComboEconomics;
  created_at: string;
  updated_at: string;
}

export interface ComboSummary {
  id: string;
  name: string;
  name_translations: Translations;
  image_url: string | null;
  category_id: string | null;
  price: number;
  is_active: boolean;
  is_fixed: boolean;
  slot_count: number;
  available_now: boolean;
  margin_default: string | null;
  warning_count: number;
}

export interface ComboPage {
  data: ComboSummary[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ListCombosParams {
  q?: string;
  category_id?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export type ChannelSell = Record<ComboChannel, boolean>;
export type ChannelOverride = Partial<Record<ComboChannel, boolean | null>>;

/** §11.1 + §2.2 settings: one org-wide switch per channel, overridable per branch, and the margin floor. */
export interface ComboSettings {
  min_margin: string | null;
  sell: ChannelSell;
  branch_overrides: { branch_id: string; sell: ChannelOverride }[];
}

export interface ComboSettingsWrite {
  min_margin: string | null;
  sell: ChannelSell;
}

export type DealKind = "n_for_price" | "buy_get";

export interface DealPoolEntry {
  menu_item_id: string | null;
  category_id: string | null;
  size_label: string | null;
}

export interface DealWrite {
  name: string;
  name_translations: Translations;
  kind: DealKind;
  qty: number;
  price: number | null;
  get_qty: number | null;
  get_percent: number | null;
  max_per_order: number | null;
  sort: number;
  is_active: boolean;
  pool: DealPoolEntry[];
  reward_pool: DealPoolEntry[];
  windows: SaleWindow[];
}

export interface DealRule extends DealWrite {
  id: string;
  branch_overrides: { branch_id: string; is_active: boolean }[];
}

export type BundleKind = "combo" | "deal";

export interface BundlesReportRow {
  kind: BundleKind;
  id: string;
  name: string;
  name_translations: Translations;
  sold: number;
  orders: number;
  revenue: number;
  list_value: number;
  saving: number;
  cost: number | null;
  cost_missing: boolean;
  margin: string | null;
}

export interface BundlesReport {
  from: string;
  to: string;
  rows: BundlesReportRow[];
  totals: { sold: number; revenue: number; list_value: number; saving: number; cost: number };
}

export interface BundlesReportParams {
  from?: string;
  to?: string;
  branch_id?: string;
  kind?: BundleKind;
}

export interface ComboMix {
  slots: {
    slot_id: string;
    name: string;
    picks: { menu_item_id: string; name: string; size_label: string | null; count: number; surcharge_total: number }[];
  }[];
}

/** §3.2: the new fields on every `OrderFull.items[]` line. */
export interface ComboLineFields {
  line_kind?: "item" | "combo" | "combo_part" | string;
  combo_line_id?: string | null;
  combo_slot_id?: string | null;
  combo_slot_name?: string | null;
  combo_unit_price?: number | null;
  combo_share?: number;
  combo_surcharge?: number;
  deal_minor?: number;
}

/** §3.2: `OrderFull.deals[]`. */
export interface OrderDeal {
  id: string;
  deal_rule_id: string;
  name: string;
  name_translations?: Translations | null;
  times: number;
  discount: number;
  discount_server?: number | null;
  lines: { order_item_id: string; units: number; discount: number }[];
}

/** `PUT /menu-items/{id}/meal` body (§2.2, C14). */
export type MealTarget = { combo_id: string; slot_id: string } | null;
