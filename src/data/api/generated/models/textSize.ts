/* eslint-disable */
// @ts-nocheck

export type TextSize = typeof TextSize[keyof typeof TextSize];


export const TextSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const;
