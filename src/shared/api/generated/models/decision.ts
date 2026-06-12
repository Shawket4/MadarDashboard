/* eslint-disable */
// @ts-nocheck

export type Decision = typeof Decision[keyof typeof Decision];


export const Decision = {
  accepted: 'accepted',
  rejected: 'rejected',
  ignored: 'ignored',
} as const;
