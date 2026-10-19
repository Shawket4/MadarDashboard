/* eslint-disable */
// @ts-nocheck

/**
 * Which kind of choice a group is, the `legacy_addon_type` the POS reads.
 */
export type BulkFamily = typeof BulkFamily[keyof typeof BulkFamily];


export const BulkFamily = {
  milk_type: 'milk_type',
  coffee_type: 'coffee_type',
  extra: 'extra',
} as const;
