/* eslint-disable */
// @ts-nocheck
import type { MyAuthzLimits } from './myAuthzLimits';

/**
 * What the signed-in person may do. The dashboard and POS gate on this.
 */
export interface MyAuthz {
  /** Capabilities not held that show "ask a manager" instead of nothing. */
  ask_manager: string[];
  /** @nullable */
  branch_id?: string | null;
  /** Capability keys held. */
  capabilities: string[];
  epoch: number;
  /** Limits on held capabilities, by key; absent = unlimited. */
  limits: MyAuthzLimits;
  owner: boolean;
  platform: boolean;
  /** Role kinds held here (org_admin, branch_manager, teller, waiter, kitchen). */
  role_kinds: string[];
  /** @minimum 0 */
  spec_version: number;
  user_id: string;
}
