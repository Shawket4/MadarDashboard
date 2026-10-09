/* eslint-disable */
// @ts-nocheck

/**
 * A location a transfer can go to or come from.
 */
export interface TransferLocation {
  id: string;
  /** `branch` | `warehouse` */
  kind: string;
  name: string;
}
