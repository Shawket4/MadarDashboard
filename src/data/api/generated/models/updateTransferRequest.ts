/* eslint-disable */
// @ts-nocheck
import type { TransferLineInput } from './transferLineInput';

/**
 * `PATCH /inventory/transfers/{id}`. `lines`, when given, replaces every
 * line (only while `requested` or `draft`).
 */
export interface UpdateTransferRequest {
  /** @nullable */
  lines?: TransferLineInput[] | null;
  /** @nullable */
  note?: string | null;
}
