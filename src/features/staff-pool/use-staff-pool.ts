/**
 * The scope a staff-pool screen is looking at, and the settings in force there.
 *
 * The org row is the default every branch runs on; a branch row REPLACES it
 * wholesale. Half-inherited rules are impossible to reason about at a counter,
 * and this is a counter feature — a teller pressing "staff drink" must be able
 * to be told one allowance, not a merge of two.
 *
 * A branch query answers with the settings IN FORCE either way, under the
 * branch's id; the server's `inherited` flag says whether they are the
 * organisation's. (Comparing `branch_id` with the branch asked about never
 * worked: an inherited row comes back labelled with the branch.)
 */
import { useGetStaffPoolSettings } from "@/data/api/generated/api";
import { staffPoolSettingsParams } from "./queries";

export interface StaffPoolScope {
  orgId: string;
  /** null = the organisation's own default. */
  branchId: string | null;
}

export function useStaffPoolSettings(scope: StaffPoolScope, enabled = true) {
  const query = useGetStaffPoolSettings(staffPoolSettingsParams(scope.branchId), { query: { enabled } });
  return {
    query,
    settings: query.data,
    /** This branch has no rules of its own and follows the organisation. */
    inherited: Boolean(scope.branchId) && query.data?.inherited === true,
  };
}
