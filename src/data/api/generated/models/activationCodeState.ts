/* eslint-disable */
// @ts-nocheck

export type ActivationCodeState = typeof ActivationCodeState[keyof typeof ActivationCodeState];


export const ActivationCodeState = {
  free: 'free',
  used: 'used',
  expired: 'expired',
  revoked: 'revoked',
} as const;
