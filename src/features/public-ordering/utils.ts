import type { CartLineInput } from "@/data/api/generated/models/cartLineInput";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";

import { storefrontItem, unitPrice } from "./pricing";
import type { CartLine, Channel } from "./types";
import { rateOf } from "@/lib/format";

/** Narrow an arbitrary string to a supported channel (defaults to in_mall). */
export const asChannel = (v: string | null | undefined): Channel =>
  v === "outside" || v === "umbrella" || v === "pickup" ? v : "in_mall";

/**
 * The server's placeholder size for an item without sizes. It is a label for
 * the database, not a word for a customer: never show it.
 */
export const SYNTHETIC_SIZE = "one_size";

/** A size label fit to show a customer, or null when there is nothing to say. */
export const displaySize = (label: string | null | undefined): string | null =>
  label && label !== SYNTHETIC_SIZE ? label : null;

/** What a combo's picks add to its price, per combo unit (surcharges × pick quantity). */
export const comboExtras = (line: Pick<CartLine, "combo">): number =>
  (line.combo?.picks ?? []).reduce((s, p) => s + p.extra * p.quantity, 0);

/** The unit (per-quantity) price of a configured line, in piastres — an estimate. */
export const lineUnitPrice = (line: CartLine): number => {
  // A combo: its own price plus whatever the picks add (a bigger size, a
  // premium choice). The server prices it authoritatively.
  if (line.combo) return line.base_price + comboExtras(line);
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
 * `amount × rate` in whole piastres, rounded half away from zero, the rate
 * read through its shortest decimal string (so 0.145 is 0.145, not
 * 0.14499…): madar-money's exact `Decimal` arithmetic, not a float's.
 */
const decimalProduct = (amount: number, rate: number): number => {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(rate));
  if (!m) return 0;
  const [, minus, whole, frac = "", exp = "0"] = m;
  const scale = frac.length - Number(exp);
  let digits = BigInt(whole + frac) * BigInt(Math.round(Math.abs(amount)));
  if (scale < 0) digits *= 10n ** BigInt(-scale);
  const div = 10n ** BigInt(Math.max(scale, 0));
  const rounded = Number((2n * digits + div) / (2n * div));
  return (minus === "-") !== (amount < 0) ? -rounded : rounded;
};

/**
 * Estimated discount (piastres) the channel discount knocks off the subtotal:
 * madar-money's `bill::rule_of` + `discount_on`. A percentage is a FRACTION of
 * the subtotal (0.14 = 14%), a fixed one an amount; either is rounded half
 * away from zero and clamped to `[0, subtotal]`; any other type is no
 * discount. The server reprices authoritatively at intake — this is only the
 * customer-facing estimate.
 */
export const calcDiscount = (
  subtotal: number,
  discount: DeliveryMenuDiscount | null | undefined,
): number => {
  const d =
    discount?.dtype === "percentage"
      ? decimalProduct(subtotal, rateOf(discount))
      : discount?.dtype === "fixed"
        ? decimalProduct(1, rateOf(discount))
        : 0;
  return Math.max(0, Math.min(d, subtotal));
};

/**
 * One unit of the item at `sizeLabel` (madar-catalog `unit_price`); with no
 * size, what a sizeless line costs — the "from" price. An item with no active
 * size is refused by the server; it shows its item price.
 */
export const itemBasePrice = (item: DeliveryMenuItem, sizeLabel: string | null): number =>
  unitPrice(storefrontItem(item), sizeLabel) ?? item.price;

/** Translate a configured line into the API's CartLineInput (server prices). */
export const toCartLineInput = (line: CartLine): CartLineInput => {
  const notes = line.notes?.trim() ? line.notes.trim() : null;
  if (line.combo) {
    // A combo line names the combo; the sizes live on its picks. No add-ons
    // inside a slot yet (v1) — the server takes picks without them.
    return {
      menu_item_id: line.item.id,
      size_label: null,
      quantity: line.quantity,
      addons: [],
      optional_field_ids: [],
      notes,
      combo: {
        picks: line.combo.picks.map((p) => ({
          slot_id: p.slot_id,
          menu_item_id: p.menu_item_id,
          size_label: displaySize(p.size_label),
          quantity: p.quantity,
        })),
      },
    };
  }
  return {
    menu_item_id: line.item.id,
    size_label: line.size_label,
    quantity: line.quantity,
    addons: line.addons.map((a) => ({ addon_item_id: a.addon_item_id, quantity: a.quantity })),
    optional_field_ids: line.optionals.map((o) => o.id),
    notes,
  };
};

/**
 * A stable fingerprint of what the server would price: it changes exactly
 * when the cart's content does, so a quote can be keyed on it and a stale one
 * recognised.
 */
export const cartContentKey = (lines: CartLine[]): string =>
  JSON.stringify(lines.map(toCartLineInput));

const CART_KEY_PREFIX = "madar_order_cart:";
const cartKey = (orgId: string, branchId: string) => `${CART_KEY_PREFIX}${orgId}:${branchId}`;

/**
 * Restore a previously-built cart for this org+branch. Lets a customer who
 * browsed a closed branch (or refreshed mid-build) keep their cart and check
 * out the moment a channel reopens. Server reprices authoritatively at intake,
 * so a stale snapshot is at worst a corrected estimate.
 */
export const loadCart = (orgId: string, branchId: string): CartLine[] => {
  try {
    const raw = localStorage.getItem(cartKey(orgId, branchId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
};

/** Persist (or, when empty, drop) the cart for this org+branch. */
export const saveCart = (orgId: string, branchId: string, lines: CartLine[]): void => {
  try {
    if (lines.length === 0) localStorage.removeItem(cartKey(orgId, branchId));
    else localStorage.setItem(cartKey(orgId, branchId), JSON.stringify(lines));
  } catch {
    /* storage unavailable — cart simply won't survive a refresh */
  }
};

/** Forget the persisted cart for this org+branch (e.g. after a placed order). */
export const clearCart = (orgId: string, branchId: string): void => {
  try {
    localStorage.removeItem(cartKey(orgId, branchId));
  } catch {
    /* ignore */
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

/**
 * The tracking page for an order, as a plain link (it opens in a new tab).
 *
 * Under the bundle's mount, not the host's root: on a shop's own hostname the
 * ordering app is served at `/order/`, and a bare `/track/<id>` there is the
 * shop's links page asking for a path it has never heard of — a not-found.
 * `BASE_URL` is the same base the router is given, so the two cannot disagree.
 */
export const trackHref = (orderId: string, base: string = import.meta.env.BASE_URL): string =>
  `${base.endsWith("/") ? base : `${base}/`}track/${encodeURIComponent(orderId)}`;
