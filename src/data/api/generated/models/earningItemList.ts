/* eslint-disable */
// @ts-nocheck
import type { EarningItem } from './earningItem';

/**
 * The list in force at a scope, and whether it came from the org.
 */
export interface EarningItemList {
  /** @nullable */
  branch_id?: string | null;
  /** True when these rows are the org's rather than this branch's own. */
  inherited: boolean;
  /** Empty means EVERY item collects — not that nothing does. */
  items: EarningItem[];
  org_id: string;
}
