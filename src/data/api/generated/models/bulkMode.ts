/* eslint-disable */
// @ts-nocheck

export type BulkMode = typeof BulkMode[keyof typeof BulkMode];


export const BulkMode = {
  add: 'add',
  replace: 'replace',
} as const;
