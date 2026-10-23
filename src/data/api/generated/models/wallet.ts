/* eslint-disable */
// @ts-nocheck

/**
 * A wallet a member may hold the card in.
 */
export type Wallet = typeof Wallet[keyof typeof Wallet];


export const Wallet = {
  apple: 'apple',
  google: 'google',
  none: 'none',
} as const;
