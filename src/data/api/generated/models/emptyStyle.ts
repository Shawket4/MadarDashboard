/* eslint-disable */
// @ts-nocheck

/**
 * How a stamp not yet earned looks.
 */
export type EmptyStyle = typeof EmptyStyle[keyof typeof EmptyStyle];


export const EmptyStyle = {
  outline: 'outline',
  faint: 'faint',
} as const;
