/* eslint-disable */
// @ts-nocheck

/**
 * OpenAPI-only vocabulary for `Till.status` (the `till_status` DB enum). The
 * struct fields stay `String`, so the wire strings are exactly the DB values.
 */
export type TillStatus = typeof TillStatus[keyof typeof TillStatus];


export const TillStatus = {
  open: 'open',
  closed: 'closed',
  force_closed: 'force_closed',
} as const;
