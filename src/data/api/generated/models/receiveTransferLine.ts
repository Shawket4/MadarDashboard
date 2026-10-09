/* eslint-disable */
// @ts-nocheck

/**
 * One line as it arrived.
 */
export interface ReceiveTransferLine {
  line_id: string;
  /** @nullable */
  note?: string | null;
  /** 0 or more. More than sent needs `note`. */
  qty_received: number;
}
