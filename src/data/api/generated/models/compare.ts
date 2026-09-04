/* eslint-disable */
// @ts-nocheck

/**
 * Period-over-period comparison mode.
 */
export type Compare = typeof Compare[keyof typeof Compare];


export const Compare = {
  none: 'none',
  previous_period: 'previous_period',
  previous_year: 'previous_year',
} as const;
