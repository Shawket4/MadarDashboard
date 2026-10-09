/* eslint-disable */
// @ts-nocheck
import type { TransferLineInput } from './transferLineInput';

/**
 * `POST /inventory/transfers/{id}/accept`: a request becomes the source's
 * draft, optionally with its lines changed.
 */
export interface AcceptTransferRequest {
  /** @nullable */
  lines?: TransferLineInput[] | null;
}
