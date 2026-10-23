/* eslint-disable */
// @ts-nocheck

/**
 * The stamp's shape.
 */
export type StampShape = typeof StampShape[keyof typeof StampShape];


export const StampShape = {
  circle: 'circle',
  square: 'square',
  star: 'star',
  heart: 'heart',
  cup: 'cup',
  gift: 'gift',
  check: 'check',
} as const;
