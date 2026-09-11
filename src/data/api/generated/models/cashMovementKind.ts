/* eslint-disable */
// @ts-nocheck

/**
 * What a cash movement IS, which fixes its sign. The DB holds this as a text
 * column under `shift_cash_movements_kind_is_known` (same convention as
 * `order_type`), so the wire value is the snake_case label and the model
 * carries it as a plain `String`; this enum exists so the handler can validate
 * a request before the CHECK turns a teller's mistake into a 500.
 */
export type CashMovementKind = typeof CashMovementKind[keyof typeof CashMovementKind];


export const CashMovementKind = {
  pay_in: 'pay_in',
  pay_out: 'pay_out',
  safe_drop: 'safe_drop',
  correction: 'correction',
} as const;
