/* eslint-disable */
// @ts-nocheck

/**
 * Which ingredients a catalog or stock list returns, by archive state.
 */
export type ArchiveFilter = typeof ArchiveFilter[keyof typeof ArchiveFilter];


export const ArchiveFilter = {
  active: 'active',
  archived: 'archived',
  all: 'all',
} as const;
