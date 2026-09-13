/* eslint-disable */
// @ts-nocheck

/**
 * OpenAPI-only vocabulary for `Till.verification` (`tills_verification` CHECK):
 * how the one-open-till-per-person rule was checked when the till opened.
 * `legacy` marks tills opened by pre-rework clients / before the rework.
 */
export type TillVerification = typeof TillVerification[keyof typeof TillVerification];


export const TillVerification = {
  server: 'server',
  lan: 'lan',
  unverified: 'unverified',
  legacy: 'legacy',
} as const;
