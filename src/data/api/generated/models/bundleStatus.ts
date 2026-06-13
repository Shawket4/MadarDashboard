/* eslint-disable */
// @ts-nocheck

export type BundleStatus = typeof BundleStatus[keyof typeof BundleStatus];


export const BundleStatus = {
  draft: 'draft',
  active: 'active',
  archived: 'archived',
} as const;
