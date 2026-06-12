/* eslint-disable */
// @ts-nocheck

/**
 * Serializes as `"EgyptianCafe"` / `"NearestUnit"` — PascalCase on the wire
 * (no `rename_all`); existing clients depend on it.
 */
export type PriceRoundingRule = typeof PriceRoundingRule[keyof typeof PriceRoundingRule];


export const PriceRoundingRule = {
  EgyptianCafe: 'EgyptianCafe',
  NearestUnit: 'NearestUnit',
} as const;
