/* eslint-disable */
// @ts-nocheck

export type RevenueClass = typeof RevenueClass[keyof typeof RevenueClass];


export const RevenueClass = {
  hero: 'hero',
  steady: 'steady',
  slow: 'slow',
  quiet: 'quiet',
} as const;
