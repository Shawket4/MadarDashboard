/* eslint-disable */
// @ts-nocheck
import type { LabourWarning } from './labourWarning';

/**
 * A claim decision: the labour limits the approved day now breaks (a long
 * day, a short rest). A warning, never a block (RU-13, minor default M26).
 */
export interface ClaimDecision {
  /** `approved` · `rejected` */
  status: string;
  warnings: LabourWarning[];
}
