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
  /**
     * Optional audit note. Never required: an absent or empty reason is
     * accepted for every capability. Stored (trimmed) when it is sent.
     * @nullable
     */
  reason?: string | null;
  /** @nullable */
  valid_to?: string | null;
}
