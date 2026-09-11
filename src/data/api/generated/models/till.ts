/* eslint-disable */
// @ts-nocheck

export interface Till {
  branch_id: string;
  created_at: string;
  id: string;
  is_active: boolean;
  is_default: boolean;
  name: string;
  org_id: string;
  /**
     * The cash that should be in this drawer at the start of a shift, in
     * minor units. The shift report proposes closing at it ("leave the float,
     * drop the rest into the safe"); `None` means the shop has not decided
     * and nothing is proposed.
     * @nullable
     */
  standard_float?: number | null;
  updated_at: string;
}
