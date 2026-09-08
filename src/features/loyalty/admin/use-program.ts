/**
 * The scope a loyalty screen is looking at, and the settings in force there.
 *
 * The org row is the default every branch runs on, and a branch row REPLACES it
 * wholesale for that branch — wholesale rather than field-by-field, because a
 * half-inherited earn rule is impossible to reason about at a counter. An admin
 * looking at a branch sees exactly the numbers that branch uses.
 *
 * `inherited` is the one thing that cannot be read off the response: the API
 * answers a branch query with the settings IN FORCE, so the only way to tell an
 * override from an inheritance is whether `branch_id` came back matching what
 * was asked for.
 */
import { useGetLoyaltySettings } from "@/data/api/generated/api";

import { isOwnOverride } from "../shared/util";

export interface ProgramScope {
  orgId: string;
  /** null = the organisation's own default. */
  branchId: string | null;
}

export function useProgram(scope: ProgramScope) {
  const params = scope.branchId ? { branch_id: scope.branchId } : {};
  const query = useGetLoyaltySettings(params);
  return {
    query,
    settings: query.data,
    /** This branch has no rules of its own and follows the organisation. */
    inherited: Boolean(scope.branchId) && !isOwnOverride(query.data, scope.branchId),
  };
}
