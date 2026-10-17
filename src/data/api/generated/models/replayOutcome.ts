/* eslint-disable */
// @ts-nocheck

export type ReplayOutcome = typeof ReplayOutcome[keyof typeof ReplayOutcome];


export const ReplayOutcome = {
  applied: 'applied',
  failed: 'failed',
  skipped: 'skipped',
} as const;
