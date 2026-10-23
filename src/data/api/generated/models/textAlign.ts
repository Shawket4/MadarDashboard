/* eslint-disable */
// @ts-nocheck

/**
 * Alignment in reading order (`start` is the right edge on an Arabic pass).
 */
export type TextAlign = typeof TextAlign[keyof typeof TextAlign];


export const TextAlign = {
  start: 'start',
  centre: 'centre',
  end: 'end',
} as const;
