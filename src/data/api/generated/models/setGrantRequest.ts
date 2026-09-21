/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';

export interface SetGrantRequest {
  capability: string;
  granted: boolean;
  limits?: null | LimitsView;
}
