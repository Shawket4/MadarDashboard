/* eslint-disable */
// @ts-nocheck

export type RemovalRecommendation = typeof RemovalRecommendation[keyof typeof RemovalRecommendation];


export const RemovalRecommendation = {
  remove: 'remove',
  keep_and_bundle: 'keep_and_bundle',
  keep_and_reformulate: 'keep_and_reformulate',
  no_strong_signal: 'no_strong_signal',
} as const;
