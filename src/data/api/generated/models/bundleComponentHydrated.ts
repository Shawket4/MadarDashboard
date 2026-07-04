/* eslint-disable */
// @ts-nocheck

export interface BundleComponentHydrated {
  bundle_id: string;
  id: string;
  /**
     * Cost of the component (at its base size) in piastres. When
     * `item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the
     * wire for old-client compat) — display it as unknown, not as money.
     */
  item_cost: number;
  /**
     * True when the component's cost could not be fully resolved.
     * @nullable
     */
  item_cost_missing?: boolean | null;
  item_id: string;
  item_name: string;
  item_price: number;
  position: number;
  quantity: number;
}
