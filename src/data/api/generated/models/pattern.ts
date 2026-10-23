/* eslint-disable */
// @ts-nocheck

export type Pattern = typeof Pattern[keyof typeof Pattern];


export const Pattern = {
  dots: 'dots',
  lines: 'lines',
  grid: 'grid',
} as const;
