/* eslint-disable */
// @ts-nocheck

/**
 * Where a remembered price came from.
 */
export type LastPriceSource = typeof LastPriceSource[keyof typeof LastPriceSource];


export const LastPriceSource = {
  supplier: 'supplier',
  any: 'any',
} as const;
