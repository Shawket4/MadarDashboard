/* eslint-disable */
// @ts-nocheck

/**
 * The *shape* of a result set, derived from the dimensions a query groups by.
 * This is what lets a dashboard render any metric with no per-metric code: a
 * scalar becomes a KPI card, a series becomes a line, a breakdown becomes a
 * bar or pie.
 */
export type Grain = typeof Grain[keyof typeof Grain];


export const Grain = {
  scalar: 'scalar',
  series: 'series',
  categorical: 'categorical',
  table: 'table',
} as const;
