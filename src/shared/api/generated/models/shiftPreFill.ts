/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { Shift } from './shift';

export interface ShiftPreFill {
  has_open_shift: boolean;
  open_shift?: null | Shift;
  suggested_opening_cash: number;
}
