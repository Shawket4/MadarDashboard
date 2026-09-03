/* eslint-disable */
// @ts-nocheck

/**
 * What a tier costs the employee.
 */
export type LateDeductionKind = typeof LateDeductionKind[keyof typeof LateDeductionKind];


export const LateDeductionKind = {
  minutes: 'minutes',
  piastres: 'piastres',
  day_fraction: 'day_fraction',
} as const;
