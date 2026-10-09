/* eslint-disable */
// @ts-nocheck

export type TransferStatus = typeof TransferStatus[keyof typeof TransferStatus];


export const TransferStatus = {
  requested: 'requested',
  draft: 'draft',
  dispatched: 'dispatched',
  received: 'received',
  cancelled: 'cancelled',
} as const;
