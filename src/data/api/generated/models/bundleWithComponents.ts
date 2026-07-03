/* eslint-disable */
// @ts-nocheck
import type { Bundle } from './bundle';
import type { BundleComponentHydrated } from './bundleComponentHydrated';

export type BundleWithComponents = Bundle & ({
  branch_ids: string[];
  components: BundleComponentHydrated[];
  /** Sum of the KNOWN component costs × quantity, in piastres. When
   * `cost_missing` is true this is a partial rollup (old-wire semantics) —
   * render it as unknown, never as 0. */
  computed_cost: number;
  /**
     * True when at least one component's cost is unknown.
     * @nullable
     */
  cost_missing?: boolean | null;
});
