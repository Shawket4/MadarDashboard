/* eslint-disable */
// @ts-nocheck
import type { DayBlock } from './dayBlock';

export interface PutDayRequest {
  employee_id: string;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /** Every shift the person works that date; empty = a day off. */
  shifts: DayBlock[];
}
