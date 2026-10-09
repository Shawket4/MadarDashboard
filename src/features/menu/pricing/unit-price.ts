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
 * it (`madar_catalog::price::unit_price`): the branch's price for the size,
 * else its catalogue price while it is active, else the item's branch price,
 * else the item's lowest active catalogue price. Null when no active size has
 * a price (the server refuses the line).
 */
export function unitPrice(sizes: PricedSize[], label: string | null, itemBranchPrice: number | null = null): number | null {
  const active = sizes.flatMap((s) => (s.is_active && s.price != null ? [s.price] : []));
  if (!active.length) return null;
  const fallback = itemBranchPrice ?? Math.min(...active);
  if (label === null) return fallback;
  return (
    sizes.find((s) => s.label === label)?.branch_price ??
    sizes.find((s) => s.label === label && s.is_active)?.price ??
    fallback
  );
}
