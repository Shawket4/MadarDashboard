/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';

export interface SetOverrideRequest {
  /** @nullable */
  branch_id?: string | null;
  capability: string;
  /** inherit | allow | deny */
  effect: string;
  limits?: null | LimitsView;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  valid_to?: string | null;
}
