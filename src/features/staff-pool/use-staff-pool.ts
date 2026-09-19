/**
 * The scope a staff-pool screen is looking at, and the settings in force there.
 *
 * The org row is the default every branch runs on; a branch row REPLACES it
 * wholesale. Half-inherited rules are impossible to reason about at a counter,
 * and this is a counter feature — a teller pressing "staff drink" must be able
 * to be told one allowance, not a merge of two.
 *
 * `inherited` is the one thing that cannot be read off the response: a branch
 * query answers with the settings IN FORCE either way.
 */
import { useGetStaffPoolSettings } from "@/data/api/generated/api";

import { isOwnOverride } from "./form-schema";

export interface StaffPoolScope {
  orgId: string;
  /** null = the organisation's own default. */
  branchId: string | null;
}

export function useStaffPoolSettings(scope: StaffPoolScope, enabled = true) {
  const params = scope.branchId ? { branch_id: scope.branchId } : {};
  const query = useGetStaffPoolSettings(params, { query: { enabled } });
  return {
    query,
    settings: query.data,
    /** This branch has no rules of its own and follows the organisation. */
    inherited: Boolean(scope.branchId) && !isOwnOverride(query.data, scope.branchId),
  };
}
