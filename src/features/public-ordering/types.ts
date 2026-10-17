import type { DealRule } from "@/data/api/generated/models/dealRule";
import type { DeliveryMenuCategory } from "@/data/api/generated/models/deliveryMenuCategory";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";
import type { DeliveryMenuItemPricing } from "@/data/api/generated/models/deliveryMenuItemPricing";
import type { DeliveryOptionPricing } from "@/data/api/generated/models/deliveryOptionPricing";

/*
 * ── The menu, as the storefront components read it ──────────────────────────
 *
 * Two menus feed the same components: the priced one (`DeliveryMenu`, every
 * ordering page) and the menu WITHOUT prices (`MenuDisplayMenu`, the shop's
 * `/menu` page), whose types have no price field at all — the server never
 * sends one. So every figure below is OPTIONAL: present on the priced menu,
 * absent on the other. Both generated types are assignable to these.
 *
 * A component reads a figure only when prices are shown (`useShowPrices`),
 * so on the priced menu nothing changes, and on the other nothing is read.
 */

export interface CatalogSize {
  label: string;
  price?: number;
}

export interface CatalogOptional {
  id: string;
  name: string;
  name_translations: unknown;
  size_label?: string | null;
  price?: number;
}

export interface CatalogModifierOption {
  option_id: string;
  name: string;
  name_translations: unknown;
  price?: number;
}

export interface CatalogModifierGroup {
  group_id: string;
  name: string;
  name_translations: unknown;
  selection_type: string;
  min_selections: number;
  max_selections?: number | null;
  is_required: boolean;
  addon_type?: string | null;
  options: CatalogModifierOption[];
}

export interface CatalogComboSize {
  label: string;
  price?: number;
  extra?: number;
}

export interface CatalogComboChoice {
  menu_item_id: string;
  name: string;
  name_translations: unknown;
  image_url?: string | null;
  included_size_label: string;
  sizes: CatalogComboSize[];
  available?: boolean;
  base_price?: number;
  surcharge?: number;
}

export interface CatalogComboSlot {
  id: string;
  name: string;
  name_translations: unknown;
  sort: number;
  min: number;
  max: number;
  default_item_id?: string | null;
  default_size_label?: string | null;
  choices: CatalogComboChoice[];
}

export interface CatalogCombo {
  is_fixed: boolean;
  slots: CatalogComboSlot[];
}

export interface CatalogItem {
  id: string;
  category_id?: string | null;
  name: string;
  name_translations: unknown;
  description?: string | null;
  image_url?: string | null;
  kind: string;
  sizes: CatalogSize[];
  optionals: CatalogOptional[];
  default_milk_addon_id?: string | null;
  allowed_addon_ids: string[];
  modifier_groups: CatalogModifierGroup[];
  combo?: CatalogCombo | null;
  price?: number;
  pricing?: DeliveryMenuItemPricing;
}

export interface CatalogAddon {
  addon_item_id: string;
  name: string;
  name_translations: unknown;
  type: string;
  is_available: boolean;
  price?: number;
}

export interface CatalogMenu {
  categories: DeliveryMenuCategory[];
  items: CatalogItem[];
  addons: CatalogAddon[];
  discount?: DeliveryMenuDiscount | null;
  deals?: DealRule[];
  option_pricing?: DeliveryOptionPricing[];
}

/** The delivery channels the public page supports. */
export type Channel = "in_mall" | "outside" | "umbrella" | "pickup";

/** Channels with no map/GPS — flat fee, destination is a label not a pin
 *  (umbrella = a sunbed number; pickup = collected at the counter). */
const FLAT_CHANNELS: Channel[] = ["umbrella", "pickup"];
export const isFlatChannel = (c: Channel): boolean => FLAT_CHANNELS.includes(c);

/** The ordered steps of the public flow. */
export type Step = "branch" | "channel" | "phone" | "location" | "menu" | "checkout" | "done";

/** A selected addon option inside a configured cart line. */
export interface SelectedAddon {
  addon_item_id: string;
  /** how many of this addon (multi-select extras can stack). */
  quantity: number;
  /** snapshot for display + estimate pricing (server reprices on submit). */
  name: string;
  name_translations: unknown;
  /** per-unit surcharge in piastres (estimate — server prices the swap delta).
   *  Absent on the menu without prices. */
  price?: number;
  /** the option's global category: `milk_type` | `coffee_type` | `extra`
   * (so the customizer can rebuild grouped selections when editing). */
  type: string;
}

/** A selected optional toggle inside a configured cart line. */
export interface SelectedOptional {
  id: string;
  name: string;
  name_translations: unknown;
  /** Absent on the menu without prices. */
  price?: number;
}

/**
 * One pick inside a combo line: what the server needs (`slot_id`,
 * `menu_item_id`, `size_label`, `quantity`) plus display snapshots so the
 * basket can say "Coffee: Latte" in the customer's language without the menu.
 */
export interface ComboPick {
  slot_id: string;
  menu_item_id: string;
  /** null = the choice's included size (and never the synthetic `one_size`). */
  size_label: string | null;
  /** units of this choice per ONE combo (the line's quantity multiplies it). */
  quantity: number;
  name: string;
  name_translations: unknown;
  slot_name: string;
  slot_name_translations: unknown;
  /** per-unit surcharge estimate (choice surcharge + size extra), piastres.
   *  Absent on the menu without prices. */
  extra?: number;
}

/**
 * A fully-configured cart line, held in local state. Carries display snapshots
 * so the cart/checkout can render selections + an ESTIMATE; the server reprices
 * authoritatively on submit.
 */
export interface CartLine {
  /** stable client id for this configured line. */
  uid: string;
  item: CatalogItem;
  size_label: string | null;
  /** unit base price (size price, or item base when no sizes), piastres.
   *  Absent on the menu without prices. */
  base_price?: number;
  quantity: number;
  addons: SelectedAddon[];
  optionals: SelectedOptional[];
  notes: string | null;
  /** Present only for a combo (`item.kind === "combo"`): the customer's picks. */
  combo?: { picks: ComboPick[] };
}
