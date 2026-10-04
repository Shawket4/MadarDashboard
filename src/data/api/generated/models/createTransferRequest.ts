/* eslint-disable */
// @ts-nocheck
import type { TransferLineInput } from './transferLineInput';

/**
 * `POST /inventory/transfers`. With `request: true` the DESTINATION asks
 * (status `requested`); otherwise the SOURCE starts a `draft`.
 */
export interface CreateTransferRequest {
  destination_branch_id: string;
  /** At least one; each ingredient once. */
  lines: TransferLineInput[];
  /** @nullable */
  note?: string | null;
  request?: boolean;
  source_branch_id: string;
}
