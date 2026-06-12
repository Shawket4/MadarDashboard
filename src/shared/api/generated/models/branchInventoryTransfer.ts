/* eslint-disable */
// @ts-nocheck

export interface BranchInventoryTransfer {
  destination_branch_id: string;
  destination_branch_name: string;
  id: string;
  ingredient_name: string;
  initiated_at: string;
  initiated_by: string;
  initiated_by_name: string;
  /** @nullable */
  note?: string | null;
  org_id: string;
  org_ingredient_id: string;
  quantity: number;
  source_branch_id: string;
  source_branch_name: string;
  unit: string;
}
