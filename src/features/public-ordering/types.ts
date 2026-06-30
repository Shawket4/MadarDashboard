import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

/** The delivery channels the public page supports. */
export type Channel = "in_mall" | "outside" | "umbrella" | "pickup";

/** Channels with no map/GPS — flat fee, destination is a label not a pin
 *  (umbrella = a sunbed number; pickup = collected at the counter). */
export const FLAT_CHANNELS: Channel[] = ["umbrella", "pickup"];
export const isFlatChannel = (c: Channel): boolean => FLAT_CHANNELS.includes(c);

/** The ordered steps of the public flow. */
export type Step = "branch" | "channel" | "phone" | "location" | "menu" | "checkout" | "done";

/** Compact item snapshot stored in the order history cart JSONB. */
export interface OrderHistoryItemEntry {
  name: string;
  quantity: number;
}

/** Guest profile fetched from the backend after phone + optional OTP. */
export interface GuestProfile {
  phone: string;
  deviceToken: string;
  customerName: string | null;
  orders: import("@/data/api/generated/models/orderHistorySummary").OrderHistorySummary[];
  locations: import("@/data/api/generated/models/guestSavedLocation").GuestSavedLocation[];
}

/** A selected addon option inside a configured cart line. */
export interface SelectedAddon {
  addon_item_id: string;
  /** how many of this addon (multi-select extras can stack). */
  quantity: number;
  /** snapshot for display + estimate pricing (server reprices on submit). */
  name: string;
  name_translations: unknown;
  /** per-unit surcharge in piastres (estimate — server prices the swap delta). */
  price: number;
  /** the option's global category: `milk_type` | `coffee_type` | `extra`
   * (so the customizer can rebuild grouped selections when editing). */
  type: string;
}

/** A selected optional toggle inside a configured cart line. */
export interface SelectedOptional {
  id: string;
  name: string;
  name_translations: unknown;
  price: number;
}

/**
 * A fully-configured cart line, held in local state. Carries display snapshots
 * so the cart/checkout can render selections + an ESTIMATE; the server reprices
 * authoritatively on submit.
 */
export interface CartLine {
  /** stable client id for this configured line. */
  uid: string;
  item: DeliveryMenuItem;
  size_label: string | null;
  /** unit base price (size price, or item base when no sizes), piastres. */
  base_price: number;
  quantity: number;
  addons: SelectedAddon[];
  optionals: SelectedOptional[];
  notes: string | null;
}
