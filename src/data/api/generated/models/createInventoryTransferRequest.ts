/* eslint-disable */
// @ts-nocheck

export interface CreateInventoryTransferRequest {
  source_branch_id: string;
  destination_branch_id: string;
  org_ingredient_id: string;
  quantity: number;
  /** @nullable */
  note?: string | null;
}
