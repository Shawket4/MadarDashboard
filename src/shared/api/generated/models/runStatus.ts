/* eslint-disable */
// @ts-nocheck

export type RunStatus = typeof RunStatus[keyof typeof RunStatus];


export const RunStatus = {
  in_progress: 'in_progress',
  completed: 'completed',
  failed: 'failed',
} as const;
