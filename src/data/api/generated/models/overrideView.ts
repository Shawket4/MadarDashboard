/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';

export interface OverrideView {
  /** @nullable */
  branch_id?: string | null;
  effect: string;
  limits?: null | LimitsView;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  valid_to?: string | null;
}
