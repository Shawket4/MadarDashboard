/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateTransferRequest {
  destination_branch_id: string;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  quantity: number;
  source_branch_id: string;
}
