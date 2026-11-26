/* eslint-disable */
// @ts-nocheck

/**
 * Where a value sits in its cell. `start` is the reading side (left in
 * English, right in Arabic).
 */
export type PrintAlign = typeof PrintAlign[keyof typeof PrintAlign];


export const PrintAlign = {
  start: 'start',
  center: 'center',
  end: 'end',
} as const;
