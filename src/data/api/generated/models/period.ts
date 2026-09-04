/* eslint-disable */
// @ts-nocheck
import type { PeriodPreset } from './periodPreset';

/**
 * The reporting window.
 *
 * Prefer a [`PeriodPreset`]: it is resolved server-side against the merchant's
 * timezone at query time, which means a dashboard widget saying "last 30 days"
 * stays correct forever, and a language model never has to do calendar
 * arithmetic — historically the single largest source of wrong answers.
 */
export interface Period {
  /**
     * Explicit inclusive lower bound.
     * @nullable
     */
  from?: string | null;
  preset?: null | PeriodPreset;
  /**
     * Explicit inclusive upper bound.
     * @nullable
     */
  to?: string | null;
}
