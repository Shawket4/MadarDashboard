/* eslint-disable */
// @ts-nocheck
import type { PlanTill } from './planTill';

export interface PlanBranch {
  branch_id: string;
  name: string;
  /** The branch's POS tills, the active one first. */
  tills: PlanTill[];
}
