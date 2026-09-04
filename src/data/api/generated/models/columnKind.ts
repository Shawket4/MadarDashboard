/* eslint-disable */
// @ts-nocheck

/**
 * The renderable kind of an output column, so a client can format it and pick
 * a sensible chart without knowing anything about the underlying SQL.
 */
export type ColumnKind = typeof ColumnKind[keyof typeof ColumnKind];


export const ColumnKind = {
  money: 'money',
  count: 'count',
  label: 'label',
  date: 'date',
  number: 'number',
  minutes: 'minutes',
} as const;
