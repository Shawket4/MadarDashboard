/* eslint-disable */
// @ts-nocheck

/**
 * Named relative windows, resolved in the merchant's timezone.
 */
export type PeriodPreset = typeof PeriodPreset[keyof typeof PeriodPreset];


export const PeriodPreset = {
  today: 'today',
  yesterday: 'yesterday',
  this_week: 'this_week',
  last_week: 'last_week',
  this_month: 'this_month',
  last_month: 'last_month',
  this_year: 'this_year',
  last_year: 'last_year',
  last_7_days: 'last_7_days',
  last_30_days: 'last_30_days',
  last_90_days: 'last_90_days',
  last_12_months: 'last_12_months',
  all_time: 'all_time',
} as const;
