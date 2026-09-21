/**
 * Reading a staff drink off an order's lines.
 *
 * A staff drink is an ordinary sale whose pooled line is free for its BASE
 * configuration only — the smallest size and the default of each required
 * choice. The server stores the money NET: `unit_price` stays the normal price,
 * but `line_total` and each add-on's `line_total` already have the comp taken
 * off, and so do the order's subtotal, tax and total. So nothing here subtracts
 * the comp from a stored figure — it only ADDS it back, to show the price the
 * line would have rung at, and what came off it.
 */
import type { OrderItem, OrderItemAddon, OrderItemOptional } from "@/data/api/generated/models";

type StaffAddon = Pick<OrderItemAddon, "line_total" | "staff_comp_minor">;
type StaffItem = Pick<OrderItem, "line_total" | "quantity" | "staff_comp_minor" | "staff_drink_id"> & {
  addons?: StaffAddon[];
  optionals?: Pick<OrderItemOptional, "price">[];
};

export interface StaffDrinkLine {
  /** What the whole line — size, add-ons, optionals — rings at normally. */
  normal: number;
  /** What the pool gave free, size part and required-choice part together. */
  comp: number;
  /** What the line was still charged. `normal − comp`, never negative. */
  charged: number;
}

export const isStaffDrinkLine = (it: Pick<OrderItem, "staff_comp_minor" | "staff_drink_id">): boolean =>
  (it.staff_comp_minor ?? 0) > 0 || !!it.staff_drink_id;

export function staffDrinkLine(it: StaffItem): StaffDrinkLine | null {
  if (!isStaffDrinkLine(it)) return null;
  const comp = Math.max(0, it.staff_comp_minor ?? 0);
  const addons = (it.addons ?? []).reduce((s, a) => s + a.line_total, 0);
  // An optional carries a per-unit price and no total of its own.
  const optionals = (it.optionals ?? []).reduce((s, o) => s + o.price, 0) * it.quantity;
  const charged = it.line_total + addons + optionals;
  return { normal: charged + comp, comp, charged };
}

/** What an add-on rings at normally: its stored total with its comp put back. */
export const addonNormalTotal = (a: StaffAddon): number => a.line_total + Math.max(0, a.staff_comp_minor ?? 0);

/** Everything the pool gave free across an order. 0 on an ordinary sale. */
export const orderStaffComp = (items: Pick<OrderItem, "staff_comp_minor">[] | undefined): number =>
  (items ?? []).reduce((s, it) => s + Math.max(0, it.staff_comp_minor ?? 0), 0);
