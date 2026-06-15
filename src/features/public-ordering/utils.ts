import type { CartLineInput } from "@/data/api/generated/models/cartLineInput";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";

import type { CartLine, Channel } from "./types";

/** Narrow an arbitrary string to a supported channel (defaults to in_mall). */
export const asChannel = (v: string | null | undefined): Channel =>
  v === "outside" ? "outside" : "in_mall";

/** The unit (per-quantity) price of a configured line, in piastres — an estimate. */
export const lineUnitPrice = (line: CartLine): number => {
  const addons = line.addons.reduce((s, a) => s + a.price * a.quantity, 0);
  const optionals = line.optionals.reduce((s, o) => s + o.price, 0);
  return line.base_price + addons + optionals;
};

/** The total estimated price of a configured line (× quantity), in piastres. */
export const lineTotal = (line: CartLine): number => lineUnitPrice(line) * line.quantity;

/** The estimated subtotal of the whole cart, in piastres. */
export const cartSubtotal = (lines: CartLine[]): number =>
  lines.reduce((s, l) => s + lineTotal(l), 0);

/**
 * Estimated discount (piastres) the channel discount knocks off the subtotal.
 * Mirrors the backend `calc_discount`: percentage rounds half-up, fixed is
 * capped at the subtotal, result clamped to `[0, subtotal]`. The server reprices
 * authoritatively at intake — this is only the customer-facing estimate.
 */
export const calcDiscount = (
  subtotal: number,
  discount: DeliveryMenuDiscount | null | undefined,
): number => {
  if (!discount) return 0;
  const d =
    discount.dtype === "percentage"
      ? Math.round((subtotal * discount.value) / 100)
      : Math.min(discount.value, subtotal);
  return Math.max(0, Math.min(d, subtotal));
};

/** The base unit price for an item at a given size (size price, or item base). */
export const itemBasePrice = (item: DeliveryMenuItem, sizeLabel: string | null): number => {
  if (sizeLabel) {
    const size = item.sizes.find((s) => s.label === sizeLabel);
    if (size) return size.price;
  }
  return item.price;
};

/** Translate a configured line into the API's CartLineInput (server prices). */
export const toCartLineInput = (line: CartLine): CartLineInput => ({
  menu_item_id: line.item.id,
  size_label: line.size_label,
  quantity: line.quantity,
  addons: line.addons.map((a) => ({ addon_item_id: a.addon_item_id, quantity: a.quantity })),
  optional_field_ids: line.optionals.map((o) => o.id),
  notes: line.notes?.trim() ? line.notes.trim() : null,
});

/**
 * Normalize an Egyptian-style phone for storage keys / display: keep a leading
 * `+`, strip every other non-digit. Good enough for keying the device token.
 */
export const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
};

/** Loose validity: at least 8 digits after normalization. */
export const isValidPhone = (raw: string): boolean =>
  normalizePhone(raw).replace(/\D/g, "").length >= 8;

const DEVICE_KEY_PREFIX = "sufrix_delivery_device:";

/** Read the stored device token for a phone (skips OTP when present). */
export const getDeviceToken = (phone: string): string | null => {
  try {
    return localStorage.getItem(DEVICE_KEY_PREFIX + normalizePhone(phone));
  } catch {
    return null;
  }
};

/** Persist a verified device token keyed by normalized phone. */
export const setDeviceToken = (phone: string, token: string): void => {
  try {
    localStorage.setItem(DEVICE_KEY_PREFIX + normalizePhone(phone), token);
  } catch {
    /* storage unavailable — fall back to per-checkout OTP */
  }
};

/** Best-effort UUID for Idempotency-Key headers and cart-line uids. */
export const newUid = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};
