/* eslint-disable */
// @ts-nocheck

/**
 * `POST /inventory/transfers/{id}/decline` (note required) and
 * `POST /inventory/transfers/{id}/cancel` (note optional).
 */
export interface CloseTransferRequest {
  /** @nullable */
  note?: string | null;
}
