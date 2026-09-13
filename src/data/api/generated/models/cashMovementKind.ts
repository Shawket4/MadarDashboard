/* eslint-disable */
// @ts-nocheck

/**
 * What a cash movement IS, which fixes its sign.
 */
export type CashMovementKind = typeof CashMovementKind[keyof typeof CashMovementKind];


export const CashMovementKind = {
  pay_in: 'pay_in',
  pay_out: 'pay_out',
  safe_drop: 'safe_drop',
  correction: 'correction',
} as const;
