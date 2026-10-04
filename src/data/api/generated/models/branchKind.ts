/* eslint-disable */
// @ts-nocheck

/**
 * What a `branches` row is. A warehouse holds stock and never sells.
 */
export type BranchKind = typeof BranchKind[keyof typeof BranchKind];


export const BranchKind = {
  branch: 'branch',
  warehouse: 'warehouse',
} as const;
