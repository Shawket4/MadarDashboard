/* eslint-disable */
// @ts-nocheck

/**
 * What a programme collects. One track only for points.
 */
export type Mode = typeof Mode[keyof typeof Mode];


export const Mode = {
  points: 'points',
  visits: 'visits',
} as const;
