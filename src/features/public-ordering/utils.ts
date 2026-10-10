import type { CartLineInput } from "@/data/api/generated/models/cartLineInput";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryMenuDiscount } from "@/data/api/generated/models/deliveryMenuDiscount";

import { storefrontItem, unitPrice } from "./pricing";
import type { CartLine, Channel } from "./types";
import { rateOf } from "@/lib/format";
import { type CartLineShape, rules } from "@/lib/rules";

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

/**
 * A cart line as madar-money's `CartLineShape`: an item's size price, add-ons
 * and optionals, or a combo's own price and what each pick adds per unit (the
 * storefront's picks carry no add-ons yet, v1).
 */
const lineShape = (line: CartLine): CartLineShape =>
  line.combo
    ? {
        combo: {
          quantity: line.quantity,
          price: line.base_price,
          picks: line.combo.picks.map((p) => ({ quantity: p.quantity, surcharge_unit: p.extra })),
        },
      }
    : {
        item: {
          quantity: line.quantity,
          unit_price: line.base_price,
          addons: line.addons.map((a) => ({ price_modifier: a.price, quantity: a.quantity })),
          optionals: line.optionals.map((o) => o.price),
        },
      };

/**
 * The unit (per-quantity) price of a configured line, in piastres (madar-money
 * `cart_line_unit`, WebAssembly): an estimate; the server prices it at intake.
 */
export const lineUnitPrice = (line: CartLine): number => rules.cart_line_unit(lineShape(line));

/** The total estimated price of a configured line (× quantity), in piastres (`cart_line_total`). */
export const lineTotal = (line: CartLine): number => rules.cart_line_total(lineShape(line));

/** The estimated subtotal of the whole cart, in piastres (`cart_subtotal`, the quote's `items_total`). */
export const cartSubtotal = (lines: CartLine[]): number => rules.cart_subtotal(lines.map(lineShape));

/**
 * Estimated discount (piastres) the channel discount knocks off the subtotal:
 * madar-money's `bill::rule_of` + `discount_on` (WebAssembly; in the public
 * package). A percentage is a FRACTION of the subtotal (0.14 = 14%), a fixed
 * one an amount; either is rounded half away from zero and clamped to
 * `[0, subtotal]`; any other type is no discount. The rate crosses as its
 * shortest decimal string, so 0.145 is 0.145, not 0.14499…. The server
 * reprices authoritatively at intake — this is only the customer-facing estimate.
 */
export const calcDiscount = (
  subtotal: number,
  discount: DeliveryMenuDiscount | null | undefined,
): number => (discount ? rules.bill_discount(subtotal, discount.dtype, String(rateOf(discount))) : 0);

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
