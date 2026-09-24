/* eslint-disable */
// @ts-nocheck
import type { BranchPlan } from './branchPlan';
import type { PlanCategory } from './planCategory';
import type { PlanRegisteredDevice } from './planRegisteredDevice';
import type { SectionCount } from './sectionCount';

export interface BranchPlanView {
  branch_id: string;
  categories: PlanCategory[];
  devices: PlanRegisteredDevice[];
  /** Items routed to a section one by one, bypassing their category. */
  item_overrides: SectionCount[];
  /**
     * Kitchen items not yet bumped, per section. A section with any can't be
     * removed (spec KS-9, CH-4).
     */
  open_items: SectionCount[];
  plan: BranchPlan;
  /** The branch's kitchen routing mode as stored now. */
  routing_mode: string;
  /**
     * False until the plan is first saved. Until then it is assembled from the
     * branch's existing stations, printers and registered devices.
     */
  saved: boolean;
  /** Bumped by every save; send it back as `expected_version`. */
  version: number;
}
