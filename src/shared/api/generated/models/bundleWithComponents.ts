/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { Bundle } from './bundle';
import type { BundleComponentHydrated } from './bundleComponentHydrated';

export type BundleWithComponents = Bundle & {
  branch_ids: string[];
  components: BundleComponentHydrated[];
  computed_cost: number;
};
