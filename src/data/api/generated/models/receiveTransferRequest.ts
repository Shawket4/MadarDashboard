/* eslint-disable */
// @ts-nocheck
import type { ReceiveTransferLine } from './receiveTransferLine';

/**
 * `POST /inventory/transfers/{id}/receive`: every line, once. Closes it.
 */
export interface ReceiveTransferRequest {
  lines: ReceiveTransferLine[];
  /** @nullable */
  note?: string | null;
}
