/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';

export interface GrantView {
  capability: string;
  limits: LimitsView;
  /** "template" or "custom" (an owner edited it). */
  source: string;
}
