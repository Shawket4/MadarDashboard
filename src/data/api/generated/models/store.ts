/* eslint-disable */
// @ts-nocheck

/**
 * A wallet.
 */
export type Store = typeof Store[keyof typeof Store];


export const Store = {
  apple: 'apple',
  google: 'google',
} as const;
