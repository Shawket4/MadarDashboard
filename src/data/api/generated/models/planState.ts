/* eslint-disable */
// @ts-nocheck
import type { PlanBranch } from './planBranch';
import type { PlanStateEntitlements } from './planStateEntitlements';

export interface PlanState {
  /**
     * Active add-on keys (Rewards by Madar: `["loyalty"]`), already inside
     * `entitlements.features`.
     */
  addons?: string[];
  /**
     * The plan's branch limit, `null` for unlimited.
     * @minimum 0
     * @nullable
     */
  branch_limit?: number | null;
  branches: PlanBranch[];
  /**
     * What the plan allows: `{features: [..], limits: {branches,
     * pos_devices_per_branch, kds_devices, waiter_devices}, realtime}`
     * (madar-plan's `Entitlements`). A limit that is `null` is unlimited.
     */
  entitlements: PlanStateEntitlements;
  /** POS tills the plan has switched off. */
  inactive_tills: number;
  /** Live selling branches (not deleted, not warehouses). */
  live_branches: number;
  org_id: string;
  /**
     * Past the plan's branch limit (a downgraded org keeps all its branches
     * and cannot add one).
     */
  over_branch_limit: boolean;
  /** `free` | `paid`. */
  plan: string;
  /** `admin` | `self`. */
  signup_source: string;
}
