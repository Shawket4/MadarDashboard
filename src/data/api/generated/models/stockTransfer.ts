/* eslint-disable */
// @ts-nocheck
import type { BranchKind } from './branchKind';
import type { StockTransferLine } from './stockTransferLine';
import type { TransferStamp } from './transferStamp';
import type { TransferStatus } from './transferStatus';

export interface StockTransfer {
  cancelled?: null | TransferStamp;
  created: TransferStamp;
  destination_branch_id: string;
  destination_branch_name: string;
  destination_kind: BranchKind;
  dispatched?: null | TransferStamp;
  id: string;
  lines: StockTransferLine[];
  /** @nullable */
  note?: string | null;
  org_id: string;
  received?: null | TransferStamp;
  /** `TR-1043`, per org. */
  reference: string;
  requested?: null | TransferStamp;
  source_branch_id: string;
  source_branch_name: string;
  source_kind: BranchKind;
  status: TransferStatus;
}
