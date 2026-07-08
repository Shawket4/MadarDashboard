/* eslint-disable */
// @ts-nocheck

/**
 * A hint for how the result is best visualized. The frontend may override.
 */
export type ChartHint = typeof ChartHint[keyof typeof ChartHint];


export const ChartHint = {
  table: 'table',
  bar: 'bar',
  line: 'line',
  pie: 'pie',
} as const;
