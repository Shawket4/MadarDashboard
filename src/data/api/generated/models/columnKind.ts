/* eslint-disable */
// @ts-nocheck

/**
 * The renderable kind of an output column (money vs count vs label vs a time
 * axis) so the frontend can format it and pick a chart.
 */
export type ColumnKind = typeof ColumnKind[keyof typeof ColumnKind];


export const ColumnKind = {
  money: 'money',
  count: 'count',
  label: 'label',
  date: 'date',
  number: 'number',
} as const;
