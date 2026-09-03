/* eslint-disable */
// @ts-nocheck
import type { LateDeductionKind } from './lateDeductionKind';

/**
 * One rung of the late-penalty ladder. Ranges are inclusive at both ends;
 * `to_minutes = None` is the open-ended top rung.
 */
export interface LateTier {
  from_minutes: number;
  kind: LateDeductionKind;
  /** @nullable */
  to_minutes?: number | null;
  value: number;
}
