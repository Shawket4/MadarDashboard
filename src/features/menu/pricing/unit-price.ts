import { rules } from "@/lib/rules";

/** A size as `madar_catalog::price::unit_price` reads it. */
export interface PricedSize {
  label: string;
  /** The catalogue price; null when only a branch override names the label. */
  price: number | null;
  is_active: boolean;
  /** The branch's price for this size. */
  branch_price?: number | null;
}

/**
 * What one unit of an item costs at `label`, as the server and the till price
 * it: madar-catalog's `unit_price`, through WebAssembly. Null when no active
 * size has a price (the server refuses the line).
 */
export function unitPrice(sizes: PricedSize[], label: string | null, itemBranchPrice: number | null = null): number | null {
  const p = rules.unit_price({ id: "", branch_price: itemBranchPrice, sizes }, label);
  return typeof p === "number" ? p : null;
}
