/* eslint-disable */
// @ts-nocheck

export type Confidence = typeof Confidence[keyof typeof Confidence];


export const Confidence = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;
