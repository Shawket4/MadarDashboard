/* eslint-disable */
// @ts-nocheck
import type { ExplainStep } from './explainStep';

export interface Explanation {
  ask_manager: boolean;
  capability: string;
  effective: boolean;
  label_ar: string;
  label_en: string;
  steps: ExplainStep[];
}
