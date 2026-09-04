/* eslint-disable */
// @ts-nocheck

/**
 * Sort direction. `Asc` is what unlocks "worst", "slowest", "least" questions.
 */
export type Dir = typeof Dir[keyof typeof Dir];


export const Dir = {
  asc: 'asc',
  desc: 'desc',
} as const;
